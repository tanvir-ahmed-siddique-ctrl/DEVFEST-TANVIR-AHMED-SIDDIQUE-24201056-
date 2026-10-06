import { useEffect, useRef, useState } from 'react'
import type { Language } from './i18n/copy'

interface CinematicIntroProps {
  language: Language
}

const scenes = {
  en: [
    ['Every document.', 'One checked package.'],
    ['Catch what rejects a bid.', 'Missing. Expired. Duplicated.'],
    ['Keep the tender private.', 'Files never leave this browser.'],
    ['Put every page in order.', 'With a cover and footer ready to submit.'],
  ],
  bn: [
    ['প্রতিটি নথি।', 'একটি যাচাইকৃত প্যাকেজ।'],
    ['বিড বাতিলের কারণ ধরুন।', 'অনুপস্থিত। মেয়াদোত্তীর্ণ। অনুলিপি।'],
    ['টেন্ডার ব্যক্তিগত রাখুন।', 'ফাইল এই ব্রাউজার ছেড়ে যায় না।'],
    ['প্রতিটি পৃষ্ঠা ঠিক ক্রমে।', 'কভার ও ফুটারসহ জমা দেওয়ার জন্য প্রস্তুত।'],
  ],
} as const

const windows = [
  [0, 0.25],
  [0.25, 0.5],
  [0.5, 0.75],
  [0.75, 0.93],
] as const

function sceneVisibility(progress: number, start: number, end: number, index: number) {
  const edge = 0.055
  const enter = index === 0 ? 1 : Math.min(1, Math.max(0, (progress - start) / edge))
  const leave = Math.min(1, Math.max(0, (end - progress) / edge))
  return enter * leave
}

export function CinematicIntro({ language }: CinematicIntroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef(0)
  const targetRef = useRef(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return
    let frame = 0
    let lastPaint = 0

    const measure = () => {
      const rect = section.getBoundingClientRect()
      const travel = Math.max(1, section.offsetHeight - window.innerHeight)
      targetRef.current = Math.min(1, Math.max(0, -rect.top / travel))
    }

    const animate = (time: number) => {
      progressRef.current += (targetRef.current - progressRef.current) * 0.11
      const next = progressRef.current
      if (Number.isFinite(video.duration)) {
        const nextTime = next * Math.max(0, video.duration - 0.04)
        if (Math.abs(video.currentTime - nextTime) > 1 / 60) video.currentTime = nextTime
      }
      if (time - lastPaint > 32) {
        lastPaint = time
        setProgress(next)
      }
      frame = requestAnimationFrame(animate)
    }

    video.pause()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    measure()
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const exit = Math.max(0, (progress - 0.86) / 0.14)

  return (
    <section className="cinematic" ref={sectionRef} aria-label={language === 'en' ? 'Tender package introduction' : 'টেন্ডার প্যাকেজ পরিচিতি'}>
      <div className="cinematic-stage">
        <video
          ref={videoRef}
          className="cinematic-video"
          src={`${import.meta.env.BASE_URL}video/hero.mp4`}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{
            opacity: 1 - exit * 0.72,
            filter: `blur(${exit * 10}px)`,
            transform: `scale(${1 + exit * 0.04})`,
          }}
        />
        <div className="cinematic-shade" />
        <div className="cinematic-copy-stack">
          {scenes[language].map((copy, index) => {
            const opacity = sceneVisibility(progress, windows[index][0], windows[index][1], index) * (1 - exit)
            return (
              <div className="cinematic-copy" key={`${language}-${index}`} style={{ opacity, transform: `translateY(calc(-50% + ${(1 - opacity) * 18}px))` }}>
                <p>{String(index + 1).padStart(2, '0')} / 04</p>
                <h2>{copy[0]}</h2>
                <span>{copy[1]}</span>
              </div>
            )
          })}
        </div>
        <a className="cinematic-skip" href="#workspace">
          {language === 'en' ? 'Open workspace ↓' : 'ওয়ার্কস্পেস খুলুন ↓'}
        </a>
        <div className="cinematic-progress" aria-hidden="true">
          {windows.map(([start, end], index) => <i key={start} className={progress >= start && progress < end ? 'active' : ''}>{index + 1}</i>)}
        </div>
        <div className="cinematic-exit" style={{ opacity: exit }} />
      </div>
    </section>
  )
}
