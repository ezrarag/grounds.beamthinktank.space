'use client'

import { useState } from 'react'
import { AcquisitionMap } from '@/components/AcquisitionMap'
import { AcquisitionSiteList } from '@/components/AcquisitionSiteList'
import { AddPropertyForm } from '@/components/AddPropertyForm'
import { CityRegistryManager } from '@/components/CityRegistryManager'
import { CivicScanImport } from '@/components/CivicScanImport'
import { CKANImport } from '@/components/CKANImport'
import { NGOLinkManager } from '@/components/NGOLinkManager'
import { PropertyCard } from '@/components/PropertyCard'
import { PropertyMediaManager } from '@/components/PropertyMediaManager'
import { ProjectionPanel } from '@/components/ProjectionPanel'
import { PublicSitePublishingControls } from '@/components/PublicSitePublishingControls'
import { PortalPageShell } from '@/components/PortalPageShell'
import { useIsAdmin } from '@/lib/useIsAdmin'
import { useAcquisitionSites, type BeamAsset } from '@/lib/useAcquisitionSites'
import { AdminRoleSwitcher, type AdminRoleContext } from '@/components/admin/AdminRoleSwitcher'
import { LiveDispatchMap } from '@/components/admin/LiveDispatchMap'
import { ParticipantCommandCenter } from '@/components/admin/ParticipantCommandCenter'

export default function PortalAcquisitionPage() {
  const { sites, loading, error } = useAcquisitionSites()
  const [selectedSite, setSelectedSite] = useState<BeamAsset | null>(null)
  const [adminRole, setAdminRole] = useState<AdminRoleContext>('acquisition')
  const { isAdmin, ready: adminReady } = useIsAdmin()

  return (
    <PortalPageShell
      title="Acquisition & Participant Dispatch Console"
      description="Dynamic participant routing, live proximity dispatch mapping, property sourcing, and stage maturation."
    >
      <div className="space-y-6">
        {/* Admin Role Context Switcher */}
        {adminReady && isAdmin && (
          <AdminRoleSwitcher activeRole={adminRole} onRoleChange={setAdminRole} />
        )}

        {/* Dynamic Context View 1: Network Dispatcher (Live Dispatch Map) */}
        {adminRole === 'dispatcher' && (
          <div className="space-y-6">
            <LiveDispatchMap sites={sites} />
            <ParticipantCommandCenter />
          </div>
        )}

        {/* Dynamic Context View 2: Cohort Manager (Participant Command Center) */}
        {adminRole === 'cohort' && (
          <div className="space-y-6">
            <ParticipantCommandCenter />
            <LiveDispatchMap sites={sites} />
          </div>
        )}

        {/* Dynamic Context View 3: Acquisition Lead (Property Intake & Stage Maturation) */}
        {adminRole === 'acquisition' && (
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
              {!adminReady ? null : isAdmin ? (
                <>
                  <PublicSitePublishingControls site={selectedSite} />
                  <PropertyMediaManager site={selectedSite} />
                  <NGOLinkManager site={selectedSite} />
                  <AddPropertyForm />
                  <CityRegistryManager />
                  <CivicScanImport />
                  <CKANImport />
                </>
              ) : (
                <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/60">
                  Property editing, civic-record scanning, and publishing are limited to BEAM Grounds admins. Sign in with
                  an authorized admin account to manage properties.
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalPageShell>
  )
}
