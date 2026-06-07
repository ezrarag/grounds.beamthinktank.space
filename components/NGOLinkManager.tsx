'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { X } from 'lucide-react'
import { db } from '@/lib/firebase'
import type { BeamAsset } from '@/lib/useAcquisitionSites'

type RelationshipType = 'anchor-site' | 'service-site' | 'cohort-project' | 'training-site'
type CohortPool = NonNullable<BeamAsset['cohortPool']>
type NGOLink = NonNullable<BeamAsset['ngoLinks']>[number]

const relationshipTypes: RelationshipType[] = ['anchor-site', 'service-site', 'cohort-project', 'training-site']
const cohortPools: CohortPool[] = ['acquisition', 'financing', 'cohort', 'civic', 'all']

export function NGOLinkManager({ site }: { site: BeamAsset | null }) {
  const [ngoId, setNgoId] = useState('')
  const [ngoName, setNgoName] = useState('')
  const [ngoSubdomain, setNgoSubdomain] = useState('')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('anchor-site')
  const [message, setMessage] = useState<string | null>(null)

  if (!site) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">NGO links</p>
        <p className="mt-4 text-sm leading-7 text-white/56">Select a site to manage links.</p>
      </section>
    )
  }

  async function updateSite(updates: Record<string, unknown>) {
    if (!db || !site) {
      throw new Error('Firebase is not configured.')
    }

    await updateDoc(doc(db, 'beamAssets', site.id), updates)
  }

  async function removeProjectId(projectId: string) {
    setMessage(null)

    try {
      await updateSite({ linkedProjectIds: arrayRemove(projectId) })
      setMessage(`Removed ${projectId}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove project link.')
    }
  }

  async function addNGOLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const link: NGOLink = {
      ngoId: ngoId.trim(),
      ngoName: ngoName.trim(),
      ngoSubdomain: ngoSubdomain.trim(),
      relationshipType,
      linkedAt: new Date().toISOString(),
    }

    if (!link.ngoId || !link.ngoName || !link.ngoSubdomain) {
      setMessage('NGO ID, name, and subdomain are required.')
      return
    }

    try {
      await updateSite({ ngoLinks: arrayUnion(link) })
      setNgoId('')
      setNgoName('')
      setNgoSubdomain('')
      setRelationshipType('anchor-site')
      setMessage(`Added ${link.ngoName}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add NGO link.')
    }
  }

  async function removeNGOLink(link: NGOLink) {
    setMessage(null)

    try {
      await updateSite({ ngoLinks: arrayRemove(link) })
      setMessage(`Removed ${link.ngoName}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove NGO link.')
    }
  }

  async function saveCohortPool(cohortPool: CohortPool) {
    setMessage(null)

    try {
      await updateSite({ cohortPool })
      setMessage(`Saved cohort pool: ${cohortPool}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save cohort pool.')
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">NGO links</p>
      <p className="mt-2 text-sm leading-6 text-white/60">Selected property: {site.name}</p>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Linked project IDs</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {site.linkedProjectIds.length > 0 ? (
            site.linkedProjectIds.map((projectId) => (
              <button
                key={projectId}
                type="button"
                onClick={() => removeProjectId(projectId)}
                className="inline-flex items-center gap-2 rounded-full border border-grounds-sand/45 px-3 py-1 text-xs text-grounds-sand transition hover:border-grounds-sand hover:bg-grounds-sand/10"
              >
                {projectId}
                <X className="h-3 w-3" />
              </button>
            ))
          ) : (
            <span className="text-sm text-white/56">No linked BEAM projects yet.</span>
          )}
        </div>
      </div>

      <form onSubmit={addNGOLink} className="mt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            NGO ID
            <input
              value={ngoId}
              onChange={(event) => setNgoId(event.target.value)}
              placeholder="environment"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
            />
          </label>

          <label className="block text-sm text-white/70">
            NGO name
            <input
              value={ngoName}
              onChange={(event) => setNgoName(event.target.value)}
              placeholder="BEAM Environment"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
            />
          </label>
        </div>

        <label className="block text-sm text-white/70">
          NGO subdomain
          <input
            value={ngoSubdomain}
            onChange={(event) => setNgoSubdomain(event.target.value)}
            placeholder="environment.beamthinktank.space"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Relationship type
          <select
            value={relationshipType}
            onChange={(event) => setRelationshipType(event.target.value as RelationshipType)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          >
            {relationshipTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="rounded-full bg-grounds-sand px-4 py-2 text-sm font-semibold text-[#0b1712]">
          Add NGO link
        </button>
      </form>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Current NGO links</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {site.ngoLinks && site.ngoLinks.length > 0 ? (
            site.ngoLinks.map((link) => (
              <button
                key={`${link.ngoId}-${link.relationshipType}-${link.linkedAt}`}
                type="button"
                onClick={() => removeNGOLink(link)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/72 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                {link.ngoName} · {link.relationshipType}
                <X className="h-3 w-3 text-grounds-sand" />
              </button>
            ))
          ) : (
            <span className="text-sm text-white/56">No NGO links yet.</span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm text-white/70">
          Cohort pool
          <select
            value={site.cohortPool ?? 'acquisition'}
            onChange={(event) => saveCohortPool(event.target.value as CohortPool)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          >
            {cohortPools.map((pool) => (
              <option key={pool} value={pool}>
                {pool}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message ? <p className="mt-3 text-sm text-white/66">{message}</p> : null}
    </section>
  )
}
