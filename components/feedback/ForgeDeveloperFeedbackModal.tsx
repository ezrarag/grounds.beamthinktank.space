'use client'

import { useState, useRef } from 'react'
import { X, MessageSquare, UploadCloud, CheckCircle2, Send, Bug, Lightbulb, Layout, ShieldAlert } from 'lucide-react'

interface ForgeDeveloperFeedbackModalProps {
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  isOpen: boolean
  onClose: () => void
}

export type FeedbackType = 'bug' | 'feature' | 'ux' | 'general'

export function ForgeDeveloperFeedbackModal({
  user,
  isOpen,
  onClose,
}: ForgeDeveloperFeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [comment, setComment] = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  function handleScreenshotSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setScreenshotPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/forge-echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceDomain: 'grounds.beamthinktank.space',
          division: 'grounds',
          userUid: user?.uid,
          displayName: user?.displayName || 'Steward Participant',
          email: user?.email || '',
          feedbackType,
          comment: comment.trim(),
          screenshotUrl: screenshotPreview || '',
          pageUrl: typeof window !== 'undefined' ? window.location.pathname : '/portal/participant',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSubmittedMessage(data.message || 'Feedback transmitted to forge.beamthinktank.space!')
        setTimeout(() => {
          setSubmittedMessage(null)
          setComment('')
          setScreenshotPreview(null)
          onClose()
        }, 2000)
      } else {
        const err = await res.json()
        setErrorMessage(err.error || 'Failed to submit feedback to Forge.')
      }
    } catch {
      setErrorMessage('Unable to connect to feedback bridge endpoint.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(237,243,234,0.18)] bg-[#0b1712] p-6 shadow-2xl text-[#edf3ea] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(237,243,234,0.12)] pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-serif text-lg font-medium text-[#edf3ea]">BEAM Forge Issue &amp; Feedback Echo</h3>
              <p className="text-[11px] text-[rgba(237,243,234,0.6)] font-mono">Transmits directly to forge.beamthinktank.space</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1 text-[rgba(237,243,234,0.5)] hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedMessage ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h4 className="font-serif text-lg text-[#edf3ea]">Feedback Transmitted!</h4>
            <p className="text-xs text-[rgba(237,243,234,0.7)] max-w-sm mx-auto">{submittedMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type Selector */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a] mb-2">
                Feedback Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bug', label: 'Bug / Error', icon: Bug, color: 'text-rose-400' },
                  { id: 'feature', label: 'Feature Idea', icon: Lightbulb, color: 'text-amber-400' },
                  { id: 'ux', label: 'UX Friction', icon: Layout, color: 'text-blue-400' },
                  { id: 'general', label: 'Comment', icon: MessageSquare, color: 'text-emerald-400' },
                ].map((cat) => {
                  const Icon = cat.icon
                  const active = feedbackType === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackType(cat.id as FeedbackType)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center text-xs font-semibold transition ${
                        active
                          ? 'border-[#88aa8f] bg-[#88aa8f]/20 text-[#edf3ea]'
                          : 'border-[rgba(237,243,234,0.12)] bg-[#102119]/60 text-[rgba(237,243,234,0.6)] hover:bg-[#102119]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${cat.color}`} />
                      <span className="text-[11px]">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a] mb-1">
                Developer Observations &amp; Issue Notes
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your experience, functional issues, or feature ideas while working in this section..."
                rows={4}
                required
                className="w-full rounded-2xl border border-[rgba(237,243,234,0.16)] bg-[#102119] p-3 text-xs text-[#edf3ea] placeholder:text-[rgba(237,243,234,0.4)] focus:border-[#88aa8f] focus:outline-none"
              />
            </div>

            {/* Screenshot Upload / Attachment */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a] mb-1">
                Attach Screenshot (Optional)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleScreenshotSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border border-dashed border-[rgba(237,243,234,0.2)] bg-[#102119]/50 p-3 text-center hover:border-[#88aa8f] transition flex items-center justify-center gap-2"
              >
                {screenshotPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={screenshotPreview} alt="Screenshot Preview" className="h-12 w-20 rounded-lg object-cover border border-white/20" />
                    <span className="text-xs text-emerald-300 font-mono">Screenshot attached (Tap to change)</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-[#c8b97a]" />
                    <span className="text-xs text-[rgba(237,243,234,0.7)]">Click to attach screenshot or photo</span>
                  </>
                )}
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/60">{errorMessage}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(237,243,234,0.1)]">
              <span className="font-mono text-[9px] text-[rgba(237,243,234,0.5)]">
                Target: forge.beamthinktank.space/api/feedback
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[rgba(237,243,234,0.16)] px-4 py-2 text-xs font-semibold text-[rgba(237,243,234,0.7)] hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2 text-xs font-semibold text-[#07100c] hover:bg-amber-300 transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? 'Transmitting...' : 'Echo to Forge'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
