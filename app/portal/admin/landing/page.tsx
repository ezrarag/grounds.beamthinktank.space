'use client'

import { LandingShowcaseManager } from '@/components/admin/LandingShowcaseManager'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'

export default function PortalLandingAdminPage() {
  return (
    <PortalShell
      config={groundsConfig}
      title="Landing Showcase & 90s Loop"
      description="Manage landing page slide artwork, add/modify multiple backgrounds per slide, and configure videos for the 90-second executive briefing."
    >
      <LandingShowcaseManager />
    </PortalShell>
  )
}
