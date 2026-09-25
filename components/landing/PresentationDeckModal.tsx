'use client'

import { useState, useEffect, useCallback, useRef, type TouchEvent, type MouseEvent } from 'react'
import { X, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, Play, MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'
import type { LandingSlide, DeckSlide } from '@/lib/landingSlides'

interface PresentationDeckModalProps {
  slide: LandingSlide | null
  isOpen: boolean
  onClose: () => void
  onOpenBriefing?: () => void
  onOpenAgenda?: () => void
}

export function PresentationDeckModal({
  slide,
  isOpen,
  onClose,
  onOpenBriefing,
  onOpenAgenda,
}: PresentationDeckModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Reset to first slide whenever modal opens or active slide changes
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0)
    }
  }, [isOpen, slide?.id])

  // Get or generate deck slides for this landing slide
  const deckSlides: DeckSlide[] = slide?.deckSlides && slide.deckSlides.length > 0
    ? slide.deckSlides
    : slide
    ? [
        {
          badge: `${slide.stepNumber} // OVERVIEW`,
          title: slide.shortTitle,
          headlineStat: slide.keyMetrics[0]?.value,
          statLabel: slide.keyMetrics[0]?.label,
          body: slide.shortSummary,
          bullets: slide.bulletPoints.slice(0, 2),
        },
        {
          badge: `${slide.stepNumber} // THESIS`,
          title: slide.fullHeadline,
          headlineStat: slide.keyMetrics[1]?.value,
          statLabel: slide.keyMetrics[1]?.label,
          body: slide.fullNarrative,
          bullets: slide.bulletPoints.slice(2, 4),
        },
      ]
    : []

  const totalSlides = deckSlides.length
  const currentDeck = deckSlides[currentSlideIndex] ?? deckSlides[0]

  const next = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1))
  }, [totalSlides])

  const prev = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        next()
      } else if (e.key === 'ArrowLeft') {
        prev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, next, prev, onClose])

  // Touch swipe handling
  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    const deltaY = (e.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        next()
      } else {
        prev()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Tap-to-advance (Instagram Stories tap zones)
  function handleContainerClick(e: MouseEvent<HTMLDivElement>) {
    // Check if target or parent is an interactive button/link
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width

    // Left 30% goes back, right 70% goes forward
    if (clickX < width * 0.3) {
      prev()
    } else {
      next()
    }
  }

  if (!isOpen || !slide || !currentDeck) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-[#07100c]/98 backdrop-blur-3xl text-white select-none animate-in fade-in duration-200"
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1c382e_0%,#0e1f1a_50%,#07100c_100%)] opacity-80" />

      {/* Top Header & Segmented Story Progress Bar */}
      <header className="relative z-20 w-full px-4 pt-4 sm:px-8 sm:pt-6">
        {/* Instagram-Style Segmented Bars */}
        <div className="mx-auto flex max-w-4xl gap-1.5 sm:gap-2">
          {deckSlides.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/20 transition"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  i < currentSlideIndex
                    ? 'w-full bg-emerald-400'
                    : i === currentSlideIndex
                    ? 'w-full bg-beam-gold shadow-[0_0_8px_rgba(212,175,55,0.8)]'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Top Info Bar */}
        <div className="mx-auto mt-4 flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-beam-gold">
              {slide.stepNumber} {'//'} {slide.eyebrow}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/50">
              {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 hover:bg-white/15 hover:text-white transition"
              aria-label="Close presentation deck"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Slide Card Area (Single Idea per Slide) */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-6 sm:px-12 sm:py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-emerald-300 shadow-sm">
            {currentDeck.badge}
          </div>

          {/* Slide Title */}
          <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
            {currentDeck.title}
          </h2>

          {/* Hero Headline Stat Block (if present) */}
          {currentDeck.headlineStat ? (
            <div className="my-5 sm:my-7 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-4 sm:px-8 sm:py-5 backdrop-blur-md shadow-[0_0_35px_rgba(16,185,129,0.12)]">
              <div className="font-display text-4xl sm:text-6xl font-extrabold text-beam-gold tracking-tight">
                {currentDeck.headlineStat}
              </div>
              {currentDeck.statLabel ? (
                <div className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  {currentDeck.statLabel}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Body Narrative */}
          <p className="max-w-xl text-sm leading-relaxed text-white/80 sm:text-lg">
            {currentDeck.body}
          </p>

          {/* Safeguard & Mechanics Bullets (if present) */}
          {currentDeck.bullets && currentDeck.bullets.length > 0 ? (
            <div className="mt-6 w-full max-w-lg space-y-2.5 text-left">
              {currentDeck.bullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs leading-relaxed text-white/75 sm:text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Action CTA on slide (if present) */}
          {currentDeck.cta ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {currentDeck.cta.action === 'briefing' && onOpenBriefing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                    onOpenBriefing()
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-xs sm:text-sm font-semibold text-[#07100c] shadow-lg hover:bg-emerald-300 transition"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {currentDeck.cta.label}
                </button>
              ) : currentDeck.cta.action === 'agenda' && onOpenAgenda ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                    onOpenAgenda()
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-beam-gold/40 bg-amber-950/60 px-6 py-3 text-xs sm:text-sm font-semibold text-beam-gold shadow-lg hover:bg-amber-900/60 transition"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  {currentDeck.cta.label}
                </button>
              ) : currentDeck.cta.href ? (
                <Link
                  href={currentDeck.cta.href}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-[#07100c] shadow-lg hover:bg-white/90 transition"
                >
                  {currentDeck.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>

      {/* Bottom Footer & Navigation Controls */}
      <footer className="relative z-20 w-full px-6 pb-6 sm:px-10 sm:pb-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Previous Slide Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            disabled={currentSlideIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-xs text-white/80 backdrop-blur-md hover:bg-white/15 hover:text-white transition disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Quick Tap Zone Hint on Mobile */}
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            <span className="hidden sm:inline">Tap or use arrow keys · </span>
            {currentSlideIndex + 1} of {totalSlides}
          </p>

          {/* Next Slide or Finish Button */}
          {currentSlideIndex < totalSlides - 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-5 py-2 font-mono text-xs font-semibold text-emerald-300 backdrop-blur-md hover:bg-emerald-500/20 transition"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-5 py-2 font-mono text-xs font-semibold text-[#07100c] shadow-lg hover:bg-emerald-300 transition"
            >
              <span>Done</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
