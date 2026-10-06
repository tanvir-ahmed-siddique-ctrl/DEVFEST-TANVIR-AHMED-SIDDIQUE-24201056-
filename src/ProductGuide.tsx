import { CheckCircle2, ChevronDown, FileCheck2, Languages, LockKeyhole } from 'lucide-react'
import type { Language } from './i18n/copy'

interface ProductGuideProps {
  language: Language
  tenderId?: string
}

const content = {
  en: {
    eyebrow: 'WHY TEAMS USE IT',
    title: 'A calmer final check before submission.',
    proof: [
      ['Private by design', 'PDFs are read and combined locally. They are not uploaded to our server.'],
      ['Rules before output', 'Required, expiry and duplicate checks must pass before generation.'],
      ['Built for real tenders', 'Bangla and English labels, ordered documents and page-numbered output.'],
    ],
    faqEyebrow: 'QUICK ANSWERS',
    faqTitle: 'Before you build the package',
    faqs: [
      ['Why is Generate disabled?', 'Every mandatory checklist row needs a valid, unique PDF match. Expiring documents also need a valid date. The blocker panel lists exactly what remains.'],
      ['Are my tender files uploaded?', 'No. Parsing, matching, hashing and package generation happen inside this browser. Closing the tab clears unsaved work.'],
      ['Can one PDF satisfy two requirements?', 'No. A file can be matched only once, preventing accidental cross-matches. Exact duplicate files are also flagged.'],
      ['What does the final PDF contain?', 'An English cover, selected documents in requirement order, and a tender ID plus Page X of Y footer on every page. Optional tools can add an index or seal.'],
      ['Can I continue later?', 'Use Save workspace to store the current files in this browser, then Reopen workspace on the same device and browser.'],
    ],
    footerLine: 'Tender document checks and packaging, entirely in your browser.',
    workspace: 'Workspace',
    faq: 'FAQ',
    privacy: 'Local processing',
  },
  bn: {
    eyebrow: 'কেন দলগুলো এটি ব্যবহার করে',
    title: 'জমা দেওয়ার আগে আরও নিশ্চিন্ত চূড়ান্ত যাচাই।',
    proof: [
      ['গোপনীয়তার জন্য তৈরি', 'PDF এই ব্রাউজারেই পড়া ও একত্র করা হয়। আমাদের সার্ভারে আপলোড হয় না।'],
      ['আউটপুটের আগে নিয়ম', 'তৈরির আগে আবশ্যিকতা, মেয়াদ ও অনুলিপি যাচাই পাস করতে হয়।'],
      ['বাস্তব টেন্ডারের জন্য', 'বাংলা ও ইংরেজি লেবেল, সঠিক নথির ক্রম এবং পৃষ্ঠা নম্বরসহ আউটপুট।'],
    ],
    faqEyebrow: 'দ্রুত উত্তর',
    faqTitle: 'প্যাকেজ তৈরির আগে',
    faqs: [
      ['Generate বোতাম বন্ধ কেন?', 'প্রতিটি আবশ্যিক সারির সঙ্গে একটি বৈধ ও আলাদা PDF মিলাতে হবে। মেয়াদযুক্ত নথিতে বৈধ তারিখও প্রয়োজন। ব্লকার অংশে বাকি কাজ দেখানো হয়।'],
      ['আমার টেন্ডার ফাইল কি আপলোড হয়?', 'না। পড়া, মিল, হ্যাশ এবং প্যাকেজ তৈরি এই ব্রাউজারের ভেতরেই হয়। সংরক্ষণ না করলে ট্যাব বন্ধের পর কাজ মুছে যাবে।'],
      ['একটি PDF কি দুটি শর্ত পূরণ করতে পারে?', 'না। ভুল ক্রস-ম্যাচ ঠেকাতে একটি ফাইল একবারই মিলানো যায়। একই ফাইলের অনুলিপিও শনাক্ত হয়।'],
      ['চূড়ান্ত PDF-তে কী থাকে?', 'ইংরেজি কভার, শর্তের ক্রমে নির্বাচিত নথি এবং প্রতিটি পৃষ্ঠায় টেন্ডার ID ও Page X of Y ফুটার। ঐচ্ছিকভাবে সূচি বা সিল যোগ করা যায়।'],
      ['পরে কি আবার কাজ চালাতে পারি?', 'বর্তমান ফাইল এই ব্রাউজারে রাখতে Save workspace এবং একই ডিভাইস ও ব্রাউজারে Reopen workspace ব্যবহার করুন।'],
    ],
    footerLine: 'টেন্ডার নথি যাচাই ও প্যাকেজিং—সম্পূর্ণ আপনার ব্রাউজারে।',
    workspace: 'ওয়ার্কস্পেস',
    faq: 'প্রশ্নোত্তর',
    privacy: 'লোকাল প্রসেসিং',
  },
} as const

const icons = [LockKeyhole, FileCheck2, Languages]

export function ProductGuide({ language, tenderId }: ProductGuideProps) {
  const text = content[language]
  return (
    <>
      <section className="proof-section" aria-labelledby="proof-title">
        <div className="section-lead">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="proof-title">{text.title}</h2>
        </div>
        <div className="proof-list">
          {text.proof.map(([title, description], index) => {
            const Icon = icons[index]
            return (
              <article key={title}>
                <Icon aria-hidden="true" />
                <div><strong>{title}</strong><p>{description}</p></div>
                <CheckCircle2 className="proof-check" aria-hidden="true" />
              </article>
            )
          })}
        </div>
      </section>

      <section className="faq-section" id="faq" aria-labelledby="faq-title">
        <div className="section-lead">
          <p className="eyebrow">{text.faqEyebrow}</p>
          <h2 id="faq-title">{text.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {text.faqs.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary><span>{question}</span><ChevronDown aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><span aria-hidden="true">✓</span><div><strong>Tender Package Builder</strong><p>{text.footerLine}</p></div></div>
        <nav aria-label="Footer">
          <a href="#workspace">{text.workspace}</a>
          <a href="#faq">{text.faq}</a>
          <span><LockKeyhole aria-hidden="true" />{text.privacy}</span>
        </nav>
        <small>{tenderId ?? 'Tender desk'} · MIT License</small>
      </footer>
    </>
  )
}
