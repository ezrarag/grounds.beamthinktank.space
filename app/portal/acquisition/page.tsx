'use client'

import { ExecutiveOperationsConsole } from '@/components/admin/ExecutiveOperationsConsole'
import { ParcelErrorBoundary } from '@/components/ParcelErrorBoundary'

export default function PortalAcquisitionPage() {
  return (
    <ParcelErrorBoundary fallbackTitle="Executive Operations Console">
      <ExecutiveOperationsConsole />
    </ParcelErrorBoundary>
  )
}
