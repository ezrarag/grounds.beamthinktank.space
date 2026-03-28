import { PortalDashboardRouter } from '@/components/PortalDashboardRouter'
import { groundsConfig } from '@/lib/ngoConfig'

export default function PortalDashboardPage() {
  return <PortalDashboardRouter config={groundsConfig} />
}
