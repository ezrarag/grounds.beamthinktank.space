'use client'

import { BeamGroundsNav } from '@/components/BeamGroundsNav'
import type { NGOConfig } from '@/lib/ngoConfig'
import { cn } from '@/lib/utils'

const groundsNavItems = [
  { href: '/', label: 'Overview' },
  { href: '/properties', label: 'Properties' },
  { href: '/testimony', label: 'Testimony' },
  { href: '/about', label: 'About' },
  { href: '/#tracks', label: 'Tracks' },
]

export function AppHeader({ config: _config, className }: { config: NGOConfig; className?: string }) {
  return (
    <header className={cn('sticky top-0 z-50 bg-[#07100c]/82 backdrop-blur-xl', className)}>
      <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center px-5 sm:px-8 lg:px-10">
        <BeamGroundsNav groundsLinks={groundsNavItems} />
      </div>
    </header>
  )
}
