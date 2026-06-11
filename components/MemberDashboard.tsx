'use client'

import Link from 'next/link'
import { type User } from 'firebase/auth'
import {
  ArrowRight,
  Building2,
  Compass,
  Handshake,
  Hammer,
  Home,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Scale,
  Settings2,
  type LucideIcon,
} from 'lucide-react'
import { resolvePortalPath } from '@/lib/resolvePortalPath'
import { PATHWAY_META } from '@/lib/pathwayDashboards'
import type { NGOConfig, PathwayRole } from '@/lib/ngoConfig'
import { cn } from '@/lib/utils'

const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  hammer: Hammer,
  megaphone: Megaphone,
  handshake: Handshake,
  scale: Scale,
}

type NavLink = { href: string; label: string; icon: LucideIcon }

const PATHWAY_NAV_ORDER: PathwayRole[] = ['learn', 'earn', 'teach', 'partner', 'own']

/** Shared links every authenticated member sees alongside their workspace. */
const SHARED_LINKS: NavLink[] = [{ href: '/portal/properties', label: 'Acquisition Map', icon: MapPinned }]

/** Admin-only links (the "see everything" permission level). */
const ADMIN_LINKS: NavLink[] = [
  { href: '/portal/acquisition', label: 'Acquisition Overview', icon: LayoutDashboard },
  { href: '/portal/admin', label: 'Site Admin', icon: Settings2 },
]

function pathwayNavLink(pathwayRole: PathwayRole): NavLink {
  const meta = PATHWAY_META[pathwayRole]
  return { href: meta.route, label: meta.navLabel, icon: NAV_ICONS[meta.icon] ?? Home }
}

function buildNavLinks(pathwayRole: PathwayRole | null, isAdmin: boolean): NavLink[] {
  if (isAdmin) {
    return [
      ...PATHWAY_NAV_ORDER.map(pathwayNavLink),
      ...SHARED_LINKS,
      ...ADMIN_LINKS,
    ]
  }

  if (pathwayRole) {
    return [pathwayNavLink(pathwayRole), ...SHARED_LINKS]
  }

  // No pathway yet — point at the entry interstitial.
  return [{ href: '/portal/dashboard', label: 'Choose your entry point', icon: Compass }, ...SHARED_LINKS]
}

export function MemberDashboard({
  config,
  user,
  role,
  pathwayRole = null,
  isAdmin = false,
  currentPath,
  className,
}: {
  config: NGOConfig
  user: User
  role: string
  pathwayRole?: PathwayRole | null
  isAdmin?: boolean
  currentPath: string
  className?: string
}) {
  const recommendedPath = resolvePortalPath({ pathwayRole, role })
  const displayName = user.displayName || user.email || 'BEAM participant'
  const navLinks = buildNavLinks(pathwayRole, isAdmin)

  const roleContext = pathwayRole
    ? `${PATHWAY_META[pathwayRole].navLabel.toLowerCase()} pathway`
    : `${role} role context`

  return (
    <section className={cn('surface-panel p-6 shadow-grounds', className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="eyebrow">Authenticated Member</p>
          <div>
            <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
            <p className="mt-2 text-sm text-white/68">
              Signed into {config.name} on your <span className="text-white">{roleContext}</span>
              {isAdmin ? <span className="text-white"> · admin access</span> : null}.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-white/48">Organization</p>
              <p className="mt-2 font-medium text-white">{config.organizationId}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-white/48">Cohort</p>
              <p className="mt-2 font-medium text-white">{config.cohortId}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-[#12211c] p-5 lg:max-w-sm">
          <div className="flex items-center gap-3 text-white">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-white/56">Your workspace</p>
              <p className="font-medium">{recommendedPath}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/66">
            Grounds routes on your self-sorted pathway; admins keep a full view and can preview any pathway dashboard.
          </p>
          <a href={config.beamHomeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-grounds-sand">
            Return to BEAM Home
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = currentPath === href

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-[1.4rem] border px-4 py-4 text-sm transition',
                isActive ? 'border-white/20 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.03] text-white/72 hover:text-white',
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
