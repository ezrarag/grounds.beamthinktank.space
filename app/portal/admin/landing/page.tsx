import { LandingShowcaseManager } from '@/components/admin/LandingShowcaseManager'
import { ParcelErrorBoundary } from '@/components/ParcelErrorBoundary'

export default function PortalLandingAdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ParcelErrorBoundary>
        <LandingShowcaseManager />
      </ParcelErrorBoundary>
    </div>
  )
}

