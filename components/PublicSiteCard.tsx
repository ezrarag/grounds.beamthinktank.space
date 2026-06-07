'use client'

import { ArrowRight, Building2, Landmark, Users } from 'lucide-react'
import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'

const stageBadgeClasses: Record<BeamAssetStage, string> = {
  SIGNAL: 'border-amber-300/35 bg-amber-400/14 text-amber-100',
  CLAIM: 'border-blue-300/35 bg-blue-400/14 text-blue-100',
  ACCESS: 'border-purple-300/35 bg-purple-400/14 text-purple-100',
  STABILIZE: 'border-teal-300/35 bg-teal-400/14 text-teal-100',
  ACTIVATE: 'border-green-300/35 bg-green-400/14 text-green-100',
  SECURE: 'border-emerald-300/35 bg-emerald-400/14 text-emerald-100',
  TRANSFER: 'border-white/25 bg-white/10 text-white/78',
}

function StageBadge({ stage }: { stage: BeamAssetStage }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${stageBadgeClasses[stage]}`}>
      {stage}
    </span>
  )
}

function compactList(values: string[], fallback: string) {
  if (values.length === 0) return fallback
  return values.slice(0, 3).join(', ')
}

export function PublicSiteCard({
  site,
  isSelected,
  onSelect,
}: {
  site: BeamAsset
  isSelected: boolean
  onSelect: (site: BeamAsset) => void
}) {
  const uses = site.cohortUses?.length ? site.cohortUses : site.primaryUseCases
  const suggestedBy = site.suggestedBy?.name || 'Community participant'

  return (
    <button
      type="button"
      onClick={() => onSelect(site)}
      className={`group flex h-full flex-col rounded-[1.5rem] border p-5 text-left transition ${
        isSelected
          ? 'border-grounds-sand/55 bg-grounds-sand/10'
          : 'border-white/10 bg-[#12211c] hover:border-white/20 hover:bg-white/[0.06]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-tight text-white">{site.name}</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">{site.address}</p>
        </div>
        <StageBadge stage={site.acquisitionStage} />
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/70">
        {site.publicNarrative || site.operatorNarrative || 'Candidate site being reviewed for community-serving acquisition.'}
      </p>

      <div className="mt-5 space-y-3 text-sm text-white/66">
        <div className="flex gap-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-grounds-sand" />
          <span>Suggested by {suggestedBy}</span>
        </div>
        <div className="flex gap-3">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-grounds-sand" />
          <span>{compactList(uses, 'Uses and cohorts being mapped')}</span>
        </div>
        <div className="flex gap-3">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-grounds-sand" />
          <span>{site.ngoLinks?.length ? `${site.ngoLinks.length} trust relationship${site.ngoLinks.length === 1 ? '' : 's'}` : site.financePlan?.planType || 'Trust and finance mapping pending'}</span>
        </div>
      </div>

      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-grounds-sand">
        Review site
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </button>
  )
}
