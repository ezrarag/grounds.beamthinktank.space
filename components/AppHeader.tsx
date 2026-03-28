import Link from 'next/link'
import { ArrowUpRight, Leaf, LogIn, MapPinned, Sprout, Users } from 'lucide-react'
import { buildHandoffUrl } from '@/lib/beam-home'
import type { NGOConfig } from '@/lib/ngoConfig'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/about', label: 'About' },
  { href: '/#tracks', label: 'Tracks' },
  { href: '/portal', label: 'Portal' },
]

export function AppHeader({ config, className }: { config: NGOConfig; className?: string }) {
  return (
    <header className={cn('sticky top-0 z-50 border-b border-grounds-line bg-[#0b1712]/86 backdrop-blur-xl', className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border shadow-grounds"
            style={{
              borderColor: `${config.primaryColor}55`,
              backgroundColor: `${config.primaryColor}20`,
              color: config.primaryColor,
            }}
          >
            <Leaf className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.26em]" style={{ color: config.primaryColor }}>
              {config.name}
            </p>
            <p className="truncate text-sm text-white/72">{config.tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-white/76 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-white/72 xl:flex">
            <MapPinned className="h-4 w-4" />
            <Users className="h-4 w-4" />
            <Sprout className="h-4 w-4" />
          </div>
          <Link
            href={buildHandoffUrl(config, { returnPath: config.handoffReturnPath })}
            className="inline-flex items-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.04]"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#0b1712] transition hover:brightness-105"
            style={{ backgroundColor: config.primaryColor }}
          >
            Open Portal
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
