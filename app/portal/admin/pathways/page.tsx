'use client'

import { PathwayMediaManager } from '@/components/PathwayMediaManager'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'

export default function PortalPathwayMediaPage() {
  return (
    <PortalShell
      config={groundsConfig}
      title="Landing media"
      description="Manage the media shown behind each pathway card on the public landing page."
    >
      <PathwayMediaManager />
    </PortalShell>
  )
}
