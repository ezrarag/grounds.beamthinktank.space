'use client'

import { X } from 'lucide-react'
import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'

interface PropertyCardProps {
  site: BeamAsset | null
  onClose: () => void
}

const stageBadgeClasses: Record<BeamAssetStage, string> = {
  SIGNAL: 'border-amber-300/35 bg-amber-400/14 text-amber-100',
  CLAIM: 'border-blue-300/35 bg-blue-400/14 text-blue-100',
  ACCESS: 'border-purple-300/35 bg-purple-400/14 text-purple-100',
  STABILIZE: 'border-teal-300/35 bg-teal-400/14 text-teal-100',
  ACTIVATE: 'border-green-300/35 bg-green-400/14 text-green-100',
  SECURE: 'border-emerald-300/35 bg-emerald-400/14 text-emerald-100',
  TRANSFER: 'border-white/25 bg-white/10 text-white/78',
}

const scoreLabels: Array<keyof BeamAsset['scores']> = ['capacity', 'impact', 'stability', 'revenue', 'partner']

function StageBadge({ stage }: { stage: BeamAssetStage }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${stageBadgeClasses[stage]}`}>
      {stage}
    </span>
  )
}

export function PropertyCard({ site, onClose }: PropertyCardProps) {
  if (!site) return null

  const latestHistory = [...site.stageHistory].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]

  return (
    <aside className="surface-panel p-5 shadow-grounds">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{site.name}</h2>
          <p className="mt-1 text-sm text-white/60">{site.address}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close property details"
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <StageBadge stage={site.acquisitionStage} />
      </div>

      <p className="mt-5 text-sm leading-7 text-white/70">{site.operatorNarrative}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {site.primaryUseCases.map((useCase) => (
          <span key={useCase} className="rounded-full border border-grounds-sand/45 px-3 py-1 text-xs font-medium text-grounds-sand">
            {useCase}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-white">Scores</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {scoreLabels.map((scoreKey) => (
            <div key={scoreKey} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#12211c] px-3 py-2 text-sm">
              <span className="capitalize text-white/66">{scoreKey}</span>
              <span className="font-semibold text-white">{site.scores[scoreKey]} / 5</span>
            </div>
          ))}
        </div>
      </div>

      {latestHistory ? (
        <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
          <p className="text-sm font-medium text-white">Most recent stage</p>
          <div className="mt-3">
            <StageBadge stage={latestHistory.stage} />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70">{latestHistory.note}</p>
          <p className="mt-2 text-xs text-white/50">{latestHistory.timestamp}</p>
        </div>
      ) : null}
    </aside>
  )
}
