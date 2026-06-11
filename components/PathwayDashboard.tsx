'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Coins,
  FilePlus,
  FileText,
  GraduationCap,
  Hammer,
  Home,
  Handshake,
  ListChecks,
  MapPinned,
  Megaphone,
  PenTool,
  Receipt,
  Scale,
  ScrollText,
  Timer,
  Users,
  Vote,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig, type PathwayRole } from '@/lib/ngoConfig'
import { usePortalAccess } from '@/lib/usePortalAccess'
import { PATHWAY_DASHBOARDS, type DashboardTile } from '@/lib/pathwayDashboards'

const TILE_ICONS: Record<string, LucideIcon> = {
  'file-plus': FilePlus,
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  receipt: Receipt,
  'book-open': BookOpen,
  timer: Timer,
  'list-checks': ListChecks,
  hammer: Hammer,
  'graduation-cap': GraduationCap,
  'map-pinned': MapPinned,
  'check-circle': CheckCircle2,
  users: Users,
  'pen-tool': PenTool,
  'bar-chart': BarChart3,
  workflow: Workflow,
  vote: Vote,
  'badge-check': BadgeCheck,
  coins: Coins,
  scroll: ScrollText,
  home: Home,
  megaphone: Megaphone,
  handshake: Handshake,
  scale: Scale,
}

const PATHWAY_SWITCHER_ROLES: PathwayRole[] = ['learn', 'earn', 'teach', 'partner', 'own']

function Tile({ tile }: { tile: DashboardTile }) {
  const Icon = TILE_ICONS[tile.icon] ?? FileText
  const isLive = tile.status === 'live'

  const body = (
    <div
      className={`flex h-full flex-col rounded-[1.5rem] border p-5 transition ${
        tile.primary
          ? 'border-grounds-sand/40 bg-grounds-sand/[0.08]'
          : 'border-white/10 bg-white/[0.03]'
      } ${isLive ? 'hover:border-white/25 hover:bg-white/[0.06]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            tile.primary ? 'bg-grounds-sand/20 text-grounds-sand' : 'bg-white/[0.05] text-grounds-sand'
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {tile.primary ? (
          <span className="rounded-full border border-grounds-sand/40 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-grounds-sand">
            Start here
          </span>
        ) : isLive ? (
          <ArrowUpRight className="h-4 w-4 text-white/40" aria-hidden="true" />
        ) : null}
      </div>

      <p className="mt-4 font-medium text-white">{tile.title}</p>
      <p className="mt-2 flex-1 text-sm leading-6 text-white/64">{tile.description}</p>

      {!isLive ? (
        <p className="mt-4 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-white/40">
          Coming online — this module activates as the division grows
        </p>
      ) : (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-grounds-sand">
          Open
          <ArrowUpRight className="h-4 w-4" />
        </p>
      )}
    </div>
  )

  if (isLive && tile.href) {
    return (
      <Link href={tile.href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-grounds-sand/50">
        {body}
      </Link>
    )
  }

  return (
    <div className="h-full" aria-disabled={!isLive}>
      {body}
    </div>
  )
}

/**
 * Renders any {@link PathwayDashboard} config inside the shared portal shell.
 * All five pathway routes consume this single component — no per-route layouts.
 * Admins (legacy permission level) get a switcher to preview any pathway dashboard.
 */
export function PathwayDashboard({ pathwayRole }: { pathwayRole: PathwayRole }) {
  const access = usePortalAccess(groundsConfig)
  const [previewRole, setPreviewRole] = useState<PathwayRole>(pathwayRole)

  const activeRole = access.isAdmin ? previewRole : pathwayRole
  const dashboard = PATHWAY_DASHBOARDS[activeRole]

  return (
    <PortalShell config={groundsConfig} title={dashboard.heading} description={dashboard.subheading}>
      {access.isAdmin ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-grounds-sand">Admin preview</span>
          <div className="flex flex-wrap gap-2">
            {PATHWAY_SWITCHER_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setPreviewRole(role)}
                aria-pressed={activeRole === role}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                  activeRole === role
                    ? 'border-grounds-sand/45 bg-grounds-sand/10 text-grounds-sand'
                    : 'border-white/10 bg-white/[0.03] text-white/64 hover:border-white/20'
                }`}
              >
                {PATHWAY_DASHBOARDS[role].pathwayRole}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboard.tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </PortalShell>
  )
}
