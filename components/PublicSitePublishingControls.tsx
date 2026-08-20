'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'

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
  const [acquisitionStage, setAcquisitionStage] = useState<BeamAssetStage>('SIGNAL')
  const [cohortLead, setCohortLead] = useState('')
  const [scopeOfWorkUrl, setScopeOfWorkUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setPublicVisible(Boolean(site?.publicVisible))
    setSuggestedByName(site?.suggestedBy?.name ?? '')
    setSuggestedByAffiliation(site?.suggestedBy?.affiliation ?? '')
    setSuggestedByNote(site?.suggestedBy?.note ?? '')
    setPublicNarrative(site?.publicNarrative ?? '')
    setCohortUses(joinList(site?.cohortUses))
    setAcquisitionStage(site?.acquisitionStage ?? 'SIGNAL')
    setCohortLead((site as any)?.cohortLead ?? '')
    setScopeOfWorkUrl((site as any)?.scopeOfWorkUrl ?? '')
    setMessage(null)
  }, [site])

  if (!site) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Public portfolio publishing &amp; lifecycle maturation</p>
        <p className="mt-4 text-sm leading-7 text-white/56">Select a site to edit public-facing fields &amp; stage maturation.</p>
      </section>
    )
  }

  const isActivatedOrBeyond = acquisitionStage === 'ACTIVATE' || acquisitionStage === 'SECURE' || acquisitionStage === 'TRANSFER'

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

    if (isActivatedOrBeyond && (!cohortLead.trim() || !scopeOfWorkUrl.trim())) {
      setMessage('Properties in ACTIVATE or beyond require an assigned Cohort Lead and Scope of Work URL/PDF.')
      return
    }

    const siteId = site.id
    setIsSaving(true)

    try {
      await updateDoc(doc(db, 'beamAssets', siteId), {
        publicVisible,
        publicNarrative: publicNarrative.trim(),
        cohortUses: parseCommaList(cohortUses),
        acquisitionStage,
        cohortLead: cohortLead.trim(),
        scopeOfWorkUrl: scopeOfWorkUrl.trim(),
        suggestedBy: {
          name: suggestedByName.trim(),
          affiliation: suggestedByAffiliation.trim(),
          note: suggestedByNote.trim(),
        },
        updatedAt: new Date().toISOString(),
      })
      setMessage(publicVisible ? `Saved (${acquisitionStage} stage) and visible in public portfolio.` : 'Saved as private.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save public fields.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-white">Property Lifecycle Maturation &amp; Publishing</p>
        <p className="mt-1 text-xs text-white/56">Advance property stages and assign required cohort leads and scope of work PDFs.</p>
      </div>

      <label className="flex items-center gap-3 text-sm text-white/72">
        <input
          type="checkbox"
          checked={publicVisible}
          onChange={(event) => setPublicVisible(event.target.checked)}
          className="h-4 w-4 accent-grounds-sand"
        />
        Show this site publicly
      </label>

      <div className="grid gap-3">
        <label className="block text-xs font-semibold text-white/70">
          Acquisition &amp; Maturation Stage
          <select
            value={acquisitionStage}
            onChange={(e) => setAcquisitionStage(e.target.value as BeamAssetStage)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          >
            <option value="SIGNAL">SIGNAL — Property Sourced / Intake</option>
            <option value="CLAIM">CLAIM — Site Claimed / Initial Survey</option>
            <option value="ACCESS">ACCESS — Inspection &amp; Physical Access</option>
            <option value="STABILIZE">STABILIZE — Emergency Structural Envelope</option>
            <option value="ACTIVATE">ACTIVATE — Active Build Cohort &amp; Work Shifts</option>
            <option value="SECURE">SECURE — Permanent Stewardship</option>
            <option value="TRANSFER">TRANSFER — Deed Transfer Complete</option>
          </select>
        </label>

        {/* Conditional Maturation Fields when Stage is ACTIVATE or Beyond */}
        {isActivatedOrBeyond && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Stage Requirements: Active Build &amp; Stewardship
            </p>
            <label className="block text-xs text-white/80">
              Assigned Cohort Lead *
              <input
                value={cohortLead}
                onChange={(event) => setCohortLead(event.target.value)}
                placeholder="e.g. Ezra Haugabrooks / Marcus Vance"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3.5 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-emerald-400"
              />
            </label>

            <label className="block text-xs text-white/80">
              Approved Scope of Work PDF / URL *
              <input
                value={scopeOfWorkUrl}
                onChange={(event) => setScopeOfWorkUrl(event.target.value)}
                placeholder="e.g. https://docs.beamthinktank.space/scope-of-work-cumc.pdf"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3.5 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-emerald-400"
              />
            </label>
          </div>
        )}

        <label className="block text-xs text-white/70">
          Suggested by
          <input
            value={suggestedByName}
            onChange={(event) => setSuggestedByName(event.target.value)}
            placeholder="Krissy"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-xs text-white/70">
          Public narrative
          <textarea
            value={publicNarrative}
            onChange={(event) => setPublicNarrative(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-xs text-white/70">
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
        className="w-full rounded-full bg-grounds-sand py-3 text-sm font-semibold text-[#0b1712] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? 'Saving property lifecycle...' : 'Save Property Lifecycle & Maturation'}
      </button>
      {message ? <p className="mt-2 text-xs text-amber-200">{message}</p> : null}
    </form>
  )
}
