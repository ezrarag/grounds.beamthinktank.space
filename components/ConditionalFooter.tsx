'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from '@/components/SiteFooter'
import { groundsConfig } from '@/lib/ngoConfig'

// The landing page is a single full-viewport card with no footer. Every other
// route keeps the global footer.
export function ConditionalFooter() {
  const pathname = usePathname()
  if (pathname === '/') return null
  return <SiteFooter config={groundsConfig} />
}
