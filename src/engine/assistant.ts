export interface KnowledgeChunk {
  source: string
  text: string
}

const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'to', 'for', 'in', 'on', 'is', 'are', 'what', 'who', 'how', 'does', 'do', 'this', 'that', 'about'])

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !STOP.has(token))
}

export function answerFromChunks(question: string, chunks: KnowledgeChunk[]): { answer: string; sources: string[] } {
  const query = tokens(question)
  if (!query.length || !chunks.length) {
    return { answer: '', sources: [] }
  }
  const ranked = chunks
    .map((chunk) => {
      const haystack = tokens(`${chunk.source} ${chunk.text}`)
      const score = query.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0)
      return { chunk, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (!ranked.length) return { answer: '', sources: [] }
  return {
    answer: ranked.map((item) => item.chunk.text).join(' '),
    sources: [...new Set(ranked.map((item) => item.chunk.source))],
  }
}
