import { describe, expect, it } from 'vitest'
import {
  duplicateFileIds,
  getMatchConflict,
  getRequirementStatus,
  parseRequirementsData,
  suggestRequirement,
  validateRequirementsData,
} from '../src/engine/compliance'
import type { Requirement, RequirementsData } from '../src/types'

const expiryRequirement: Requirement = {
  id: 'X',
  order: 1,
  title_en: 'Trade License',
  title_bn: 'ট্রেড লাইসেন্স',
  mandatory: true,
  has_expiry: true,
}

describe('requirement status rules', () => {
  it('marks an unmatched mandatory document Missing', () => {
    expect(getRequirementStatus(expiryRequirement, undefined, undefined, '2026-10-20')).toBe('Missing')
  })

  it('marks an unmatched optional document Not provided', () => {
    expect(getRequirementStatus({ ...expiryRequirement, mandatory: false }, undefined, undefined, '2026-10-20')).toBe('Not provided')
  })

  it('requires an expiry date only after a file is matched', () => {
    expect(getRequirementStatus(expiryRequirement, 'file', undefined, '2026-10-20')).toBe('Expiry date needed')
  })

  it('treats an earlier expiry as Expired', () => {
    expect(getRequirementStatus(expiryRequirement, 'file', '2026-10-19', '2026-10-20')).toBe('Expired')
  })

  it('accepts expiry on the deadline boundary', () => {
    expect(getRequirementStatus(expiryRequirement, 'file', '2026-10-20', '2026-10-20')).toBe('OK')
  })

  it('accepts expiry after the deadline', () => {
    expect(getRequirementStatus(expiryRequirement, 'file', '2027-06-30', '2026-10-20')).toBe('OK')
  })
})

describe('input validation and ordering', () => {
  const data: RequirementsData = {
    tender: { tender_id: 'T', title: 'Title', procuring_entity: 'Entity', bidder: 'Bidder', submission_deadline: '2026-10-20' },
    requirements: [
      { ...expiryRequirement, id: 'B', order: 2 },
      { ...expiryRequirement, id: 'A', order: 1 },
    ],
  }

  it('sorts by the order field rather than file or ID names', () => {
    expect(parseRequirementsData(data).requirements.map((item) => item.id)).toEqual(['A', 'B'])
  })

  it('collects duplicate ID, duplicate order, and date errors', () => {
    const invalid = structuredClone(data)
    invalid.tender.submission_deadline = '2026-02-31'
    invalid.requirements[1].id = 'B'
    invalid.requirements[1].order = 2
    const codes = validateRequirementsData(invalid).map((issue) => issue.code)
    expect(codes).toEqual(expect.arrayContaining(['INVALID_DATE', 'DUPLICATE_ID', 'DUPLICATE_ORDER']))
  })
})

describe('duplicates and matching', () => {
  const files = [
    { id: 'a', hash: 'same' },
    { id: 'b', hash: 'same' },
    { id: 'c', hash: 'other' },
  ]

  it('marks every member of a duplicate group', () => {
    expect([...duplicateFileIds(files)].sort()).toEqual(['a', 'b'])
  })

  it('prevents byte-identical files being matched to different requirements', () => {
    expect(getMatchConflict('R2', 'b', { R1: 'a' }, files)).toBe('DUPLICATE_ALREADY_MATCHED')
  })

  it('prevents one file being reused', () => {
    expect(getMatchConflict('R2', 'a', { R1: 'a' }, files)).toBe('FILE_ALREADY_MATCHED')
  })
})

describe('auto-match suggestions', () => {
  it('uses title words but does not depend on filename number prefixes', () => {
    const requirements = [
      { ...expiryRequirement, id: 'R8', title_en: 'Technical Proposal' },
      { ...expiryRequirement, id: 'R9', title_en: 'Financial Proposal' },
    ]
    expect(suggestRequirement('01_financial_proposal.pdf', requirements)).toBe('R9')
    expect(suggestRequirement('02_technical_proposal.pdf', requirements)).toBe('R8')
  })
})

