import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { parseRequirementsData } from '../src/engine/compliance'
import { generatePackagePdf } from '../src/engine/packagePdf'
import type { UploadedPdf } from '../src/types'

const root = resolve(import.meta.dirname, '..')
const requirements = parseRequirementsData(
  JSON.parse(await readFile(resolve(root, 'sample-pack/requirements.json'), 'utf8')),
)

const selected = [
  ['trade', 'trade_license_2026.pdf', 1],
  ['tin', '03_tin_certificate.pdf', 1],
  ['vat', '04_vat_certificate.pdf', 1],
  ['bank', 'bank_solvency.pdf', 1],
  ['experience', 'experience_cert.pdf', 2],
  ['technical', '02_technical_proposal.pdf', 6],
  ['financial', '01_financial_proposal.pdf', 2],
  ['declaration', 'scan_0042.pdf', 1],
] as const

const files: UploadedPdf[] = await Promise.all(
  selected.map(async ([id, name, pageCount]) => {
    const bytes = await readFile(resolve(root, 'sample-pack/documents', name))
    return {
      id,
      name,
      size: bytes.byteLength,
      pageCount,
      hash: id,
      file: new File([bytes], name, { type: 'application/pdf' }),
    }
  }),
)

const bytes = await generatePackagePdf({
  data: requirements,
  files,
  matches: {
    R01: 'trade',
    R02: 'tin',
    R03: 'vat',
    R04: 'bank',
    R05: 'experience',
    R08: 'technical',
    R09: 'financial',
    R10: 'declaration',
  },
  expiryDates: { R01: '2027-06-30', R04: '2026-12-31' },
  madeOn: new Date('2026-10-06T12:00:00+06:00'),
})

const document = await PDFDocument.load(bytes)
if (document.getPageCount() !== 16) {
  throw new Error(`Expected 16 pages, got ${document.getPageCount()}`)
}

await mkdir(resolve(root, 'output'), { recursive: true })
const outputPath = resolve(root, 'output/T-2026-0417_Package.pdf')
await writeFile(outputPath, bytes)
console.log(`Generated ${outputPath} (${document.getPageCount()} pages)`)
