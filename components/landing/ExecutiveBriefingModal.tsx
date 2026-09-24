'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, RotateCcw, MessageSquarePlus, ArrowRight, ShieldCheck, Coins } from 'lucide-react'

interface ExecutiveBriefingModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAgenda: () => void
}

const CHAPTERS = [
  {
    time: '0:00',
    title: '01. The Hook: 14 Days vs. 18 Months',
    text: 'Traditional real estate takes 18 months and millions in predatory bank debt. Here is how BEAM acquires and activates community property in 14 days.',
  },
  {
    time: '0:20',
    title: '02. The Method: Nominal Deeds & Pre-Law',
    text: 'We use nominal title transfers, abandonment clauses, and standardized pre-law memos to step into tax-delinquent properties instantly, turning closed liabilities back into active civic assets.',
  },
  {
    time: '0:45',
    title: '03. The Engine: BFCU Labor Collateral',
    text: 'Local trade and music cohorts fix the space to earn accredited sweat-equity tokens, sheltered under our non-profit umbrella and backed by BEAM Federal Credit Union for rehab capital.',
  },
  {
    time: '1:10',
    title: '04. The Shield: 99-Year Community Trust',
    text: 'Underlying land is deeded to a permanent Community Land Trust so no one can flip the neighborhood. Participants live free or cost-based with zero credit score gatekeeping.',
  },
]

export function ExecutiveBriefingModal({ isOpen, onClose, onOpenAgenda }: ExecutiveBriefingModalProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeChapter, setActiveChapter] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      setActiveChapter(0)
      setIsPlaying(false)
      return
    }

    setIsPlaying(true)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    // 80-second loop total (20s per chapter)
    const intervalMs = 200
    const stepPct = (intervalMs / (80 * 1000)) * 100

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepPct
        if (next >= 100) {
          setIsPlaying(false)
          return 100
        }
        const chapterIdx = Math.min(Math.floor((next / 100) * CHAPTERS.length), CHAPTERS.length - 1)
        setActiveChapter(chapterIdx)
        return next
      })
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, isPlaying])

  if (!isOpen) return null

  function selectChapter(idx: number) {
    setActiveChapter(idx)
    setProgress((idx / CHAPTERS.length) * 100)
    setIsPlaying(true)
  }

  function restart() {
    setProgress(0)
    setActiveChapter(0)
    setIsPlaying(true)
  }

  const current = CHAPTERS[activeChapter]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-[#0b1712] shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-mono text-xs uppercase tracking-widest text-white/70">
              Executive Briefing {'//'} 90-Second Operating Loop
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video / Visual Simulation Canvas */}
        <div className="relative aspect-video w-full overflow-hidden bg-black/60">
          {/* Subtle Ambient Video / Motion Graphic Background */}
          <video
            src="https://assets.mixkit.co/videos/preview/mixkit-modern-buildings-in-a-financial-district-41484-large.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1712] via-[#0b1712]/60 to-black/40" />

          {/* Chapter Overlay Content */}
          <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-beam-gold">
              <span>{current.time}</span>
              <span>·</span>
              <span>{current.title}</span>
            </div>
            <p className="mt-2 max-w-2xl text-base font-medium leading-relaxed text-white drop-shadow sm:text-xl">
              &ldquo;{current.text}&rdquo;
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-beam-gold transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Chapter Scrubbers */}
        <div className="grid grid-cols-4 gap-2 border-b border-white/10 bg-white/[0.02] p-3 text-xs">
          {CHAPTERS.map((ch, idx) => (
            <button
              key={ch.time}
              type="button"
              onClick={() => selectChapter(idx)}
              className={`rounded-lg px-2.5 py-1.5 text-left font-mono transition ${
                activeChapter === idx
                  ? 'border border-white/20 bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div className="text-[10px] tracking-widest text-emerald-400">{ch.time}</div>
              <div className="truncate font-sans font-medium">{ch.title.split(':')[1] || ch.title}</div>
            </button>
          ))}
        </div>

        {/* Action Bar & Branching Paths */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 bg-[#07100c]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-mono uppercase tracking-wider text-white hover:bg-white/15 transition"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={restart}
              className="rounded-full border border-white/15 p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
              aria-label="Restart briefing"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Branching Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenAgenda()
              }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#07100c] shadow-lg transition hover:bg-emerald-300"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Queue Agenda Topic
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
