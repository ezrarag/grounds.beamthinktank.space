'use client'

import { useState } from 'react'
import { AcquisitionMap } from '@/components/AcquisitionMap'
import { AcquisitionSiteList } from '@/components/AcquisitionSiteList'
import { AddPropertyForm } from '@/components/AddPropertyForm'
import { CKANImport } from '@/components/CKANImport'
import { NGOLinkManager } from '@/components/NGOLinkManager'
import { PropertyCard } from '@/components/PropertyCard'
import { ProjectionPanel } from '@/components/ProjectionPanel'
import { PublicSitePublishingControls } from '@/components/PublicSitePublishingControls'
import { PortalPageShell } from '@/components/PortalPageShell'
import { useAcquisitionSites, type BeamAsset } from '@/lib/useAcquisitionSites'

export default function PortalAcquisitionPage() {
  const { sites, loading, error } = useAcquisitionSites()
  const [selectedSite, setSelectedSite] = useState<BeamAsset | null>(null)

  return (
    <PortalPageShell
      title="Acquisition"
      description="Live property sourcing, site review, NGO link management, and new property intake."
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          {loading ? (
            <div className="surface-panel flex min-h-[420px] items-center justify-center p-8 text-sm text-white/64 shadow-grounds">
              Loading acquisition sites...
            </div>
          ) : error ? (
            <div className="surface-panel border-red-300/25 p-8 text-sm text-red-100 shadow-grounds">{error}</div>
          ) : (
            <AcquisitionMap sites={sites} onSelect={setSelectedSite} />
          )}
          <PropertyCard site={selectedSite} onClose={() => setSelectedSite(null)} />
          <ProjectionPanel site={selectedSite} />
        </div>

        <div className="space-y-5">
          <AcquisitionSiteList sites={sites} selectedSite={selectedSite} onSelect={setSelectedSite} />
          <PublicSitePublishingControls site={selectedSite} />
          <NGOLinkManager site={selectedSite} />
          <AddPropertyForm />
          <CKANImport />
        </div>
      </div>
    </PortalPageShell>
  )
}
