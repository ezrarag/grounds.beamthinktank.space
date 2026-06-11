import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { PortalAccessProvider } from '@/components/PortalAccessProvider'
import { PortalAuthGuard } from '@/components/PortalAuthGuard'

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
          <section className="surface-panel p-8 text-white/72">Checking your BEAM Grounds portal session...</section>
        </div>
      }
    >
      <PortalAccessProvider>
        <PortalAuthGuard>{children}</PortalAuthGuard>
      </PortalAccessProvider>
    </Suspense>
  )
}
