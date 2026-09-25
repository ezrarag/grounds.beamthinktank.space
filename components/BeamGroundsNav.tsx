'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, ArrowRight, ArrowUpRight, ShieldCheck, HardHat, Landmark, Layers, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type MenuKey = 'beam' | 'grounds' | null

interface NavItem {
  label: string
  href: string
  subtitle?: string
  badge?: string
  icon?: typeof ShieldCheck
}

const BEAM_TILES: NavItem[] = [
  {
    label: 'Admin Login',
    href: '/login?next=/portal/acquisition',
    subtitle: 'Pipeline, media showcase & 90s loop controls',
    badge: 'Executive Console',
    icon: ShieldCheck,
  },
  {
    label: 'Participant Login',
    href: '/login?next=/portal/participant',
    subtitle: 'Worklogs, verified hours & sweat equity credits',
    badge: 'Labor & Contributor',
    icon: HardHat,
  },
  {
    label: 'Neighborhood Login',
    href: '/login?next=/portal/neighborhood',
    subtitle: 'Civic registry, parcel voting & land trust deed status',
    badge: 'Civic Equity',
    icon: Landmark,
  },
]

const DEFAULT_GROUNDS_TILES: NavItem[] = [
  {
    label: '01 Capital Mechanics',
    href: '/#slide-0',
    subtitle: 'Replacing debt with nominal acquisitions & equity',
    badge: '01 // Capital',
    icon: Building2,
  },
  {
    label: '02 Labor & Site Ops',
    href: '/#slide-1',
    subtitle: 'Mobilizing local crews to execute on-site work',
    badge: '02 // Labor',
    icon: HardHat,
  },
  {
    label: '03 Community Equity',
    href: '/#slide-2',
    subtitle: 'Returning long-term appreciation to the neighborhood',
    badge: '03 // Equity',
    icon: Landmark,
  },
  {
    label: 'Properties Directory',
    href: '/properties',
    subtitle: 'Browse active municipal acquisitions & pipelines',
    badge: 'Inventory',
    icon: Building2,
  },
  {
    label: 'Participant Portal',
    href: '/portal/participant',
    subtitle: 'Participant hours, worklogs & sweat equity',
    badge: 'Roster',
    icon: HardHat,
  },
  {
    label: 'Admin Operations Console',
    href: '/portal/acquisition',
    subtitle: 'Executive command, pipeline & media management',
    badge: 'Executive',
    icon: ShieldCheck,
  },
]

const ITEM_CLASS =
  'block whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em] text-white/80 transition hover:text-white'

