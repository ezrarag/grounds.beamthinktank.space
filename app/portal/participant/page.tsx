import { ParticipantProfileWorkspace } from '@/components/profile/ParticipantProfileWorkspace'
import { ParcelErrorBoundary } from '@/components/ParcelErrorBoundary'

export default function ParticipantDashboardPage() {
  return (
    <ParcelErrorBoundary fallbackTitle="Participant Portal Workspace">
      <ParticipantProfileWorkspace />
    </ParcelErrorBoundary>
  )
}
