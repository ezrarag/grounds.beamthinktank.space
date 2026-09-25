'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import type { NGOConfig } from '@/lib/ngoConfig'

// The landing page, login page, and self-contained portal workspaces manage their own top headers.
export function ConditionalHeader({ config }: { config: NGOConfig }) {
  const pathname = usePathname()
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/profile' ||
    pathname === '/portal/participant' ||
    pathname.startsWith('/portal/participant/') ||
    pathname === '/portal/acquisition' ||
    pathname.startsWith('/portal/acquisition/') ||
    pathname === '/portal/admin' ||
    pathname.startsWith('/portal/admin/') ||
    pathname === '/portal/neighborhood' ||
    pathname.startsWith('/portal/neighborhood/')
  ) {
    return null
  }
  return <AppHeader config={config} />
}
