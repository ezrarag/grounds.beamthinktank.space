'use client'

import { useState } from 'react'
import { Pin, Workflow } from 'lucide-react'
import { AcquisitionMap } from '@/components/AcquisitionMap'
import { PropertyCard } from '@/components/PropertyCard'
import { PortalShell } from '@/components/PortalShell'
import { useAcquisitionSites, type BeamAsset, type BeamAssetStage } from '@/lib/useAcquisitionSites'
import { groundsConfig } from '@/lib/ngoConfig'

const acquisitionStages: BeamAssetStage[] = ['SIGNAL', 'CLAIM', 'ACCESS', 'STABILIZE', 'ACTIVATE', 'SECURE', 'TRANSFER']

export default function PortalPropertiesPage() {
  const { sites, loading, error } = useAcquisitionSites()
  const [selectedSite, setSelectedSite] = useState<BeamAsset | null>(null)
  const [selectedStage, setSelectedStage] = useState<BeamAssetStage | null>(null)
  const filteredSites = selectedStage ? sites.filter((site) => site.acquisitionStage === selectedStage) : sites
  const selectStage = (stage: BeamAssetStage | null) => {
    setSelectedStage(stage)
    setSelectedSite(null)
  }

  return (
    <PortalShell
      config={groundsConfig}
      title="Acquisition pipeline"
      description="Property sourcing and diligence surface for BEAM Grounds."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          {loading ? (
            <div className="surface-panel flex min-h-[420px] items-center justify-center p-8 text-sm text-white/64 shadow-grounds">
              Loading acquisition sites...
            </div>
          ) : error ? (
            <div className="surface-panel border-red-300/25 p-8 text-sm text-red-100 shadow-grounds">
              {error}
            </div>
          ) : (
            <AcquisitionMap sites={filteredSites} onSelect={setSelectedSite} />
          )}

          <PropertyCard site={selectedSite} onClose={() => setSelectedSite(null)} />
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">Pipeline stages</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => selectStage(null)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selectedStage === null
                    ? 'border-grounds-sand/45 bg-grounds-sand/10 text-grounds-sand'
                    : 'border-white/10 bg-white/[0.03] text-white/72 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <Pin className="h-4 w-4 text-grounds-sand" />
                All stages
              </button>
              {acquisitionStages.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => selectStage(stage)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedStage === stage
                      ? 'border-grounds-sand/45 bg-grounds-sand/10 text-grounds-sand'
                      : 'border-white/10 bg-white/[0.03] text-white/72 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <Pin className="h-4 w-4 text-grounds-sand" />
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-white">
              <Workflow className="h-4 w-4 text-grounds-sand" />
              <p className="font-medium">Operator note</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">
              Acquisition and finance roles should land here from `/portal/dashboard` via `resolvePortalPath`.
            </p>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
