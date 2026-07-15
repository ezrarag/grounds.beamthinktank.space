'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from '@/components/SiteFooter'
import { groundsConfig } from '@/lib/ngoConfig'

const footerlessPublicRoutes = ['/', '/about', '/properties', '/testimony', '/tracks']

export function ConditionalFooter() {
  const pathname = usePathname()
  if (footerlessPublicRoutes.some((route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)))) {
    return null
  }
  return <SiteFooter config={groundsConfig} />
}
