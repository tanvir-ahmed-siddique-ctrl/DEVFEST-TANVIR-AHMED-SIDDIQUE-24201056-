import { PDFDocument, StandardFonts, rgb, type PDFImage } from 'pdf-lib'
import type { ExpiryDates, Matches, RequirementsData, UploadedPdf } from '../types'

const A4: [number, number] = [595.28, 841.89]
const FOOTER_HEIGHT = 28

export interface SealOptions {
  bytes: Uint8Array
  onCover: boolean
  requirementIds: string[]
}

interface PackageOptions {
  data: RequirementsData
  files: UploadedPdf[]
  matches: Matches
  expiryDates: ExpiryDates
  madeOn?: Date
  includeIndex?: boolean
  banglaOnCover?: boolean
  seal?: SealOptions
}

export function packagePageCount(documentPageCounts: number[], includeIndex: boolean): number {
  const documents = documentPageCounts.reduce((sum, count) => sum + count, 0)
  return 1 + (includeIndex ? 1 : 0) + documents
}

export async function generatePackagePdf({
  data,
  files,
  matches,
  madeOn = new Date(),
  includeIndex = false,
  banglaOnCover = false,
  seal,
}: PackageOptions): Promise<Uint8Array> {
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

  const totalPages = packagePageCount(sources.map((source) => source.uploaded.pageCount), includeIndex)
  const output = await PDFDocument.create()
  const regular = await output.embedFont(StandardFonts.Helvetica)
  const bold = await output.embedFont(StandardFonts.HelveticaBold)
  const banglaImages = banglaOnCover
    ? await Promise.all((await renderBanglaLines(included.map((requirement) => requirement.title_bn))).map(async (png) => png ? output.embedPng(png) : undefined))
    : []
  const cover = output.addPage(A4)
  drawCover(cover, data, included.map((requirement) => requirement.title_en), madeOn, regular, bold, banglaImages)

  const startPage = new Map<string, number>()
  let nextPage = includeIndex ? 3 : 2
  sources.forEach((source) => {
    startPage.set(source.requirement.id, nextPage)
    nextPage += source.uploaded.pageCount
  })
  if (includeIndex) drawIndex(output.addPage(A4), data.tender.tender_id, included.map((requirement) => ({
    title: requirement.title_en,
    start: startPage.get(requirement.id) ?? 0,
  })), regular, bold)

  const pagesByRequirement = new Map<string, number[]>()
  for (const source of sources) {
    const sourceDocument = await PDFDocument.load(source.bytes, { ignoreEncryption: false })
    const pageIndexes: number[] = []
    for (let index = 0; index < sourceDocument.getPageCount(); index += 1) {
      const [embedded] = await output.embedPdf(source.bytes, [index])
      const width = embedded.width
      const height = embedded.height
      const page = output.addPage([width, height + FOOTER_HEIGHT])
      page.drawPage(embedded, { x: 0, y: FOOTER_HEIGHT, width, height })
      pageIndexes.push(output.getPages().length - 1)
    }
    pagesByRequirement.set(source.requirement.id, pageIndexes)
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

  if (seal) await drawSeal(output, seal, pagesByRequirement)
  return output.save({ useObjectStreams: false })
}

async function drawSeal(
  output: PDFDocument,
  seal: SealOptions,
  pagesByRequirement: Map<string, number[]>,
): Promise<void> {
  const image = await output.embedPng(seal.bytes)
  const pages = output.getPages()
  const targets = new Set<number>()
  if (seal.onCover) targets.add(0)
  seal.requirementIds.forEach((id) => pagesByRequirement.get(id)?.forEach((index) => targets.add(index)))
  targets.forEach((index) => {
    const page = pages[index]
    if (!page) return
    const width = Math.min(78, page.getWidth() * 0.18)
    const height = width * (image.height / image.width)
    page.drawImage(image, {
      x: page.getWidth() - width - 28,
      y: FOOTER_HEIGHT + 18,
      width,
      height,
    })
  })
}

function drawIndex(
  page: ReturnType<PDFDocument['addPage']>,
  tenderId: string,
  entries: { title: string; start: number }[],
  regular: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const { height } = page.getSize()
  page.drawText('DOCUMENT INDEX', { x: 48, y: height - 78, size: 22, font: bold, color: rgb(0.055, 0.23, 0.2) })
  page.drawText(tenderId, { x: 48, y: height - 104, size: 12, font: regular, color: rgb(0.28, 0.4, 0.36) })
  let y = height - 156
  entries.forEach((entry, index) => {
    page.drawText(`${index + 1}.  ${entry.title}`, { x: 48, y, size: 12, font: regular, color: rgb(0.08, 0.13, 0.12) })
    const label = `Page ${entry.start}`
    page.drawText(label, { x: 470, y, size: 12, font: bold, color: rgb(0.055, 0.23, 0.2) })
    y -= 28
  })
}

function drawCover(
  page: ReturnType<PDFDocument['addPage']>,
  data: RequirementsData,
  documentNames: string[],
  madeOn: Date,
  regular: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  banglaLines: (PDFImage | undefined)[],
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
    y -= 34
  }

  page.drawText('INCLUDED DOCUMENTS', { x: 48, y: y - 6, size: 11, font: bold, color: rgb(0.055, 0.23, 0.2) })
  y -= 32
  documentNames.forEach((name, index) => {
    page.drawCircle({ x: 57, y: y + 4, size: 10, color: rgb(0.87, 0.95, 0.91) })
    page.drawText(String(index + 1), { x: index + 1 < 10 ? 54 : 51, y, size: 8, font: bold, color: rgb(0.055, 0.23, 0.2) })
    page.drawText(name, { x: 78, y, size: 10, font: regular, color: rgb(0.08, 0.13, 0.12) })
    const bangla = banglaLines[index]
    if (bangla) {
      const scaled = 11
      const imageHeight = scaled
      const imageWidth = scaled * (bangla.width / bangla.height)
      page.drawImage(bangla, { x: 78, y: y - imageHeight - 4, width: imageWidth, height: imageHeight })
      y -= 34
    } else {
      y -= 22
    }
  })
}

