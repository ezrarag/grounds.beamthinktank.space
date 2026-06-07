import type { ReactNode } from 'react'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'

export function PortalPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <PortalShell config={groundsConfig} title={title} description={description}>
      {children ?? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/66">
          This workspace is ready for BEAM Grounds content.
        </div>
      )}
    </PortalShell>
  )
}
