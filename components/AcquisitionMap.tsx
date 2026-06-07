'use client'

import { MapPinned } from 'lucide-react'
import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'

interface AcquisitionMapProps {
  sites: BeamAsset[]
  onSelect: (site: BeamAsset | null) => void
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

function StageBadge({ stage }: { stage: BeamAssetStage }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${stageBadgeClasses[stage]}`}>
      {stage}
    </span>
  )
}

export function AcquisitionMap({ sites, onSelect }: AcquisitionMapProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-[#12211c] p-5 shadow-grounds">
      <div className="flex items-center gap-3">
        <MapPinned className="h-5 w-5 text-grounds-sand" />
        <div>
          <p className="text-sm font-medium text-white">Acquisition sites</p>
          <p className="text-sm text-white/56">Live acquisition feed from Firestore.</p>
        </div>
      </div>

      {/* TODO: add mapbox-gl to package.json and replace with live map */}
      <div className="mt-5 grid min-h-[360px] gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-2">
        {sites.length > 0 ? (
          sites.map((site) => (
            <article key={site.id} className="flex min-h-48 flex-col rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">{site.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-white/60">{site.address}</p>
                </div>
                <StageBadge stage={site.acquisitionStage} />
              </div>

              <button
                type="button"
                onClick={() => onSelect(site)}
                className="mt-auto inline-flex w-fit items-center rounded-full border border-grounds-sand/45 px-3 py-2 text-sm font-medium text-grounds-sand transition hover:border-grounds-sand hover:bg-grounds-sand/10"
              >
                View details
              </button>
            </article>
          ))
        ) : (
          <div className="flex min-h-72 items-center justify-center rounded-[1.25rem] border border-dashed border-white/14 text-center text-sm text-white/60 sm:col-span-2">
            No acquisition sites match this view.
          </div>
        )}
      </div>
    </section>
  )
}