async function renderBanglaLines(lines: string[]): Promise<(Uint8Array | undefined)[]> {
  if (typeof document === 'undefined') return lines.map(() => undefined)
  const family = await banglaFamily()
  if (!family) return lines.map(() => undefined)
  const pngs = await Promise.all(lines.map((line) => renderLine(line, family)))
  return pngs
}

export async function canDrawBangla(): Promise<boolean> {
  return Boolean(await banglaFamily())
}

async function banglaFamily(): Promise<string | undefined> {
  const families = ['Nirmala UI', 'Noto Sans Bengali', 'Vrinda']
  for (const family of families) {
    try {
      await document.fonts.load(`20px "${family}"`)
    } catch {
      continue
    }
    const context = document.createElement('canvas').getContext('2d')
    if (!context) return
    context.font = `20px "${family}"`
    const shaped = context.measureText('কখগ').width
    context.font = '20px "Courier New"'
    const fallback = context.measureText('কখগ').width
    if (shaped > 0 && Math.abs(shaped - fallback) > 0.5) return family
  }
  return undefined
}

async function renderLine(text: string, family: string): Promise<Uint8Array | undefined> {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return undefined
  const font = `28px "${family}"`
  context.font = font
  canvas.width = Math.ceil(context.measureText(text).width) + 12
  canvas.height = 40
  context.font = font
  context.fillStyle = '#142321'
  context.fillText(text, 4, 30)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), 'image/png'))
  if (!blob) return undefined
  return new Uint8Array(await blob.arrayBuffer())
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

export function downloadText(contents: string, fileName: string, type = 'text/csv'): void {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
