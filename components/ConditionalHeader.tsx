'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/AppHeader'
import type { NGOConfig } from '@/lib/ngoConfig'

// The landing page and profile pages have no top header chrome.
export function ConditionalHeader({ config }: { config: NGOConfig }) {
  const pathname = usePathname()
  if (
    pathname === '/' ||
    pathname === '/profile' ||
    pathname === '/portal/participant' ||
    pathname.startsWith('/portal/participant/')
  ) {
    return null
  }
  return <AppHeader config={config} />
}
