import { useEffect, useMemo, useRef, useState } from 'react'
import {
  duplicateFileIds,
  getMatchConflict,
  getStatuses,
  parseRequirementsData,
  suggestRequirement,
} from './engine/compliance'
import { assertFileLimits, FileProcessingError, inspectPdf, type FileErrorCode } from './engine/files'
import { downloadBytes, generatePackagePdf } from './engine/packagePdf'
import { copy, type Language } from './i18n/copy'
import type { ExpiryDates, Matches, RequirementStatus, RequirementsData, UploadedPdf } from './types'
import './styles.css'

interface FileNotice {
  id: string
  fileName?: string
  code: FileErrorCode | 'INVALID_REQUIREMENTS' | 'MATCH_CONFLICT' | 'SAMPLE_FAILED' | 'GENERATION_FAILED'
}

const SAMPLE_FILES = [
  '01_financial_proposal.pdf',
  '02_technical_proposal.pdf',
  '03_tin_certificate.pdf',
  '04_vat_certificate.pdf',
  'bank_solvency.pdf',
  'company_logo.png',
  'experience_cert (1).pdf',
  'experience_cert.pdf',
  'scan_0042.pdf',
  'trade_license_2025.pdf',
  'trade_license_2026.pdf',
]

export default function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [data, setData] = useState<RequirementsData | null>(null)
  const [files, setFiles] = useState<UploadedPdf[]>([])
  const [matches, setMatches] = useState<Matches>({})
  const [expiryDates, setExpiryDates] = useState<ExpiryDates>({})
  const [notices, setNotices] = useState<FileNotice[]>([])
  const [busy, setBusy] = useState(false)
  const [generating, setGenerating] = useState(false)
  const requirementsInput = useRef<HTMLInputElement>(null)
  const documentsInput = useRef<HTMLInputElement>(null)
  const sampleLoadedFromUrl = useRef(false)
  const t = copy[language]

  const duplicateIds = useMemo(() => duplicateFileIds(files), [files])
  const statuses = useMemo(
    () => (data ? getStatuses(data, matches, expiryDates) : []),
    [data, matches, expiryDates],
  )
  const blockers = statuses.filter((item) => item.blocking)
  const completed = statuses.filter((item) => !item.blocking).length
  const suggestions = useMemo(() => {
    if (!data) return new Map<string, string>()
    return new Map(files.map((file) => [file.id, suggestRequirement(file.name, data.requirements)]).filter((pair): pair is [string, string] => Boolean(pair[1])))
  }, [data, files])

  useEffect(() => {
    if (sampleLoadedFromUrl.current || new URLSearchParams(window.location.search).get('sample') !== '1') return
    sampleLoadedFromUrl.current = true
    void loadSample()
  }, [])

  async function loadRequirementsFile(file: File) {
    try {
      const parsed = parseRequirementsData(JSON.parse(await file.text()))
      setData(parsed)
      setMatches({})
      setExpiryDates({})
    } catch {
      addNotice('INVALID_REQUIREMENTS', file.name)
    }
  }

  async function addFiles(incoming: File[]) {
    if (!incoming.length) return
    try {
      assertFileLimits(files, incoming)
    } catch (error) {
      if (error instanceof FileProcessingError) addNotice(error.code)
      return
    }
    setBusy(true)
    const results = await Promise.allSettled(incoming.map(inspectPdf))
    const accepted: UploadedPdf[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') accepted.push(result.value)
      else if (result.reason instanceof FileProcessingError) addNotice(result.reason.code, incoming[index].name)
    })
    setFiles((current) => [...current, ...accepted])
    setBusy(false)
  }

  async function loadSample() {
    setBusy(true)
    try {
      const requirementsResponse = await fetch('./sample-pack/requirements.json')
      const parsed = parseRequirementsData(await requirementsResponse.json())
      setData(parsed)
      setMatches({})
      setExpiryDates({})
      setFiles([])
      const sampleFiles = await Promise.all(
        SAMPLE_FILES.map(async (name) => {
          const response = await fetch(`./sample-pack/documents/${encodeURIComponent(name)}`)
          if (!response.ok) throw new Error(name)
          const blob = await response.blob()
          return new File([blob], name, { type: name.endsWith('.pdf') ? 'application/pdf' : blob.type })
        }),
      )
      setBusy(false)
      await addFilesToEmptyWorkspace(sampleFiles)
    } catch {
      setBusy(false)
      addNotice('SAMPLE_FAILED')
    }
  }

  async function addFilesToEmptyWorkspace(incoming: File[]) {
    try {
      assertFileLimits([], incoming)
    } catch (error) {
      if (error instanceof FileProcessingError) addNotice(error.code)
      return
    }
    setBusy(true)
    const results = await Promise.allSettled(incoming.map(inspectPdf))
    const accepted: UploadedPdf[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') accepted.push(result.value)
      else if (result.reason instanceof FileProcessingError) addNotice(result.reason.code, incoming[index].name)
    })
    setFiles(accepted)
    setBusy(false)
  }

  function addNotice(code: FileNotice['code'], fileName?: string) {
    setNotices((current) => [...current, { id: crypto.randomUUID(), code, fileName }])
  }

  function removeFile(fileId: string) {
    setFiles((current) => current.filter((file) => file.id !== fileId))
    setMatches((current) => Object.fromEntries(Object.entries(current).filter(([, value]) => value !== fileId)))
  }

  function updateMatch(requirementId: string, fileId: string) {
    if (!fileId) {
      setMatches((current) => {
        const next = { ...current }
        delete next[requirementId]
        return next
      })
      return
    }
    if (getMatchConflict(requirementId, fileId, matches, files)) {
      addNotice('MATCH_CONFLICT', files.find((file) => file.id === fileId)?.name)
      return
    }
    setMatches((current) => ({ ...current, [requirementId]: fileId }))
  }

  function applySuggestions() {
    if (!data) return
    const next = { ...matches }
    const suggestionCounts = new Map<string, number>()
    suggestions.forEach((requirementId) => {
      suggestionCounts.set(requirementId, (suggestionCounts.get(requirementId) ?? 0) + 1)
    })
    for (const file of files) {
      const requirementId = suggestions.get(file.id)
      if (
        !requirementId ||
        next[requirementId] ||
        suggestionCounts.get(requirementId) !== 1 ||
        duplicateIds.has(file.id)
      ) continue
      if (!getMatchConflict(requirementId, file.id, next, files)) next[requirementId] = file.id
    }
    setMatches(next)
  }

  async function generate() {
    if (!data || blockers.length) return
    setGenerating(true)
    try {
      const bytes = await generatePackagePdf({ data, files, matches, expiryDates })
      downloadBytes(bytes, `${data.tender.tender_id}_Package.pdf`)
    } catch {
      addNotice('GENERATION_FAILED')
    } finally {
      setGenerating(false)
    }
  }

  function reset() {
    if (!window.confirm(t.confirmReset)) return
    setData(null)
    setFiles([])
    setMatches({})
    setExpiryDates({})
    setNotices([])
  }

  const formatNotice = (notice: FileNotice) => {
    const prefix = notice.fileName ? `${notice.fileName} — ` : ''
    return prefix + t.errors[notice.code]
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">✓</div>
          <div>
            <strong>{t.appName}</strong>
            <span>{t.privacy}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="language-switch" aria-label="Language">
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>{t.english}</button>
            <button className={language === 'bn' ? 'active' : ''} onClick={() => setLanguage('bn')}>{t.bangla}</button>
          </div>
          {data && <button className="text-button" onClick={reset}>{t.reset}</button>}
        </div>
      </header>

      <main>
        <section className="intro">
          <p className="eyebrow">{language === 'en' ? 'BID SUBMISSION WORKSPACE' : 'দরপত্র জমাদান ওয়ার্কস্পেস'}</p>
          <h1>{t.appName}</h1>
          <p>{t.purpose}</p>
          <div className="intro-actions">
            <button className="primary-button" onClick={() => requirementsInput.current?.click()}>{data ? t.replaceJson : t.loadJson}</button>
            <button className="secondary-button" onClick={loadSample} disabled={busy}>{busy ? '…' : t.loadSample}</button>
            <input ref={requirementsInput} hidden type="file" accept="application/json,.json" onChange={(event) => event.target.files?.[0] && loadRequirementsFile(event.target.files[0])} />
          </div>
        </section>

        {notices.length > 0 && (
          <section className="notice-stack" aria-live="polite">
            <div className="notice-heading"><strong>{t.fileErrors}</strong><button onClick={() => setNotices([])}>{t.dismiss}</button></div>
            {notices.map((notice) => <p key={notice.id}>⚠ {formatNotice(notice)}</p>)}
          </section>
        )}

        {!data ? (
          <section className="empty-hero">
            <div className="empty-icon" aria-hidden="true">≡</div>
            <h2>{t.noTender}</h2>
            <p>{t.noTenderBody}</p>
          </section>
        ) : (
          <>
            <section className="tender-card">
              <div className="tender-title">
                <span>{data.tender.tender_id}</span>
                <h2>{data.tender.title}</h2>
              </div>
              <dl>
                <div><dt>{t.procuringEntity}</dt><dd>{data.tender.procuring_entity}</dd></div>
                <div><dt>{t.bidder}</dt><dd>{data.tender.bidder}</dd></div>
                <div><dt>{t.deadline}</dt><dd>{data.tender.submission_deadline}</dd></div>
              </dl>
            </section>

            <section className="workspace-grid">
              <div className="panel files-panel">
                <div className="panel-heading">
                  <div><p className="step">01</p><h2>{t.documents}</h2></div>
                  <button className="secondary-button compact" onClick={() => documentsInput.current?.click()} disabled={busy}>＋ {t.upload}</button>
                  <input ref={documentsInput} hidden type="file" multiple onChange={(event) => event.target.files && addFiles(Array.from(event.target.files))} />
                </div>
                <p className="helper">{t.uploadHint}</p>
                {files.length === 0 ? (
                  <div className="inner-empty"><strong>{t.emptyFiles}</strong><p>{t.emptyFilesBody}</p></div>
                ) : (
                  <div className="file-list">
                    {files.map((file) => (
                      <article className="file-card" key={file.id}>
                        <div className="thumbnail">{file.thumbnail ? <img src={file.thumbnail} alt="" /> : <span>PDF</span>}</div>
                        <div className="file-meta">
                          <strong title={file.name}>{file.name}</strong>
                          <span>{file.pageCount} {file.pageCount === 1 ? t.page : t.pages} · {(file.size / 1024).toFixed(0)} KB</span>
                          <div className="badges">
                            {duplicateIds.has(file.id) && <span className="badge danger">{t.duplicate}</span>}
                            {suggestions.has(file.id) && <span className="badge">{t.suggested}</span>}
                          </div>
                        </div>
                        <button className="icon-button" aria-label={`${t.remove} ${file.name}`} onClick={() => removeFile(file.id)}>×</button>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel checklist-panel">
                <div className="panel-heading">
                  <div><p className="step">02</p><h2>{t.requirements}</h2></div>
                  <button className="text-button" onClick={applySuggestions} disabled={!suggestions.size}>{t.applySuggestions}</button>
                </div>
                <div className="progress-row">
                  <div className="progress-track"><span style={{ width: `${statuses.length ? (completed / statuses.length) * 100 : 0}%` }} /></div>
                  <span>{completed}/{statuses.length} {t.progress}</span>
                </div>
                <div className="requirement-list">
                  {statuses.map(({ requirement, status }) => (
                    <article className="requirement-row" key={requirement.id}>
                      <div className="requirement-name">
                        <span className="order-number">{String(requirement.order).padStart(2, '0')}</span>
                        <div><strong>{language === 'bn' ? requirement.title_bn : requirement.title_en}</strong><small>{requirement.mandatory ? (language === 'en' ? 'Required' : 'আবশ্যিক') : (language === 'en' ? 'Optional' : 'ঐচ্ছিক')}</small></div>
                      </div>
                      <label>
                        <span>{t.matchedFile}</span>
                        <select value={matches[requirement.id] ?? ''} onChange={(event) => updateMatch(requirement.id, event.target.value)}>
                          <option value="">{t.chooseFile}</option>
                          {files.map((file) => {
                            const conflict = getMatchConflict(requirement.id, file.id, matches, files)
                            return <option value={file.id} key={file.id} disabled={Boolean(conflict)}>{file.name}{duplicateIds.has(file.id) ? ` · ${t.duplicate}` : ''}</option>
                          })}
                        </select>
                      </label>
                      {requirement.has_expiry && matches[requirement.id] ? (
                        <label>
                          <span>{t.expiry}</span>
                          <input type="date" value={expiryDates[requirement.id] ?? ''} onChange={(event) => setExpiryDates((current) => ({ ...current, [requirement.id]: event.target.value }))} />
                        </label>
                      ) : <div />}
                      <StatusBadge status={status} label={t.statuses[status]} />
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className={`generate-bar ${blockers.length ? 'blocked' : 'ready'}`}>
              <div>
                <span className="generate-icon" aria-hidden="true">{blockers.length ? '!' : '✓'}</span>
                <div>
                  <strong>{blockers.length ? t.blockers : t.ready}</strong>
                  {blockers.length > 0 && <p>{blockers.map(({ requirement, status }) => `${language === 'bn' ? requirement.title_bn : requirement.title_en}: ${t.statuses[status]}`).join(' · ')}</p>}
                </div>
              </div>
              <button className="generate-button" disabled={blockers.length > 0 || generating} onClick={generate}>{generating ? t.generating : t.generate}</button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function StatusBadge({ status, label }: { status: RequirementStatus; label: string }) {
  const icon = status === 'OK' ? '✓' : status === 'Not provided' ? '–' : '!'
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(' ', '-')}`}><i>{icon}</i>{label}</span>
}

