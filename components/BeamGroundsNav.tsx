'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type MenuKey = 'beam' | 'grounds' | null

const BEAM_LINKS = [
  { label: 'Admin login', href: '/login?next=/portal/acquisition' },
  { label: 'Participant login', href: '/login?next=/portal/participant' },
  { label: 'Neighborhood login', href: '/login?next=/portal/neighborhood' },
]

const ITEM_CLASS =
  'block whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em] text-white/80 transition hover:text-white'

export function BeamGroundsNav({
  cities,
  activeCity,
  onSelectCity,
}: {
  cities: string[]
  activeCity: string | null
  onSelectCity: (city: string | null) => void
}) {
  const [open, setOpen] = useState<MenuKey>(null)
  const navRef = useRef<HTMLDivElement>(null)

  // Dismiss when tapping/clicking outside (mobile + desktop).
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpen(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const groundsOptions: Array<{ label: string; value: string | null }> = [
    { label: 'All cities', value: null },
    ...cities.map((city) => ({ label: city, value: city })),
  ]

  return (
    <div
      ref={navRef}
      onMouseLeave={() => setOpen(null)}
      className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.28em] text-white"
    >
      {/* BEAM */}
      <div className="relative">
        <button
          type="button"
          onMouseEnter={() => setOpen('beam')}
          onClick={() => setOpen((current) => (current === 'beam' ? null : 'beam'))}
          aria-expanded={open === 'beam'}
          className="text-white/90 transition hover:text-white"
        >
          BEAM
        </button>
        {open === 'beam' ? (
          <div className="absolute left-0 top-full z-50 mt-3 min-w-[12rem] [perspective:600px]">
            <div className="space-y-2.5 rounded-2xl border border-white/12 bg-black/70 p-4 backdrop-blur-xl">
              {BEAM_LINKS.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(null)}
                  className={cn(ITEM_CLASS, 'animate-fold-down')}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <span className="text-white/30">·</span>

      {/* GROUNDS */}
      <div className="relative">
        <button
          type="button"
          onMouseEnter={() => setOpen('grounds')}
          onClick={() => setOpen((current) => (current === 'grounds' ? null : 'grounds'))}
          aria-expanded={open === 'grounds'}
          className="text-white/90 transition hover:text-white"
        >
          GROUNDS
          {activeCity ? <span className="ml-2 text-beam-gold">· {activeCity}</span> : null}
        </button>
        {open === 'grounds' ? (
          <div className="absolute left-0 top-full z-50 mt-3 min-w-[12rem] [perspective:600px]">
            <div className="space-y-2.5 rounded-2xl border border-white/12 bg-black/70 p-4 backdrop-blur-xl">
              {groundsOptions.map((option, index) => {
                const isActive = option.value === activeCity
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      onSelectCity(option.value)
                      setOpen(null)
                    }}
                    className={cn(
                      ITEM_CLASS,
                      'animate-fold-down text-left',
                      isActive && 'text-beam-gold hover:text-beam-gold',
                    )}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
