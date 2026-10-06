import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { ExpiryDates, Matches, RequirementsData, UploadedPdf } from '../types'

const A4: [number, number] = [595.28, 841.89]
const FOOTER_HEIGHT = 28

interface PackageOptions {
  data: RequirementsData
  files: UploadedPdf[]
  matches: Matches
  expiryDates: ExpiryDates
  madeOn?: Date
}

export async function generatePackagePdf({ data, files, matches, madeOn = new Date() }: PackageOptions): Promise<Uint8Array> {
  const included = data.requirements
    .filter((requirement) => Boolean(matches[requirement.id]))
    .sort((a, b) => a.order - b.order)

  const sources = await Promise.all(
    included.map(async (requirement) => {
      const uploaded = files.find((file) => file.id === matches[requirement.id])
      if (!uploaded) throw new Error(`MATCHED_FILE_MISSING:${requirement.id}`)
      return { requirement, uploaded, bytes: new Uint8Array(await uploaded.file.arrayBuffer()) }
    }),
  )

  const totalPages = 1 + sources.reduce((sum, source) => sum + source.uploaded.pageCount, 0)
  const output = await PDFDocument.create()
  const regular = await output.embedFont(StandardFonts.Helvetica)
  const bold = await output.embedFont(StandardFonts.HelveticaBold)
  const cover = output.addPage(A4)
  drawCover(cover, data, included.map((requirement) => requirement.title_en), madeOn, regular, bold)

  for (const source of sources) {
    const sourceDocument = await PDFDocument.load(source.bytes, { ignoreEncryption: false })
    for (let index = 0; index < sourceDocument.getPageCount(); index += 1) {
      const [embedded] = await output.embedPdf(source.bytes, [index])
      const width = embedded.width
      const height = embedded.height
      const page = output.addPage([width, height + FOOTER_HEIGHT])
      page.drawPage(embedded, { x: 0, y: FOOTER_HEIGHT, width, height })
    }
  }

  output.getPages().forEach((page, index) => {
    const footer = `${data.tender.tender_id} | Page ${index + 1} of ${totalPages}`
    const size = 9
    const width = regular.widthOfTextAtSize(footer, size)
    page.drawText(footer, {
      x: (page.getWidth() - width) / 2,
      y: 9,
      size,
      font: regular,
      color: rgb(0.12, 0.18, 0.17),
    })
  })

  return output.save({ useObjectStreams: false })
}

function drawCover(
  page: ReturnType<PDFDocument['addPage']>,
  data: RequirementsData,
  documentNames: string[],
  madeOn: Date,
  regular: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const { width, height } = page.getSize()
  page.drawRectangle({ x: 0, y: height - 170, width, height: 170, color: rgb(0.055, 0.23, 0.2) })
  page.drawText('TENDER DOCUMENT PACKAGE', { x: 48, y: height - 88, size: 24, font: bold, color: rgb(1, 1, 1) })
  page.drawText(data.tender.tender_id, { x: 48, y: height - 122, size: 15, font: regular, color: rgb(0.78, 0.94, 0.86) })

  const rows: [string, string][] = [
    ['Tender title', data.tender.title],
    ['Procuring entity', data.tender.procuring_entity],
    ['Bidder', data.tender.bidder],
    ['Submission deadline', data.tender.submission_deadline],
    ['Package made on', localIsoDate(madeOn)],
  ]
  let y = height - 220
  for (const [label, value] of rows) {
    page.drawText(label.toUpperCase(), { x: 48, y, size: 8, font: bold, color: rgb(0.32, 0.42, 0.4) })
    page.drawText(value, { x: 190, y: y - 2, size: 11, font: regular, color: rgb(0.08, 0.13, 0.12) })
    y -= 38
  }

  page.drawText('INCLUDED DOCUMENTS', { x: 48, y: y - 10, size: 11, font: bold, color: rgb(0.055, 0.23, 0.2) })
  y -= 38
  documentNames.forEach((name, index) => {
    page.drawCircle({ x: 57, y: y + 4, size: 10, color: rgb(0.87, 0.95, 0.91) })
    page.drawText(String(index + 1), { x: index + 1 < 10 ? 54 : 51, y, size: 8, font: bold, color: rgb(0.055, 0.23, 0.2) })
    page.drawText(name, { x: 78, y, size: 10, font: regular, color: rgb(0.08, 0.13, 0.12) })
    y -= 25
  })
}

function localIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

