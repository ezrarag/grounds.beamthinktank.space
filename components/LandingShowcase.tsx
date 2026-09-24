'use client'

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Play, MessageSquarePlus, Maximize2, Sparkles } from 'lucide-react'
import { landingSlides, type LandingSlide } from '@/lib/landingSlides'
import { useLandingConfig } from '@/lib/useLandingConfig'
import { BeamGroundsNav } from '@/components/BeamGroundsNav'
import { SlideEscalationDrawer } from '@/components/landing/SlideEscalationDrawer'
import { ExecutiveBriefingModal } from '@/components/landing/ExecutiveBriefingModal'
import { AgendaQueueModal } from '@/components/landing/AgendaQueueModal'
import { cn } from '@/lib/utils'

const SWIPE_THRESHOLD = 40

function pad(n: number) {
  return String(n + 1).padStart(2, '0')
}

export function LandingShowcase({ slides: initialSlides }: { slides?: LandingSlide[] }) {
  const config = useLandingConfig()
  const slides = initialSlides ?? config.slides

  const [index, setIndex] = useState(0)
  const [bgIndices, setBgIndices] = useState<Record<string, number>>({})
  const [isEscalated, setIsEscalated] = useState(false)
  const [isBriefingOpen, setIsBriefingOpen] = useState(false)
  const [isAgendaOpen, setIsAgendaOpen] = useState(false)
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({})
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const count = slides.length
  const slide = slides[index] ?? slides[0]

  const go = useCallback(
    (delta: number) => {
      setIsEscalated(false)
      setIndex((current) => (current + delta + count) % count)
    },
    [count],
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isEscalated || isBriefingOpen || isAgendaOpen) {
        if (event.key === 'Escape') {
          setIsEscalated(false)
          setIsBriefingOpen(false)
          setIsAgendaOpen(false)
        }
        return
      }

      if (event.key === 'ArrowLeft') go(-1)
      if (event.key === 'ArrowRight') go(1)
      if (event.key === ' ' || event.key === 'Enter') {
        setIsEscalated(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, isEscalated, isBriefingOpen, isAgendaOpen])

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current
    const deltaX = endX - touchStartX.current
    const deltaY = endY - touchStartY.current

    // Only trigger horizontal slide transition if horizontal gesture is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        // Swiping left -> next slide (01 -> 02 -> 03)
        go(1)
      } else {
        // Swiping right -> previous slide (03 -> 02 -> 01)
        go(-1)
      }
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const groundsLinks = [
    { label: '01 How It Makes Money', href: '#slide-0' },
    { label: '02 Stakeholder Agenda', href: '#slide-1' },
    { label: '03 Community Shield', href: '#slide-2' },
    { label: 'Properties Directory ↗', href: '/properties' },
    { label: 'Participant Portal ↗', href: '/portal/participant' },
    { label: 'Admin Console ↗', href: '/portal/admin/landing' },
  ]

  if (!slide) return null

  // Support multiple background images for the slide
  const currentImages =
    slide.backgroundImages && slide.backgroundImages.length > 0
      ? slide.backgroundImages
      : [slide.fallbackImageUrl].filter(Boolean)
  const activeBgIndex = (bgIndices[slide.id] ?? 0) % (currentImages.length || 1)
  const activeImageUrl = currentImages[activeBgIndex] || slide.fallbackImageUrl

  function cycleBackgroundVariant() {
    if (currentImages.length <= 1) return
    setBgIndices((prev) => ({
      ...prev,
      [slide.id]: (activeBgIndex + 1) % currentImages.length,
    }))
  }

  return (
    <>
      <section
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative h-[100dvh] w-full overflow-hidden bg-[#07100c] select-none touch-pan-y overscroll-x-none"
      >
        {/* Ambient Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#1c382e_0%,#0e1f1a_45%,#07100c_100%)]" />

        {/* Video / Background Layer */}
        {slide.videoPlaceholderUrl ? (
          <video
            key={slide.videoPlaceholderUrl}
            src={slide.videoPlaceholderUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-screen"
          />
        ) : activeImageUrl && !imgFailed[activeImageUrl] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={activeImageUrl}
            src={activeImageUrl}
            alt={slide.shortTitle}
            onError={() => setImgFailed((current) => ({ ...current, [activeImageUrl]: true }))}
            className="absolute inset-0 h-full w-full object-cover opacity-45 transition-opacity duration-700"
          />
        ) : null}

        {/* Dark readability overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07100c] via-black/50 to-black/40" />

        {/* Top Navigation Bar */}
        <div className="absolute left-5 top-5 z-30 sm:left-8 sm:top-7">
          <BeamGroundsNav
            groundsLinks={groundsLinks}
            activeCity={null}
            onSelectCity={() => undefined}
          />
        </div>

        {/* Top Right Direct Controls & Variant Switcher */}
        <div className="absolute right-5 top-5 z-30 flex items-center gap-3 sm:right-8 sm:top-7">
          {/* Multiple Artwork Switcher */}
          {currentImages.length > 1 ? (
            <button
              type="button"
              onClick={cycleBackgroundVariant}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/90 backdrop-blur-md hover:bg-black/70 hover:text-white transition"
              title="Click to toggle between artwork variants"
            >
              <Sparkles className="h-3 w-3 text-beam-gold" />
              <span>
                Artwork {activeBgIndex + 1}/{currentImages.length}
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsBriefingOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-emerald-300 backdrop-blur-md hover:bg-emerald-900/50 transition sm:inline-flex"
          >
            <Play className="h-3 w-3 fill-current" />
            90s Briefing
          </button>
          <button
            type="button"
            onClick={() => setIsAgendaOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-amber-200 backdrop-blur-md hover:bg-amber-900/50 transition sm:inline-flex"
          >
            <MessageSquarePlus className="h-3 w-3" />
            Agenda Queue
          </button>
          <p className="font-mono text-[11px] tracking-[0.2em] text-white/60">
            {pad(index)} <span className="text-white/30">/ {pad(count - 1)}</span>
          </p>
        </div>

        {/* Minimal Bottom Hero — Starts Small, Escalates on Click */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-16 sm:px-10 sm:pb-20">
          <div className="mx-auto max-w-4xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-beam-gold">
                {slide.stepNumber} {'//'} {slide.eyebrow}
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-2 font-display text-3xl leading-[1.1] text-white drop-shadow-sm sm:text-5xl md:text-6xl">
              {slide.shortTitle}
            </h1>

            {/* Short Punchy Summary */}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base md:text-lg">
              {slide.shortSummary}
            </p>

            {/* Action Buttons & Fast Escalation Triggers */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEscalated(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#07100c] shadow-lg transition hover:bg-white/90"
              >
                {slide.primaryCta.label}
                <Maximize2 className="h-4 w-4" />
              </button>

              {index === 1 ? (
                <button
                  type="button"
                  onClick={() => setIsBriefingOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
                >
                  <Play className="h-4 w-4 fill-current text-emerald-400" />
                  Watch 90s Loop
                </button>
              ) : null}

              {slide.secondaryCta ? (
                <Link
                  href={slide.secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
                >
                  {slide.secondaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous process slide"
              className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 text-white backdrop-blur-md transition hover:bg-black/70 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next process slide"
              className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-3 text-white backdrop-blur-md transition hover:bg-black/70 sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Bottom Dots & Step Indicator */}
            <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2.5">
              {slides.map((s, itemIndex) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setIndex(itemIndex)
                    setIsEscalated(false)
                  }}
                  aria-label={`Go to slide ${s.stepNumber}`}
                  aria-current={itemIndex === index}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    itemIndex === index ? 'w-7 bg-white' : 'w-2 bg-white/35 hover:bg-white/70',
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

      {/* Escalation Drawer */}
      <SlideEscalationDrawer
        slide={slide}
        isOpen={isEscalated}
        onClose={() => setIsEscalated(false)}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onOpenAgenda={() => setIsAgendaOpen(true)}
      />

      {/* 90-Second Executive Briefing Video / Audio Modal */}
      <ExecutiveBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        onOpenAgenda={() => setIsAgendaOpen(true)}
        chapters={config.operatingLoopChapters}
      />

      {/* Stakeholder Agenda Queue Modal */}
      <AgendaQueueModal isOpen={isAgendaOpen} onClose={() => setIsAgendaOpen(false)} />
    </>
  )
}
