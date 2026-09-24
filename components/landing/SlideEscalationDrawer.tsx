'use client'

import { X, ArrowRight, CheckCircle, ExternalLink, Play, MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'
import type { LandingSlide } from '@/lib/landingSlides'

interface SlideEscalationDrawerProps {
  slide: LandingSlide | null
  isOpen: boolean
  onClose: () => void
  onOpenBriefing: () => void
  onOpenAgenda: () => void
}

export function SlideEscalationDrawer({
  slide,
  isOpen,
  onClose,
  onOpenBriefing,
  onOpenAgenda,
}: SlideEscalationDrawerProps) {
  if (!isOpen || !slide) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center p-0 sm:p-6"
    >
      {/* Dim backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      />

      {/* Drawer Card */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/20 bg-[#07100c]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom duration-300">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/15 p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Eyebrow & Index */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-beam-gold">
            {slide.stepNumber} {'//'} {slide.eyebrow}
          </span>
        </div>

        {/* Bold Full Headline */}
        <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-4xl">
          {slide.fullHeadline}
        </h2>

        {/* Full Narrative */}
        <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
          {slide.fullNarrative}
        </p>

        {/* Key Metrics Grid */}
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {slide.keyMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center sm:text-left"
            >
              <div className="text-xl font-bold text-emerald-400 sm:text-3xl">{metric.value}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/60 sm:text-xs">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bullet Points */}
        <div className="mt-8 space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-wider text-white/50">
            System Mechanics & Safeguards
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {slide.bulletPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs leading-relaxed text-white/75 sm:text-sm">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Branches / Deep Dives */}
        {slide.branchOptions && slide.branchOptions.length > 0 ? (
          <div className="mt-8">
            <h3 className="font-mono text-xs uppercase tracking-wider text-white/50 mb-3">
              Explore Branches & Decision Paths
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {slide.branchOptions.map((branch) => {
                const isBriefing = branch.id === 'play-briefing'
                const isAgenda = branch.id === 'agenda-input'

                if (isBriefing) {
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenBriefing()
                      }}
                      className="group flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-950/40"
                    >
                      <div>
                        <div className="flex items-center justify-between text-emerald-400">
                          <span className="font-mono text-[11px] font-semibold uppercase">{branch.metric}</span>
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-white group-hover:text-emerald-300">
                          {branch.title}
                        </h4>
                        <p className="mt-1 text-xs text-white/60 line-clamp-2">{branch.description}</p>
                      </div>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono uppercase text-emerald-400">
                        Launch Briefing <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  )
                }

                if (isAgenda) {
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenAgenda()
                      }}
                      className="group flex flex-col justify-between rounded-2xl border border-beam-gold/30 bg-amber-950/20 p-4 text-left transition hover:border-beam-gold hover:bg-amber-950/40"
                    >
                      <div>
                        <div className="flex items-center justify-between text-beam-gold">
                          <span className="font-mono text-[11px] font-semibold uppercase">{branch.metric}</span>
                          <MessageSquarePlus className="h-4 w-4" />
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-white group-hover:text-amber-200">
                          {branch.title}
                        </h4>
                        <p className="mt-1 text-xs text-white/60 line-clamp-2">{branch.description}</p>
                      </div>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono uppercase text-beam-gold">
                        Add to Docket <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={branch.id}
                    href={branch.href || '/'}
                    className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.07]"
                  >
                    <div>
                      <div className="flex items-center justify-between text-white/50">
                        <span className="font-mono text-[11px] uppercase">{branch.metric}</span>
                        <ExternalLink className="h-3.5 w-3.5 group-hover:text-white" />
                      </div>
                      <h4 className="mt-2 text-sm font-semibold text-white group-hover:text-emerald-300">
                        {branch.title}
                      </h4>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">{branch.description}</p>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono uppercase text-white/60 group-hover:text-white">
                      Inspect View <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap gap-2">
            {slide.badges.map((b) => (
              <span
                key={b}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-mono text-white/70"
              >
                {b}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {slide.secondaryCta ? (
              <Link
                href={slide.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-white hover:bg-white/15 transition"
              >
                {slide.secondaryCta.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#07100c] hover:bg-white/90 transition"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
