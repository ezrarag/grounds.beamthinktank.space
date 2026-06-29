'use client'

import { type FormEvent, useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { cityLabel } from '@/lib/cities'
import { usePublicAcquisitionSites } from '@/lib/useAcquisitionSites'

type TargetType = 'site' | 'cohort' | 'participant'

const TARGETS: Array<{ value: TargetType; label: string }> = [
  { value: 'site', label: 'A site (toward activation)' },
  { value: 'cohort', label: 'A participant cohort' },
  { value: 'participant', label: 'An individual participant' },
]

export function NeighborDonateForm() {
  const { sites } = usePublicAcquisitionSites()
  const [targetType, setTargetType] = useState<TargetType>('site')
  const [siteId, setSiteId] = useState('')
  const [targetName, setTargetName] = useState('')
  const [amount, setAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const siteOptions = useMemo(
    () => sites.map((site) => ({ id: site.id, label: `${site.publicTitle || site.name} · ${cityLabel(site.regionId)}` })),
    [sites],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)

    if (!db) {
      setStatus('Firebase is not configured.')
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setStatus('Enter a donation amount.')
      return
    }

    const selectedSite = sites.find((site) => site.id === siteId)
    const targetLabel =
      targetType === 'site' ? selectedSite?.publicTitle || selectedSite?.name || '' : targetName.trim()

    if (!targetLabel) {
      setStatus('Choose what your donation supports.')
      return
    }

    setIsSaving(true)
    try {
      await addDoc(collection(db, 'donations'), {
        targetType,
        ...(targetType === 'site' ? { targetId: siteId } : {}),
        targetLabel,
        amount: value,
        donorName: donorName.trim(),
        donorEmail: auth?.currentUser?.email ?? null,
        uid: auth?.currentUser?.uid ?? null,
        message: message.trim(),
        status: 'pledged',
        createdAt: serverTimestamp(),
      })
      setStatus('Thank you — your pledge was recorded. The Grounds team will follow up to complete it.')
      setAmount('')
      setMessage('')
      setTargetName('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to record your donation.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">Support the work</p>
      <p className="mt-1 text-sm leading-6 text-white/56">
        Pledge toward a site&apos;s activation, a cohort, or an individual participant.
      </p>

      <div className="mt-4 grid gap-3">
        <label className="block text-sm text-white/70">
          Support
          <select
            value={targetType}
            onChange={(event) => setTargetType(event.target.value as TargetType)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          >
            {TARGETS.map((target) => (
              <option key={target.value} value={target.value}>
                {target.label}
              </option>
            ))}
          </select>
        </label>

        {targetType === 'site' ? (
          <label className="block text-sm text-white/70">
            Site
            <select
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            >
              <option value="">Select a site…</option>
              {siteOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm text-white/70">
            {targetType === 'cohort' ? 'Cohort name' : 'Participant name'}
            <input
              value={targetName}
              onChange={(event) => setTargetName(event.target.value)}
              placeholder={targetType === 'cohort' ? 'e.g. Architecture cohort' : 'e.g. Jordan A.'}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
            />
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            Amount (USD)
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            />
          </label>
          <label className="block text-sm text-white/70">
            Your name
            <input
              value={donorName}
              onChange={(event) => setDonorName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            />
          </label>
        </div>

        <label className="block text-sm text-white/70">
          Message (optional)
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? 'Recording…' : 'Pledge donation'}
      </button>
      {status ? <p className="mt-3 text-sm text-white/66">{status}</p> : null}

      <p className="mt-3 text-xs leading-5 text-white/40">
        Pledges are recorded for follow-up — online payment processing is coming soon.
      </p>
    </form>
  )
}
