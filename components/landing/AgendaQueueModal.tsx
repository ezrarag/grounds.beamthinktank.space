'use client'

import { useState } from 'react'
import { X, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface AgendaQueueModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  { id: 'monetization', label: 'Cash Flow / Monetization' },
  { id: 'title-acquisition', label: '14-Day Title Acquisition' },
  { id: 'bfcu-capital', label: 'BFCU Labor Collateral' },
  { id: 'community-clt', label: 'Land Trust & Covenants' },
  { id: 'participant-housing', label: 'Participant Housing & Cohorts' },
  { id: 'general', label: 'General Meeting Topic' },
]

export function AgendaQueueModal({ isOpen, onClose }: AgendaQueueModalProps) {
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('general')
  const [stakeholderName, setStakeholderName] = useState('')
  const [contact, setContact] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/agenda-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          stakeholderName: stakeholderName.trim() || 'Leadership Stakeholder',
          contact: contact.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit topic to agenda queue.')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function reset() {
    setSubmitted(false)
    setTopic('')
    setStakeholderName('')
    setContact('')
    setError(null)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={reset}
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-[#0b1712] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
              Leadership Decision Room
            </span>
            <h3 className="mt-1 text-lg font-semibold text-white">Queue a Meeting Agenda Topic</h3>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="mt-4 text-xl font-semibold text-white">Item Added to Meeting Docket</h4>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Your topic has been logged into the BEAM leadership queue. It will be prioritized on the agenda for Denail, DeTania, Rick, and Ezra’s next session.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-white/60">
              Have a concern about title control, BFCU labor capital stacks, or cohort pacing? Submit it here to have it addressed directly.
            </p>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                Your Name or Stakeholder Alias
              </label>
              <input
                type="text"
                placeholder="e.g. Denail / DeTania / Rick / Advisor"
                value={stakeholderName}
                onChange={(e) => setStakeholderName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                Topic Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                      category === cat.id
                        ? 'border-emerald-400 bg-emerald-500/15 text-white font-medium'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                What is your #1 question or priority for discussion? *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g., How do we structure the pre-law memo for the Milwaukee parcel without exposure to municipal code fines?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-1.5">
                Contact for Follow-up (Optional)
              </label>
              <input
                type="text"
                placeholder="Email or phone number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-full px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !topic.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-2.5 text-xs font-semibold text-[#07100c] shadow-lg hover:bg-emerald-300 disabled:opacity-50 transition"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Add to Agenda Docket
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
