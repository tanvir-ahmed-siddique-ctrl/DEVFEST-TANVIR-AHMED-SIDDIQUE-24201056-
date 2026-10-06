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

export function retrieveChunks(question: string, chunks: KnowledgeChunk[], limit = 4): KnowledgeChunk[] {
  if (!chunks.length) return []
  const query = tokens(question)
  const ranked = chunks
    .map((chunk) => {
      const haystack = tokens(`${chunk.source} ${chunk.text}`)
      const score = query.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0)
      return { chunk, score }
    })
    .sort((a, b) => b.score - a.score)
  const useful = ranked.filter((item) => item.score > 0).slice(0, limit)
  return (useful.length ? useful : ranked.slice(0, 1)).map((item) => item.chunk)
}

export function answerFromChunks(question: string, chunks: KnowledgeChunk[]): { answer: string; sources: string[] } {
  const query = tokens(question)
  const notes = query.length ? retrieveChunks(question, chunks).filter((chunk) => {
    const haystack = tokens(`${chunk.source} ${chunk.text}`)
    return query.some((token) => haystack.includes(token))
  }) : []
  if (!notes.length) return { answer: '', sources: [] }
  return {
    answer: notes.map((chunk) => chunk.text).join(' '),
    sources: [...new Set(notes.map((chunk) => chunk.source))],
  }
}

export async function askModel(question: string, notes: KnowledgeChunk[], apiKey: string): Promise<string | null> {
  const key = apiKey.trim()
  if (!key || !question.trim()) return null
  const context = notes.map((note) => `[${note.source}] ${note.text}`).join('\n\n')
  const prompt = [
    'You help office staff with one tender package.',
    'Use only the notes below. If they do not contain the answer, say that it is not in the open workspace.',
    'Do not invent names, dates, amounts, or document contents.',
    '',
    'Notes:',
    context || '(no notes)',
    '',
    `Question: ${question.trim()}`,
  ].join('\n')
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      }),
    },
  )
  if (!response.ok) throw new Error('MODEL_FAILED')
  const payload = await response.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  return text || null
}
