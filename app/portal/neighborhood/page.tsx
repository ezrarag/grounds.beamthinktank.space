import { NeighborhoodCommunityWorkspace } from '@/components/neighborhood/NeighborhoodCommunityWorkspace'
import { ParcelErrorBoundary } from '@/components/ParcelErrorBoundary'

export default function NeighborhoodDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ParcelErrorBoundary fallbackTitle="Neighborhood Community Workspace">
        <NeighborhoodCommunityWorkspace />
      </ParcelErrorBoundary>
    </div>
  )
}
