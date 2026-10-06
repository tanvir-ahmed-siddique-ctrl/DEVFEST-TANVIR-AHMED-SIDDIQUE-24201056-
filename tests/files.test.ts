import { describe, expect, it } from 'vitest'
import { assertFileLimits, FileProcessingError, MAX_FILES, MAX_TOTAL_BYTES } from '../src/engine/files'

function fakeFile(size = 1): File {
  return { size, name: 'fixture.pdf' } as File
}

describe('upload boundaries', () => {
  it('accepts exactly 30 files', () => {
    expect(() => assertFileLimits([], Array.from({ length: MAX_FILES }, () => fakeFile()))).not.toThrow()
  })

  it('rejects the 31st file with a stable code', () => {
    try {
      assertFileLimits([], Array.from({ length: MAX_FILES + 1 }, () => fakeFile()))
      throw new Error('expected rejection')
    } catch (error) {
      expect(error).toBeInstanceOf(FileProcessingError)
      expect((error as FileProcessingError).code).toBe('TOO_MANY_FILES')
    }
  })

  it('accepts exactly 50 MB and rejects one byte more', () => {
    expect(() => assertFileLimits([], [fakeFile(MAX_TOTAL_BYTES)])).not.toThrow()
    expect(() => assertFileLimits([], [fakeFile(MAX_TOTAL_BYTES + 1)])).toThrowError('TOTAL_SIZE_EXCEEDED')
  })
})

