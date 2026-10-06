import { useMemo, useState } from 'react'
import { answerFromChunks, type KnowledgeChunk } from './engine/assistant'
import { extractPdfText } from './engine/files'
import type { Language } from './i18n/copy'
import type { ExpiryDates, Matches, RequirementsData, RequirementStatus, UploadedPdf } from './types'

interface DeskHelperProps {
  language: Language
  visible: boolean
  data: RequirementsData | null
  files: UploadedPdf[]
  matches: Matches
  expiryDates: ExpiryDates
  statuses: { title: string; status: RequirementStatus }[]
}

export function DeskHelper({ language, visible, data, files, matches, expiryDates, statuses }: DeskHelperProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'menu' | 'company' | 'files'>('menu')
  const [allowed, setAllowed] = useState(false)
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState('')
  const [sources, setSources] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const text = helperCopy[language]

  const companyChunks = useMemo(() => (data ? tenderChunks(data, statuses, expiryDates, language) : []), [data, statuses, expiryDates, language])

  if (!visible) return null

  async function ask() {
    if (!question.trim()) return
    setBusy(true)
    try {
      const chunks = mode === 'files' && allowed ? [...companyChunks, ...(await fileChunks(files, matches))] : companyChunks
      const result = answerFromChunks(question, chunks)
      setReply(result.answer || text.empty)
      setSources(result.sources)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="desk-helper">
      {open && (
        <section className="helper-panel" role="dialog" aria-label={text.title}>
          <header>
            <strong>{text.title}</strong>
            <button className="icon-button" onClick={() => setOpen(false)} aria-label={text.close}>×</button>
          </header>
          {mode === 'menu' ? (
            <div className="helper-menu">
              <p>{text.offer}</p>
              <button className="secondary-button compact" onClick={() => { setMode('company'); setReply(''); setSources([]) }}>{text.company}</button>
              <button className="secondary-button compact" onClick={() => { setMode('files'); setReply(''); setSources([]) }}>{text.files}</button>
            </div>
          ) : (
            <div className="helper-chat">
              <button className="text-button" onClick={() => setMode('menu')}>{text.back}</button>
              {mode === 'files' && !allowed ? (
                <div className="helper-permit">
                  <p>{text.permit}</p>
                  <button className="primary-button" onClick={() => setAllowed(true)}>{text.allow}</button>
                </div>
              ) : (
                <>
                  <label>
                    <span>{mode === 'files' ? text.filePrompt : text.companyPrompt}</span>
                    <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} />
                  </label>
                  <button className="primary-button" onClick={ask} disabled={busy || !data}>{busy ? '…' : text.ask}</button>
                  {reply && <p className="helper-reply">{reply}</p>}
                  {sources.length > 0 && <p className="helper-sources">{text.sources}: {sources.join(', ')}</p>}
                </>
              )}
            </div>
          )}
        </section>
      )}
      <button className="helper-launcher" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span aria-hidden="true">?</span>
        {text.launcher}
      </button>
    </div>
  )
}

function tenderChunks(
  data: RequirementsData,
  statuses: { title: string; status: RequirementStatus }[],
  expiryDates: ExpiryDates,
  language: Language,
): KnowledgeChunk[] {
  const tender = data.tender
  const checklist = statuses.map((item) => `${item.title}: ${item.status}`).join('. ')
  const expiry = data.requirements
    .filter((requirement) => expiryDates[requirement.id])
    .map((requirement) => `${language === 'bn' ? requirement.title_bn : requirement.title_en} expires ${expiryDates[requirement.id]}`)
    .join('. ')
  return [
    { source: language === 'bn' ? 'টেন্ডার' : 'Tender', text: `${tender.tender_id}. ${tender.title}. Procuring entity: ${tender.procuring_entity}. Bidder: ${tender.bidder}. Submission deadline: ${tender.submission_deadline}.` },
    { source: language === 'bn' ? 'তালিকা' : 'Checklist', text: checklist },
    { source: language === 'bn' ? 'মেয়াদ' : 'Expiry', text: expiry || (language === 'bn' ? 'কোনো মেয়াদ দেওয়া হয়নি।' : 'No expiry date has been entered.') },
  ]
}

async function fileChunks(files: UploadedPdf[], matches: Matches): Promise<KnowledgeChunk[]> {
  const matchedIds = new Set(Object.values(matches))
  const selected = files.filter((file) => matchedIds.has(file.id))
  const chunks = await Promise.all(selected.map(async (file) => {
    try {
      const text = await extractPdfText(file.file)
      return text ? { source: file.name, text } : undefined
    } catch {
      return { source: file.name, text: `${file.name} could not be read as text.` }
    }
  }))
  return chunks.filter((chunk): chunk is KnowledgeChunk => Boolean(chunk))
}

const helperCopy = {
  en: {
    launcher: 'Help',
    title: 'Desk helper',
    close: 'Close helper',
    offer: 'Can I help with this tender?',
    company: 'Ask about the tender',
    files: 'Read the matched files',
    back: 'Back',
    permit: 'This reads the matched PDFs already open in this browser. Nothing is uploaded.',
    allow: 'Allow reading',
    companyPrompt: 'Ask about the bidder, deadline, or checklist',
    filePrompt: 'Ask what the matched documents say',
    ask: 'Answer from this workspace',
    empty: 'Nothing in this workspace answers that.',
    sources: 'From',
  },
  bn: {
    launcher: 'সহায়তা',
    title: 'ডেস্ক সহায়ক',
    close: 'সহায়ক বন্ধ করুন',
    offer: 'এই টেন্ডারে কি সহায়তা লাগবে?',
    company: 'টেন্ডার সম্পর্কে জিজ্ঞাসা',
    files: 'মেলানো ফাইল পড়ুন',
    back: 'ফিরে যান',
    permit: 'এটি এই ব্রাউজারে খোলা মেলানো PDF পড়ে। কোথাও আপলোড হয় না।',
    allow: 'পড়া অনুমতি দিন',
    companyPrompt: 'দরদাতা, শেষ তারিখ বা তালিকা নিয়ে জিজ্ঞাসা করুন',
    filePrompt: 'মেলানো নথিতে কী আছে তা জিজ্ঞাসা করুন',
    ask: 'এই ওয়ার্কস্পেস থেকে উত্তর',
    empty: 'এই ওয়ার্কস্পেসে এর উত্তর নেই।',
    sources: 'সূত্র',
  },
} as const
