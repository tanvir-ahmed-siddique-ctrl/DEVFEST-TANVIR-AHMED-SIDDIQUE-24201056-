import type {
  ExpiryDates,
  Matches,
  Requirement,
  RequirementStatus,
  RequirementsData,
  UploadedPdf,
  ValidationIssue,
} from '../types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function validateRequirementsData(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!input || typeof input !== 'object') return [{ code: 'ROOT_OBJECT_REQUIRED', path: '$' }]

  const root = input as Record<string, unknown>
  const tender = root.tender as Record<string, unknown> | undefined
  const requirements = root.requirements
  if (!tender || typeof tender !== 'object') issues.push({ code: 'TENDER_REQUIRED', path: '$.tender' })
  else {
    for (const field of ['tender_id', 'title', 'procuring_entity', 'bidder'] as const) {
      if (typeof tender[field] !== 'string' || !String(tender[field]).trim()) {
        issues.push({ code: 'TEXT_REQUIRED', path: `$.tender.${field}` })
      }
    }
    if (!isIsoDate(tender.submission_deadline)) {
      issues.push({ code: 'INVALID_DATE', path: '$.tender.submission_deadline' })
    }
  }

  if (!Array.isArray(requirements) || requirements.length === 0) {
    issues.push({ code: 'REQUIREMENTS_REQUIRED', path: '$.requirements' })
    return issues
  }

  const ids = new Set<string>()
  const orders = new Set<number>()
  requirements.forEach((value, index) => {
    const path = `$.requirements[${index}]`
    if (!value || typeof value !== 'object') {
      issues.push({ code: 'REQUIREMENT_OBJECT_REQUIRED', path })
      return
    }
    const item = value as Record<string, unknown>
    if (typeof item.id !== 'string' || !item.id.trim()) issues.push({ code: 'ID_REQUIRED', path: `${path}.id` })
    else if (ids.has(item.id)) issues.push({ code: 'DUPLICATE_ID', path: `${path}.id` })
    else ids.add(item.id)

    if (!Number.isInteger(item.order) || Number(item.order) < 1) issues.push({ code: 'INVALID_ORDER', path: `${path}.order` })
    else if (orders.has(Number(item.order))) issues.push({ code: 'DUPLICATE_ORDER', path: `${path}.order` })
    else orders.add(Number(item.order))

    for (const field of ['title_en', 'title_bn'] as const) {
      if (typeof item[field] !== 'string' || !String(item[field]).trim()) issues.push({ code: 'TEXT_REQUIRED', path: `${path}.${field}` })
    }
    for (const field of ['mandatory', 'has_expiry'] as const) {
      if (typeof item[field] !== 'boolean') issues.push({ code: 'BOOLEAN_REQUIRED', path: `${path}.${field}` })
    }
  })
  return issues
}

export function parseRequirementsData(input: unknown): RequirementsData {
  const issues = validateRequirementsData(input)
  if (issues.length) throw new Error(issues.map((issue) => `${issue.code}:${issue.path}`).join('|'))
  const data = input as RequirementsData
  return { ...data, requirements: [...data.requirements].sort((a, b) => a.order - b.order) }
}

export function getRequirementStatus(
  requirement: Requirement,
  matchedFileId: string | undefined,
  expiryDate: string | undefined,
  submissionDeadline: string,
): RequirementStatus {
  if (!matchedFileId) return requirement.mandatory ? 'Missing' : 'Not provided'
  if (!requirement.has_expiry) return 'OK'
  if (!expiryDate || !isIsoDate(expiryDate)) return 'Expiry date needed'
  return expiryDate < submissionDeadline ? 'Expired' : 'OK'
}

export function isBlocking(status: RequirementStatus): boolean {
  return status === 'Missing' || status === 'Expiry date needed' || status === 'Expired'
}

export function getStatuses(data: RequirementsData, matches: Matches, expiryDates: ExpiryDates) {
  return data.requirements.map((requirement) => {
    const status = getRequirementStatus(
      requirement,
      matches[requirement.id],
      expiryDates[requirement.id],
      data.tender.submission_deadline,
    )
    return { requirement, status, blocking: isBlocking(status) }
  })
}

export function getMatchConflict(
  requirementId: string,
  fileId: string,
  matches: Matches,
  files: Pick<UploadedPdf, 'id' | 'hash'>[],
): 'FILE_ALREADY_MATCHED' | 'DUPLICATE_ALREADY_MATCHED' | null {
  const selected = files.find((file) => file.id === fileId)
  if (!selected) return null
  for (const [otherRequirementId, otherFileId] of Object.entries(matches)) {
    if (otherRequirementId === requirementId || !otherFileId) continue
    if (otherFileId === fileId) return 'FILE_ALREADY_MATCHED'
    const other = files.find((file) => file.id === otherFileId)
    if (other?.hash === selected.hash) return 'DUPLICATE_ALREADY_MATCHED'
  }
  return null
}

export function duplicateFileIds(files: Pick<UploadedPdf, 'id' | 'hash'>[]): Set<string> {
  const counts = new Map<string, number>()
  files.forEach((file) => counts.set(file.hash, (counts.get(file.hash) ?? 0) + 1))
  return new Set(files.filter((file) => (counts.get(file.hash) ?? 0) > 1).map((file) => file.id))
}

export function suggestRequirement(fileName: string, requirements: Requirement[]): string | undefined {
  const fileTokens = normalise(fileName).split(' ').filter((token) => token.length > 2)
  let best: { id: string; score: number } | undefined
  for (const requirement of requirements) {
    const titleTokens = normalise(requirement.title_en).split(' ').filter((token) => token.length > 2)
    const score = titleTokens.filter((token) => fileTokens.includes(token)).length
    if (score > 0 && (!best || score > best.score)) best = { id: requirement.id, score }
  }
  return best?.id
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

