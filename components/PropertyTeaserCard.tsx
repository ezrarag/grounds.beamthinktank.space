'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  ChevronDown,
  ClipboardList,
  Clock,
  Coins,
  ExternalLink,
  Landmark,
  Lightbulb,
  Plus,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'
import { cityLabel } from '@/lib/cities'
import { cn } from '@/lib/utils'

const STAGE_BADGE: Record<BeamAssetStage, string> = {
  SIGNAL: 'border-white/20 text-white/50',
  CLAIM: 'border-[#c8b97a]/40 text-[#c8b97a]',
  ACCESS: 'border-[#88aa8f]/40 text-[#88aa8f]',
  STABILIZE: 'border-blue-400/40 text-blue-400',
  ACTIVATE: 'border-emerald-400/40 text-emerald-400',
  SECURE: 'border-purple-400/40 text-purple-400',
  TRANSFER: 'border-rose-400/40 text-rose-400',
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
  }
}

// Maps an NGO id to the kind of paid/credit work available at a site.
const EARN_LABELS: Array<[RegExp, string]> = [
  [/forge/i, 'Infrastructure build-out'],
  [/architecture/i, 'Adaptive reuse renovation'],
  [/transport/i, 'Site logistics & fleet'],
  [/law|legal/i, 'Legal structuring & title review'],
  [/environment/i, 'Site assessment & remediation'],
  [/finance/i, 'Capital stack modeling'],
  [/community/i, 'Site operations & activation'],
  [/choir|orchestra|dance/i, 'Performance & activation programming'],
]

function earnLabel(ngoId: string, ngoName: string) {
  for (const [pattern, label] of EARN_LABELS) {
    if (pattern.test(ngoId)) return label
  }
  return `${ngoName} cohort engagement`
}

function formatSeeded(createdAt?: string) {
  if (!createdAt) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function nodeLabel(regionId?: string) {
  if (!regionId) return 'UNNODED'
  return (cityLabel(regionId) || regionId).toUpperCase()
}

function classLabel(locationType?: string) {
  return (locationType || 'civic-anchor').replace(/-/g, ' ').toUpperCase()
}

const EARN_RELATIONSHIPS = new Set(['cohort-project', 'service-site'])

const LOGIN_CIVIC = '/login?next=/portal/civic'
const LOGIN_ACQUISITION = '/login?next=/portal/acquisition'
const LOGIN_COHORT = '/login?next=/portal/cohort'

function SectionLabel({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
      {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {children}
    </p>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">{children}</span>
  )
}

function TabCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#88aa8f]/60 px-3.5 py-1.5 text-xs font-medium text-[#88aa8f] transition hover:bg-[#88aa8f]/10"
    >
      {children}
    </Link>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="font-dm text-sm leading-6 text-white/55">{children}</p>
}

interface TabDef {
  id: string
  label: string
  icon: LucideIcon
}

const TABS: TabDef[] = [
  { id: 'tenancy', label: 'Tenancy', icon: Landmark },
  { id: 'activation', label: 'BEAM Activation', icon: Zap },
  { id: 'worklog', label: 'Work Log', icon: Camera },
  { id: 'parcel', label: 'Parcel Intel', icon: ClipboardList },
  { id: 'liability', label: 'Civic Liability', icon: AlertTriangle },
  { id: 'stewardship', label: 'Stewardship', icon: ShieldCheck },
]

export function PropertyTeaserCard({ site }: { site: BeamAsset }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('tenancy')

  const title = site.publicTitle || site.name
  const summary = site.publicSummary || site.publicNarrative || site.operatorNarrative
  const seeded = formatSeeded(site.createdAt)
  const uses = site.primaryUseCases ?? []
  const ngoLinks = site.ngoLinks ?? []
  const earnLinks = ngoLinks.filter((link) => EARN_RELATIONSHIPS.has(link.relationshipType))
  const showEarn = earnLinks.length > 0 || Boolean(site.cohortPool)

  return (
    <article className="rounded-[20px] border border-white/10 bg-white/[0.04] p-5">
      {/* 1. Eyebrow row */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-beam-gold">
          {classLabel(site.locationType)} · {nodeLabel(site.regionId)}
        </p>
        <div className="flex items-center gap-2">
          {seeded ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">Seeded {seeded}</p>
          ) : null}
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]',
              STAGE_BADGE[site.acquisitionStage] ?? STAGE_BADGE.SIGNAL,
            )}
          >
            {site.acquisitionStage}
          </span>
        </div>
      </div>

      {/* 2. Property name */}
      <h2 className="mt-2 font-display text-[22px] leading-tight text-white">{title}</h2>

      {/* 3. Narrative */}
      {summary ? <p className="mt-3 font-dm text-sm leading-7 text-white/70">{summary}</p> : null}

      {/* 4. Potential uses */}
      {uses.length > 0 ? (
        <div className="mt-4">
          <SectionLabel icon={Lightbulb}>Potential uses</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {uses.map((use) => (
              <Pill key={use}>{use}</Pill>
            ))}
            <Link
              href={LOGIN_CIVIC}
              className="inline-flex items-center gap-1 rounded-full border border-[#88aa8f]/60 px-3 py-1 text-xs text-[#88aa8f] transition hover:bg-[#88aa8f]/10"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Submit an idea
            </Link>
          </div>
        </div>
      ) : null}

      {/* 5. In relation with */}
      {ngoLinks.length > 0 ? (
        <div className="mt-3">
          <SectionLabel>In relation with</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {ngoLinks.map((link) => (
              <Pill key={`${link.ngoId}-${link.linkedAt}`}>{link.ngoName}</Pill>
            ))}
          </div>
        </div>
      ) : null}

      {/* 6. Ways to earn */}
      {showEarn ? (
        <div className="mt-4">
          <SectionLabel icon={Coins}>Ways to earn</SectionLabel>
          <div className="mt-2 space-y-2">
            {earnLinks.length > 0
              ? earnLinks.map((link) => (
                  <EarnCard
                    key={`${link.ngoId}-${link.linkedAt}`}
                    label={earnLabel(link.ngoId, link.ngoName)}
                    participants={link.ngoName}
                  />
                ))
              : site.cohortPool
                ? <EarnCard label={`${site.cohortPool} cohort engagement`} participants="BEAM" />
                : null}
          </div>
        </div>
      ) : null}

      {/* 7. Expand trigger */}
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="mt-5 flex w-full items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 transition hover:text-white/55"
      >
        6 layers of site intelligence
        <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
      </button>

      {/* Expanded: tab strip + panel */}
      {expanded ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition',
                    isActive
                      ? 'border-b border-[#88aa8f] text-[#88aa8f]'
                      : 'text-white/40 hover:text-white/60',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="mt-4 min-h-[120px]">
            <TabPanel tab={activeTab} site={site} />
          </div>
        </div>
      ) : null}
    </article>
  )
}

