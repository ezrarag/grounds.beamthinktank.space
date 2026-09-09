'use client'

import { PortalPageShell } from '@/components/PortalPageShell'
import { SuggestSiteForm } from '@/components/SuggestSiteForm'

export default function SuggestSitePage() {
  return (
    <PortalPageShell
      title="Institutional & Division Site Intake"
      description="Does your department, school, library, or civic agency need space or have a building to co-develop? Submit your site requirements."
    >
      <div className="mx-auto max-w-2xl">
        <SuggestSiteForm />
      </div>
    </PortalPageShell>
  )
}
