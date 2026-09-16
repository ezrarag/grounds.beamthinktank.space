'use client'

import { useState } from 'react'
import { X, Send, Sparkles, Building2, CheckCircle2, ShieldAlert } from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { BeamAsset } from '@/lib/useAcquisitionSites'
import { getTrackMeta } from '@/lib/tracks'

interface AssetInterestModalProps {
  asset: BeamAsset | null
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  onClose: () => void
}

export type AssetInterestType = 'commercial-lease' | 'co-development' | 'equity-participant' | 'general'

export function AssetInterestModal({ asset, user, onClose }: AssetInterestModalProps) {
  const [interestType, setInterestType] = useState<AssetInterestType>('commercial-lease')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!asset) return null

  const targetAsset = asset
  const trackMeta = getTrackMeta(targetAsset.acquisitionTrack)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }

    setSubmitting(true)

    try {
      await addDoc(collection(db, 'assetInterest'), {
        assetId: targetAsset.id,
        assetName: targetAsset.name,
        address: targetAsset.address,
        acquisitionTrack: targetAsset.acquisitionTrack || 'C',
        userId: user?.uid || 'anonymous-member',
        userName: user?.displayName || 'Signed-In Member',
        userEmail: user?.email || '',
        interestType,
        notes: notes.trim(),
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      })

      setSubmitted(true)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to submit interest inquiry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-800" />
            <h3 className="text-base font-bold text-[#0f172a]">
              Commercial &amp; Site Interest Inquiry
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="text-xl font-bold text-[#0f172a]">Interest Inquiry Submitted!</h4>
            <p className="text-xs leading-relaxed text-slate-600 max-w-md mx-auto">
              Your interest in <strong className="text-slate-900">{targetAsset.name}</strong> has been recorded in the site acquisition queue. An operator will review your inquiry.
            </p>
            <button
              onClick={onClose}
              type="button"
              className="mt-4 rounded-full bg-[#1e293b] px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f172a]">{targetAsset.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase ${trackMeta.badgeClass}`}>
                  {trackMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">{targetAsset.address}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Inquiry / Engagement Type
              </label>
              <select
                value={interestType}
                onChange={(e) => setInterestType(e.target.value as AssetInterestType)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
              >
                <option value="commercial-lease">Commercial Lease / Tenancy Request</option>
                <option value="co-development">Co-Development &amp; Joint Operating Partner</option>
                <option value="equity-participant">Land Trust Equity Participant</option>
                <option value="general">General Site Inquiry &amp; Tour Request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Your Requirements or Proposal Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe your intended space use, square footage needs, timeline, or operating organization..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
              />
            </div>

            {message && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{message}</p>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={onClose}
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1e293b] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-900 shadow-md transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-emerald-400" />
                {submitting ? 'Submitting...' : 'Submit Interest Inquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
