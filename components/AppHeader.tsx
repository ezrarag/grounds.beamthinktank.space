'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, KeyRound, Leaf, MapPinned, Sprout, Users } from 'lucide-react'
import { buildHandoffUrl } from '@/lib/beam-home'
import type { NGOConfig } from '@/lib/ngoConfig'
import { cn } from '@/lib/utils'

const groundsNavItems = [
  { href: '/', label: 'Overview' },
  { href: '/properties', label: 'Properties' },
  { href: '/about', label: 'About' },
  { href: '/#tracks', label: 'Tracks' },
]

const beamNavItems = [
  { href: 'https://home.beamthinktank.space', label: 'Beam Home', external: true },
  { href: '/portal', label: 'Portal' },
  { href: buildHandoffUrl, label: 'Sign In' },
]

function HeaderDropdown({
  label,
  items,
  config,
}: {
  label: string
  items: Array<{ href: string | ((config: NGOConfig) => string); label: string; external?: boolean }>
  config: NGOConfig
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition',
          open
            ? 'border-white/28 bg-white/[0.08] text-white'
            : 'border-white/12 bg-white/[0.03] text-white/74 hover:border-white/24 hover:bg-white/[0.05] hover:text-white',
        )}
      >
        {label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      <div
        className={cn(
          'absolute left-0 top-full z-50 mt-2 min-w-[11rem] rounded-[1.1rem] border border-white/12 bg-[#0d1713]/96 p-2 shadow-2xl backdrop-blur-xl transition',
          open ? 'pointer-events-auto visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0',
        )}
      >
        {items.map((item) => {
          const href = typeof item.href === 'function' ? item.href(config) : item.href
          const content = (
            <>
              <span>{item.label}</span>
              {item.external ? <ArrowUpRight className="h-3 w-3 text-white/38" aria-hidden="true" /> : null}
            </>
          )

          return item.external ? (
            <a
              key={item.label}
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-[0.85rem] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/78 transition hover:bg-white/[0.06] hover:text-white"
            >
              {content}
            </a>
          ) : (
            <Link
              key={item.label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-[0.85rem] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/78 transition hover:bg-white/[0.06] hover:text-white"
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function AppHeader({ config, className }: { config: NGOConfig; className?: string }) {
  return (
    <header className={cn('sticky top-0 z-50 border-b border-grounds-line bg-[#0b1712]/86 backdrop-blur-xl', className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-grounds" style={{
            borderColor: `${config.primaryColor}55`,
            backgroundColor: `${config.primaryColor}20`,
            color: config.primaryColor,
          }}>
            <Leaf className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2">
            <HeaderDropdown label="Beam" items={beamNavItems} config={config} />
            <HeaderDropdown label="Grounds" items={groundsNavItems} config={config} />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-white/72 xl:flex">
            <MapPinned className="h-4 w-4" />
            <Users className="h-4 w-4" />
            <Sprout className="h-4 w-4" />
          </div>
          <Link
            href={buildHandoffUrl(config, { returnPath: config.handoffReturnPath })}
            aria-label="Sign in"
            title="Sign in"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 text-white/78 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
          >
            <KeyRound className="h-4 w-4" />
          </Link>
          <Link
            href="/portal"
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-[#0b1712] transition hover:brightness-105 sm:px-4"
            style={{ backgroundColor: config.primaryColor }}
          >
            <span className="hidden sm:inline">Portal</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