export function BeamGroundsNav({
  cities = [],
  activeCity = null,
  onSelectCity,
  groundsLinks,
}: {
  cities?: string[]
  activeCity?: string | null
  onSelectCity?: (city: string | null) => void
  groundsLinks?: Array<{ label: string; href: string }>
}) {
  const [open, setOpen] = useState<MenuKey>(null)
  const [mounted, setMounted] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close desktop dropdown on click outside or escape
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        // Only dismiss if not in mobile fullscreen view
        if (window.innerWidth >= 640) {
          setOpen(null)
        }
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Prevent body scrolling when mobile full-screen menu is open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [open])

  const groundsOptions: Array<{ label: string; value: string | null }> = [
    { label: 'All cities', value: null },
    ...cities.map((city) => ({ label: city, value: city })),
  ]

  const groundsTiles: NavItem[] =
    groundsLinks && groundsLinks.length > 0
      ? groundsLinks.map((link) => {
          let subtitle = 'Explore grounds process'
          let badge = 'Directory'
          let icon = Layers

          if (link.label.includes('01')) {
            subtitle = 'Replacing debt with nominal acquisitions & equity'
            badge = '01 // Capital'
            icon = Building2
          } else if (link.label.includes('02')) {
            subtitle = 'Mobilizing local crews to execute on-site work'
            badge = '02 // Labor'
            icon = HardHat
          } else if (link.label.includes('03')) {
            subtitle = 'Returning long-term appreciation to the neighborhood'
            badge = '03 // Equity'
            icon = Landmark
          } else if (link.href.includes('properties')) {
            subtitle = 'Browse active municipal acquisitions & pipelines'
            badge = 'Inventory'
            icon = Building2
          } else if (link.href.includes('participant')) {
            subtitle = 'Participant hours, worklogs & sweat equity'
            badge = 'Roster'
            icon = HardHat
          } else if (link.href.includes('admin') || link.href.includes('acquisition')) {
            subtitle = 'Executive command, pipeline & media management'
            badge = 'Command'
            icon = ShieldCheck
          } else if (link.href.includes('testimony')) {
            subtitle = 'Community voices, stakeholder feedback & recordings'
            badge = 'Testimony'
            icon = Layers
          } else if (link.href.includes('about')) {
            subtitle = 'BEAM Grounds civic thesis & operating principles'
            badge = 'About'
            icon = Landmark
          }

          return {
            label: link.label,
            href: link.href,
            subtitle,
            badge,
            icon,
          }
        })
      : DEFAULT_GROUNDS_TILES

  const mobileModal =
    open !== null ? (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[99999] flex flex-col justify-between overflow-y-auto bg-[#07100c]/98 p-6 backdrop-blur-3xl sm:hidden select-none animate-in fade-in duration-200"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#1c382e_0%,#0e1f1a_45%,#07100c_100%)] opacity-80" />

        {/* Top Bar: Switcher Tabs & Close Button */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOpen('beam')}
              className={cn(
                'font-mono text-sm uppercase tracking-[0.25em] transition',
                open === 'beam'
                  ? 'font-bold text-beam-gold border-b-2 border-beam-gold pb-0.5'
                  : 'text-white/50 hover:text-white',
              )}
            >
              BEAM
            </button>
            <span className="text-white/20">/</span>
            <button
              type="button"
              onClick={() => setOpen('grounds')}
              className={cn(
                'font-mono text-sm uppercase tracking-[0.25em] transition',
                open === 'grounds'
                  ? 'font-bold text-beam-gold border-b-2 border-beam-gold pb-0.5'
                  : 'text-white/50 hover:text-white',
              )}
            >
              GROUNDS
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(null)}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 hover:bg-white/15 hover:text-white transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content: High-Transparency Glass Tiles */}
        <div className="relative z-10 my-auto py-6 space-y-3.5">
          {open === 'beam' ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
                Portal Authentication // Access Nodes
              </p>
              <div className="space-y-3">
                {BEAM_TILES.map((tile) => {
                  const Icon = tile.icon || ShieldCheck
                  return (
                    <Link
                      key={tile.href}
                      href={tile.href}
                      onClick={() => setOpen(null)}
                      className="group flex items-center justify-between rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-md transition active:bg-emerald-500/15 active:border-emerald-500/30"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-beam-gold group-active:text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                              {tile.badge}
                            </span>
                          </div>
                          <h3 className="font-mono text-sm font-semibold tracking-wider text-white">
                            {tile.label}
                          </h3>
                          <p className="text-xs text-white/60 line-clamp-1">{tile.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition group-active:translate-x-1 group-active:text-white" />
                    </Link>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-beam-gold">
                Grounds Process & Navigation // Directory
              </p>
              <div className="space-y-2.5">
                {groundsTiles.map((tile) => {
                  const Icon = tile.icon || Layers
                  return (
                    <Link
                      key={tile.href}
                      href={tile.href}
                      onClick={() => setOpen(null)}
                      className="group flex items-center justify-between rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 backdrop-blur-md transition active:bg-emerald-500/15 active:border-emerald-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-beam-gold group-active:text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-beam-gold/90">
                              {tile.badge}
                            </span>
                          </div>
                          <h3 className="font-mono text-xs font-semibold tracking-wider text-white">
                            {tile.label}
                          </h3>
                          <p className="text-[11px] text-white/60 line-clamp-1">{tile.subtitle}</p>
                        </div>
                      </div>
                      {tile.href.startsWith('/') && !tile.href.startsWith('/#') ? (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition group-active:text-white" />
                      ) : (
                        <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition group-active:translate-x-1 group-active:text-white" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Bottom Footer Info */}
        <div className="relative z-10 border-t border-white/10 pt-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            BEAM Think Tank · Grounds Protocol
          </p>
        </div>
      </div>
    ) : null

  return (
    <>
      <div
        ref={navRef}
        className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.28em] text-white"
      >
        {/* BEAM Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => (current === 'beam' ? null : 'beam'))}
            aria-expanded={open === 'beam'}
            className="text-white/90 transition hover:text-white"
          >
            BEAM
          </button>

          {/* Desktop BEAM Dropdown */}
          {open === 'beam' ? (
            <div className="hidden sm:block absolute left-0 top-full z-50 min-w-[13rem] pt-3 [perspective:600px]">
              <div className="space-y-2.5 rounded-2xl border border-white/12 bg-black/75 p-4 backdrop-blur-xl">
                {BEAM_TILES.map((link, index) => (
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

        {/* GROUNDS Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => (current === 'grounds' ? null : 'grounds'))}
            aria-expanded={open === 'grounds'}
            className="text-white/90 transition hover:text-white"
          >
            GROUNDS
            {activeCity ? <span className="ml-2 text-beam-gold">· {activeCity}</span> : null}
          </button>

          {/* Desktop GROUNDS Dropdown */}
          {open === 'grounds' ? (
            <div className="hidden sm:block absolute left-0 top-full z-50 min-w-[14rem] pt-3 [perspective:600px]">
              <div className="space-y-2.5 rounded-2xl border border-white/12 bg-black/75 p-4 backdrop-blur-xl">
                {groundsTiles.map((link, index) => (
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
                {!groundsLinks &&
                  groundsOptions.map((option, index) => {
                    const isActive = option.value === activeCity
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          onSelectCity?.(option.value)
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

      {/* Render Mobile Fullscreen Menu directly into document.body to avoid parent container stacking constraints */}
      {mounted && mobileModal ? createPortal(mobileModal, document.body) : null}
    </>
  )
}

