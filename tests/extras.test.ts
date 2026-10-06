import { describe, expect, it } from 'vitest'
import { answerFromChunks } from '../src/engine/assistant'
import { checklistCsv, checklistRows } from '../src/engine/checklist'
import { packagePageCount } from '../src/engine/packagePdf'
import type { RequirementsData } from '../src/types'

const data: RequirementsData = {
  tender: {
    tender_id: 'T-1',
    title: 'Supply',
    procuring_entity: 'Office',
    bidder: 'Meghna Tech Solutions Ltd.',
    submission_deadline: '2026-10-20',
  },
  requirements: [
    { id: 'R01', order: 1, title_en: 'Trade License', title_bn: 'ট্রেড লাইসেন্স', mandatory: true, has_expiry: true },
    { id: 'R02', order: 2, title_en: 'TIN Certificate', title_bn: 'টিআইএন সনদ', mandatory: true, has_expiry: false },
  ],
}

describe('optional package tools', () => {

  it('keeps the default package at one cover page plus the selected documents', () => {
    expect(packagePageCount([1, 1, 1, 1, 2, 6, 2, 1], false)).toBe(16)
    expect(packagePageCount([1, 1, 1, 1, 2, 6, 2, 1], true)).toBe(17)
  })

  it('exports the checklist with the required columns', () => {
    const csv = checklistCsv(checklistRows(
      data,
      [{ id: 'tin', file: new File([], '03_tin_certificate.pdf'), name: '03_tin_certificate.pdf', size: 10, pageCount: 1, hash: 'a' }],
      { R02: 'tin' },
      {},
      data.requirements.map((requirement) => ({ requirementId: requirement.id, status: requirement.id === 'R02' ? 'OK' : requirement.mandatory ? 'Missing' : 'Not provided' })),
      'en',
    ))
    expect(csv.startsWith('document,file name,pages,expiry date,status\n')).toBe(true)
    expect(csv).toContain('TIN Certificate,03_tin_certificate.pdf,1,,OK')
    expect(csv).toContain('Trade License,,,,Missing')
  })

  it('answers a company question only from the supplied notes', () => {
    const found = answerFromChunks('Who is the bidder?', [
      { source: 'Tender', text: 'Bidder: Meghna Tech Solutions Ltd.' },
      { source: 'Tender', text: 'Title: Supply of IT Equipment' },
    ])
    expect(found.answer).toContain('Meghna Tech Solutions Ltd.')
    expect(found.sources).toEqual(['Tender'])
    expect(answerFromChunks('payroll tax code', found.sources.length ? [{ source: 'Tender', text: 'Bidder: Meghna Tech Solutions Ltd.' }] : []).answer).toBe('')
  })
})
