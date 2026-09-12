'use client'

import { AlertOctagon, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import type { DivisionId, DivisionSignal, SignalUrgency } from '@/lib/kernel/types'
import { useDivisionSignals } from '@/lib/kernel/emit'

interface DivisionInboxProps {
  division: DivisionId
  title?: string
}

const URGENCY_CONFIG: Record<SignalUrgency, { label: string; badgeClass: string }> = {
  blocking: { label: 'Blocking', badgeClass: 'bg-red-500/20 text-red-200 border-red-500/40' },
  critical: { label: 'Critical', badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
  standard: { label: 'Standard', badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-500/40' },
  low: { label: 'Low', badgeClass: 'bg-white/10 text-white/70 border-white/20' },
}

export function DivisionInbox({ division, title }: DivisionInboxProps) {
  const { signals, loading, error } = useDivisionSignals(division)

  const blockingSignals = signals.filter((s) => s.blocking || s.urgency === 'blocking')
  const criticalSignals = signals.filter((s) => !s.blocking && s.urgency === 'critical')
  const standardSignals = signals.filter((s) => !s.blocking && s.urgency === 'standard')
  const lowSignals = signals.filter((s) => !s.blocking && s.urgency === 'low')

  return (
    <div className="surface-panel p-6 shadow-grounds space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-grounds-sand" />
            <h3 className="text-xl font-bold text-white">
              {title || `${division.toUpperCase()} Division Obligation Inbox`}
            </h3>
          </div>
          <p className="mt-1 text-xs text-white/60">
            Rule-backed signals and cross-division obligations routed to {division}.
          </p>
        </div>

        <span className="rounded-full border border-grounds-sand/40 bg-grounds-sand/10 px-3 py-1 font-mono text-xs font-semibold text-grounds-sand">
          {signals.length} Active Signals
        </span>
      </div>

      {/* Prominent Blocking Warning Banner */}
      {blockingSignals.length > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/15 p-4 text-red-200 shadow-md">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 shrink-0 text-red-400 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                BLOCKING: {blockingSignals.length} Asset{blockingSignals.length > 1 ? 's' : ''} Halted at Stage Gate
              </p>
              <p className="text-xs text-red-200/80 mt-0.5">
                {blockingSignals.map((s) => `${s.assetName} (${s.stage})`).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>No blocking obligations currently halting asset progression for {division}.</span>
        </div>
      )}

      {/* Signal List Grouped by Urgency */}
      {loading ? (
        <div className="py-8 text-center text-xs text-white/50">Loading division signals...</div>
      ) : error ? (
        <div className="text-xs text-red-300 bg-red-500/10 p-3 rounded-xl">{error}</div>
      ) : signals.length === 0 ? (
        <div className="py-8 text-center text-sm text-white/50 border border-dashed border-white/10 rounded-2xl">
          Inbox empty. No open obligations for division <strong className="text-white">{division}</strong>.
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((sig) => {
            const urgency = URGENCY_CONFIG[sig.urgency] || URGENCY_CONFIG.standard
            return (
              <div
                key={sig.id}
                className={`rounded-2xl border p-4 transition space-y-2 ${
                  sig.blocking
                    ? 'border-red-500/40 bg-red-950/20'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase ${urgency.badgeClass}`}>
                      {urgency.label}
                    </span>
                    <span className="text-xs font-semibold text-white">{sig.assetName}</span>
                    <span className="text-[10px] font-mono text-white/40">Stage: {sig.stage}</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {sig.createdAt ? new Date(sig.createdAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white">{sig.title}</h4>
                <p className="text-xs leading-relaxed text-white/70">{sig.description}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