function EarnCard({ label, participants }: { label: string; participants: string }) {
  return (
    <div className="rounded-[12px] bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-dm text-xs text-white/60">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-[#88aa8f]" aria-hidden="true" />
          {participants} participants
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-[#88aa8f]" aria-hidden="true" />
          Ongoing
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 font-dm text-xs text-white/60">
        <Clock className="h-3.5 w-3.5 text-[#88aa8f]" aria-hidden="true" />
        Varies by sprint
      </div>
    </div>
  )
}

function TabPanel({ tab, site }: { tab: string; site: BeamAsset }) {
  switch (tab) {
    case 'tenancy':
      return <TenancyPanel site={site} />
    case 'activation':
      return <ActivationPanel site={site} />
    case 'worklog':
      return <WorkLogPanel site={site} />
    case 'parcel':
      return <ParcelPanel site={site} />
    case 'liability':
      return <LiabilityPanel site={site} />
    case 'stewardship':
      return <StewardshipPanel site={site} />
    default:
      return null
  }
}

function TenancyPanel({ site }: { site: BeamAsset }) {
  const tenants = site.tenants ?? []
  return (
    <div>
      {tenants.length > 0 ? (
        <ul className="space-y-2">
          {tenants.map((tenant) => {
            const isCurrent = tenant.status === 'current'
            return (
              <li key={`${tenant.name}-${tenant.status}`} className="rounded-[12px] bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">{tenant.name}</p>
                  {tenant.category ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/50">
                      {tenant.category}
                    </span>
                  ) : null}
                  <span className={cn('text-xs', isCurrent ? 'text-emerald-400/60' : 'text-white/30')}>
                    ● {isCurrent ? 'Current' : 'Former'}
                  </span>
                </div>
                {tenant.websiteUrl ? (
                  <a
                    href={tenant.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 font-dm text-xs text-[#88aa8f] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    {hostnameOf(tenant.websiteUrl)}
                  </a>
                ) : null}
                {tenant.notes ? (
                  <p className="mt-1 font-dm text-xs text-white/50">{tenant.notes}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyNote>Occupant records coming soon. Sign in to add known tenants.</EmptyNote>
      )}
      <TabCta href={LOGIN_ACQUISITION}>Add occupant</TabCta>
    </div>
  )
}

function ActivationPanel({ site }: { site: BeamAsset }) {
  const ngoLinks = site.ngoLinks ?? []
  return (
    <div>
      {ngoLinks.length > 0 ? (
        <ul className="space-y-2">
          {ngoLinks.map((link) => (
            <li key={`${link.ngoId}-${link.linkedAt}`} className="rounded-[12px] bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{link.ngoName}</p>
                <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/55">
                  {link.relationshipType}
                </span>
              </div>
              <p className="mt-1 font-dm text-xs text-white/60">{earnLabel(link.ngoId, link.ngoName)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>No NGO relationships linked yet.</EmptyNote>
      )}
      <TabCta href={LOGIN_CIVIC}>Propose a use</TabCta>
    </div>
  )
}

function WorkLogPanel({ site }: { site: BeamAsset }) {
  const log = site.workLog ?? []
  return (
    <div>
      {log.length > 0 ? (
        <ul className="space-y-2">
          {log.map((entry, index) => (
            <li key={`${entry.loggedAt}-${index}`} className="rounded-[12px] bg-white/5 p-3">
              <p className="text-sm font-medium text-white">{entry.workType}</p>
              {entry.note ? <p className="mt-1 font-dm text-xs text-white/60">{entry.note}</p> : null}
              {entry.civicImplication ? (
                <p className="mt-1 font-dm text-xs text-[#88aa8f]">{entry.civicImplication}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>
          No documented site visits yet. BEAM participants can log work, photos, and civic observations.
        </EmptyNote>
      )}
      <TabCta href={LOGIN_COHORT}>Log site visit</TabCta>
    </div>
  )
}

function ParcelPanel({ site }: { site: BeamAsset }) {
  const fields: Array<[string, string | number | undefined]> = [
    ['Owner', site.ckanOwnerName],
    ['Assessed Value', site.ckanAssessedValue],
    ['Zoning', site.ckanZoning],
    ['Tax Status', site.ckanTaxStatus],
    ['Parcel ID', site.ckanParcelId],
  ]
  const populated = fields.filter(([, value]) => value !== undefined && value !== '')

  if (populated.length === 0) {
    return (
      <EmptyNote>Parcel data not yet pulled. Sign in to trigger CKAN lookup.</EmptyNote>
    )
  }

  return (
    <dl className="divide-y divide-white/10 overflow-hidden rounded-[12px] bg-white/5">
      {populated.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</dt>
          <dd className="text-sm text-white/85">{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function LiabilityPanel({ site }: { site: BeamAsset }) {
  const liabilities = site.civicLiabilities ?? []
  return (
    <div>
      {liabilities.length > 0 ? (
        <ul className="space-y-2">
          {liabilities.map((item, index) => (
            <li key={`${item.type}-${index}`} className="rounded-[12px] bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{item.type}</p>
                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-amber-100">
                  {item.beamResponseStatus}
                </span>
              </div>
              {item.description ? (
                <p className="mt-1 font-dm text-xs text-white/60">{item.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote>Known civic liabilities and BEAM response status will appear here.</EmptyNote>
      )}
      <TabCta href={LOGIN_ACQUISITION}>Report a liability</TabCta>
    </div>
  )
}

function StewardshipPanel({ site }: { site: BeamAsset }) {
  const status = site.stewardshipStatus || 'unmonitored'
  const isUnmonitored = status === 'unmonitored'
  return (
    <div>
      <span
        className={cn(
          'inline-flex rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]',
          isUnmonitored
            ? 'border border-white/20 text-white/50'
            : 'border border-[#88aa8f]/50 bg-[#88aa8f]/10 text-[#88aa8f]',
        )}
      >
        {status}
      </span>
      <p className="mt-3 font-dm text-sm leading-6 text-white/55">
        This site has no assigned steward yet. BEAM participants can claim stewardship responsibility.
      </p>
      <TabCta href={LOGIN_COHORT}>Become a steward</TabCta>
    </div>
  )
}
