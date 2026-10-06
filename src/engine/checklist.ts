import type { ExpiryDates, Matches, RequirementStatus, RequirementsData, UploadedPdf } from '../types'

export interface ChecklistRow {
  document: string
  fileName: string
  pages: string
  expiryDate: string
  status: RequirementStatus
}

export function checklistRows(
  data: RequirementsData,
  files: UploadedPdf[],
  matches: Matches,
  expiryDates: ExpiryDates,
  statuses: { requirementId: string; status: RequirementStatus }[],
  language: 'en' | 'bn',
): ChecklistRow[] {
  return [...data.requirements]
    .sort((a, b) => a.order - b.order)
    .map((requirement) => {
      const file = files.find((item) => item.id === matches[requirement.id])
      const status = statuses.find((item) => item.requirementId === requirement.id)?.status ?? 'Missing'
      return {
        document: language === 'bn' ? requirement.title_bn : requirement.title_en,
        fileName: file?.name ?? '',
        pages: file ? String(file.pageCount) : '',
        expiryDate: requirement.has_expiry ? expiryDates[requirement.id] ?? '' : '',
        status,
      }
    })
}

function cell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function checklistCsv(rows: ChecklistRow[]): string {
  const header = 'document,file name,pages,expiry date,status'
  const lines = rows.map((row) => [row.document, row.fileName, row.pages, row.expiryDate, row.status].map(cell).join(','))
  return `${header}\n${lines.join('\n')}\n`
}
