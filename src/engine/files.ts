import * as pdfjsLib from 'pdfjs-dist'
import type { UploadedPdf } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export const MAX_FILES = 30
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024

export type FileErrorCode =
  | 'NOT_PDF'
  | 'TOO_MANY_FILES'
  | 'TOTAL_SIZE_EXCEEDED'
  | 'DAMAGED_OR_PROTECTED'

export class FileProcessingError extends Error {
  constructor(public code: FileErrorCode, public fileName?: string) {
    super(code)
  }
}

export async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function inspectPdf(file: File): Promise<UploadedPdf> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new FileProcessingError('NOT_PDF', file.name)
  }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const loadingTask = pdfjsLib.getDocument({ data: bytes })
    const document = await loadingTask.promise
    const firstPage = await document.getPage(1)
    const viewport = firstPage.getViewport({ scale: 0.24 })
    const canvas = window.document.createElement('canvas')
    const context = canvas.getContext('2d')
    let thumbnail: string | undefined
    if (context) {
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      await firstPage.render({ canvas, canvasContext: context, viewport }).promise
      thumbnail = canvas.toDataURL('image/jpeg', 0.72)
    }
    const result: UploadedPdf = {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      pageCount: document.numPages,
      hash: await sha256(file),
      thumbnail,
    }
    await loadingTask.destroy()
    return result
  } catch (error) {
    if (error instanceof FileProcessingError) throw error
    throw new FileProcessingError('DAMAGED_OR_PROTECTED', file.name)
  }
}

export function assertFileLimits(current: UploadedPdf[], incoming: File[]): void {
  if (current.length + incoming.length > MAX_FILES) throw new FileProcessingError('TOO_MANY_FILES')
  const bytes = current.reduce((sum, file) => sum + file.size, 0) + incoming.reduce((sum, file) => sum + file.size, 0)
  if (bytes > MAX_TOTAL_BYTES) throw new FileProcessingError('TOTAL_SIZE_EXCEEDED')
}

