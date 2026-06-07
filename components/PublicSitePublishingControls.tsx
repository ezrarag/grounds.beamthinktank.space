'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { BeamAsset } from '@/lib/useAcquisitionSites'

function joinList(values?: string[]) {
  return values?.join(', ') ?? ''
}

function parseCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function PublicSitePublishingControls({ site }: { site: BeamAsset | null }) {
  const [publicVisible, setPublicVisible] = useState(false)
  const [suggestedByName, setSuggestedByName] = useState('')
  const [suggestedByAffiliation, setSuggestedByAffiliation] = useState('')
  const [suggestedByNote, setSuggestedByNote] = useState('')
  const [publicNarrative, setPublicNarrative] = useState('')
  const [cohortUses, setCohortUses] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setPublicVisible(Boolean(site?.publicVisible))
    setSuggestedByName(site?.suggestedBy?.name ?? '')
    setSuggestedByAffiliation(site?.suggestedBy?.affiliation ?? '')
    setSuggestedByNote(site?.suggestedBy?.note ?? '')
    setPublicNarrative(site?.publicNarrative ?? '')
    setCohortUses(joinList(site?.cohortUses))
    setMessage(null)
  }, [site])

  if (!site) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Public portfolio publishing</p>
        <p className="mt-4 text-sm leading-7 text-white/56">Select a site to edit public-facing fields.</p>
      </section>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }

    if (!site) {
      setMessage('Select a site before saving public fields.')
      return
    }

    const siteId = site.id

    setIsSaving(true)

    try {
      await updateDoc(doc(db, 'beamAssets', siteId), {
        publicVisible,
        publicNarrative: publicNarrative.trim(),
        cohortUses: parseCommaList(cohortUses),
        suggestedBy: {
          name: suggestedByName.trim(),
          affiliation: suggestedByAffiliation.trim(),
          note: suggestedByNote.trim(),
        },
        updatedAt: new Date().toISOString(),
      })
      setMessage(publicVisible ? 'Saved and visible in public portfolio.' : 'Saved as private.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save public fields.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">Public portfolio publishing</p>
      <p className="mt-2 text-sm leading-6 text-white/56">Curate what advocates see outside the portal.</p>

      <label className="mt-4 flex items-center gap-3 text-sm text-white/72">
        <input
          type="checkbox"
          checked={publicVisible}
          onChange={(event) => setPublicVisible(event.target.checked)}
          className="h-4 w-4 accent-grounds-sand"
        />
        Show this site publicly
      </label>

      <div className="mt-4 grid gap-3">
        <label className="block text-sm text-white/70">
          Suggested by
          <input
            value={suggestedByName}
            onChange={(event) => setSuggestedByName(event.target.value)}
            placeholder="Krissy"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Affiliation
          <input
            value={suggestedByAffiliation}
            onChange={(event) => setSuggestedByAffiliation(event.target.value)}
            placeholder="Architecture cohort"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Suggested-by note
          <input
            value={suggestedByNote}
            onChange={(event) => setSuggestedByNote(event.target.value)}
            placeholder="Suggested after field work with local partners"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Public narrative
          <textarea
            value={publicNarrative}
            onChange={(event) => setPublicNarrative(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Cohort uses
          <input
            value={cohortUses}
            onChange={(event) => setCohortUses(event.target.value)}
            placeholder="architecture studio, civic anchor, workforce cohort"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? 'Saving...' : 'Save public fields'}
      </button>
      {message ? <p className="mt-3 text-sm text-white/66">{message}</p> : null}
    </form>
  )
}
