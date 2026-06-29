'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Camera,
  ChevronRight,
  ClipboardList,
  Coins,
  Landmark,
  MapPin,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { BeamAsset } from '@/lib/useAcquisitionSites'
import { cn } from '@/lib/utils'

type TabId = 'tenancy' | 'activation' | 'worklog' | 'parcel' | 'liability' | 'stewardship'

const LOGIN_CIVIC = '/login?next=/portal/civic'
const LOGIN_ACQUISITION = '/login?next=/portal/acquisition'
const LOGIN_COHORT = '/login?next=/portal/cohort'

interface TabDef {
  id: TabId
  label: string
  icon: LucideIcon
}

const tabs: TabDef[] = [
  { id: 'tenancy', label: 'Tenancy', icon: Landmark },
  { id: 'activation', label: 'BEAM Activation', icon: Zap },
  { id: 'worklog', label: 'Work Log', icon: Camera },
  { id: 'parcel', label: 'Parcel Intel', icon: ClipboardList },
  { id: 'liability', label: 'Civic Liability', icon: AlertTriangle },
  { id: 'stewardship', label: 'Stewardship', icon: ShieldCheck },
]

function formatSeeded(createdAt?: string) {
  if (!createdAt) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function nodeLabel(regionId?: string) {
  if (!regionId) return 'UNNODED'
  return regionId.split('-')[0]!.toUpperCase()
}

function classLabel(locationType?: string) {
  return (locationType || 'civic-anchor').replace(/-/g, ' ').toUpperCase()
}

function earnLabel(ngoId: string, ngoName: string) {
  const labels: Array<[RegExp, string]> = [
    [/forge/i, 'Infrastructure build-out'],
    [/architecture/i, 'Adaptive reuse renovation'],
    [/transport/i, 'Site logistics & fleet'],
    [/law|legal/i, 'Legal structuring & title review'],
    [/environment/i, 'Site assessment & remediation'],
    [/finance/i, 'Capital stack modeling'],
    [/community/i, 'Site operations & activation'],
    [/choir|orchestra|dance/i, 'Performance & activation programming'],
  ]

  for (const [pattern, label] of labels) {
    if (pattern.test(ngoId)) return label
  }

  return `${ngoName} cohort engagement`
}

function SectionLabel({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
      {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {children}
    </p>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/18 px-3 py-1 text-xs text-white/80">{children}</span>
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

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-2 text-sm leading-7 text-white/74">{value}</p>
    </div>
  )
}

function EarnCard({ label, participants }: { label: string; participants: string }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 text-xs text-white/58">{participants} participants · Ongoing · Varies by sprint</p>
    </div>
  )
}

function TabPanel({ tab, site }: { tab: TabId; site: BeamAsset }) {
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
  }
}

function TenancyPanel({ site }: { site: BeamAsset }) {
  const tenants = site.tenants ?? []

  return tenants.length > 0 ? (
    <div className="grid gap-3">
      {tenants.map((tenant) => (
        <div key={`${tenant.name}-${tenant.status}`} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{tenant.name}</p>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">{tenant.status}</span>
          </div>
          {tenant.category ? <p className="mt-1 text-xs text-white/58">{tenant.category}</p> : null}
          {tenant.notes ? <p className="mt-3 text-sm leading-7 text-white/70">{tenant.notes}</p> : null}
        </div>
      ))}
    </div>
  ) : (
    <div>
      <EmptyNote>Occupant records coming soon. Sign in to add known tenants.</EmptyNote>
      <TabCta href={LOGIN_ACQUISITION}>Add occupant</TabCta>
    </div>
  )
}

function ActivationPanel({ site }: { site: BeamAsset }) {
  const ngoLinks = site.ngoLinks ?? []

  return ngoLinks.length > 0 ? (
    <div className="grid gap-3">
      {ngoLinks.map((link) => (
        <div key={`${link.ngoId}-${link.linkedAt}`} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-white">{link.ngoName}</p>
            <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/55">
              {link.relationshipType}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-white/68">{earnLabel(link.ngoId, link.ngoName)}</p>
        </div>
      ))}
    </div>
  ) : (
    <div>
      <EmptyNote>No NGO relationships linked yet.</EmptyNote>
      <TabCta href={LOGIN_CIVIC}>Propose a use</TabCta>
    </div>
  )
}

function WorkLogPanel({ site }: { site: BeamAsset }) {
  const log = site.workLog ?? []

  return log.length > 0 ? (
    <div className="grid gap-3">
      {log.map((entry, index) => (
        <div key={`${entry.loggedAt}-${index}`} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white">{entry.workType}</p>
          {entry.note ? <p className="mt-2 text-sm leading-7 text-white/70">{entry.note}</p> : null}
          {entry.civicImplication ? <p className="mt-2 text-sm text-[#88aa8f]">{entry.civicImplication}</p> : null}
        </div>
      ))}
    </div>
  ) : (
    <div>
      <EmptyNote>No documented site visits yet. Participants can log work, photos, and civic observations.</EmptyNote>
      <TabCta href={LOGIN_COHORT}>Log site visit</TabCta>
    </div>
  )
}

function ParcelPanel({ site }: { site: BeamAsset }) {
  const details = [
    ['Parcel ID', site.ckanParcelId],
    ['Owner', site.ckanOwnerName || site.ownerName],
    ['Assessed value', typeof site.ckanAssessedValue === 'number' ? `$${site.ckanAssessedValue.toLocaleString()}` : site.ckanAssessedValue],
    ['Zoning', site.ckanZoning],
    ['Tax status', site.ckanTaxStatus],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return details.length > 0 ? (
    <div className="grid gap-3 md:grid-cols-2">
      {details.map(([label, value]) => (
        <DetailBlock key={label} label={label} value={value} />
      ))}
    </div>
  ) : (
    <div>
      <EmptyNote>Parcel intel has not been pulled into the public record yet.</EmptyNote>
      <TabCta href={LOGIN_ACQUISITION}>Pull parcel data</TabCta>
    </div>
  )
}

function LiabilityPanel({ site }: { site: BeamAsset }) {
  const liabilities = site.civicLiabilities ?? []

  return liabilities.length > 0 ? (
    <div className="grid gap-3">
      {liabilities.map((item) => (
        <div key={`${item.type}-${item.reportedAt}`} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-white">{item.type}</p>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{item.beamResponseStatus}</span>
          </div>
          <p className="mt-2 text-sm leading-7 text-white/70">{item.description}</p>
        </div>
      ))}
    </div>
  ) : (
    <div>
      <EmptyNote>No public civic-liability notes yet.</EmptyNote>
      <TabCta href={LOGIN_CIVIC}>Add liability note</TabCta>
    </div>
  )
}

function StewardshipPanel({ site }: { site: BeamAsset }) {
  const relations = site.ngoLinks ?? []
  return site.stewardshipStatus || relations.length > 0 ? (
    <div className="grid gap-3 md:grid-cols-2">
      {site.stewardshipStatus ? <DetailBlock label="Status" value={site.stewardshipStatus} /> : null}
      {relations.length > 0 ? <DetailBlock label="Relations" value={relations.map((item) => item.ngoName).join(', ')} /> : null}
    </div>
  ) : (
    <div>
      <EmptyNote>This site has no assigned steward yet.</EmptyNote>
      <TabCta href={LOGIN_COHORT}>Claim stewardship</TabCta>
    </div>
  )
}

export function PublicPropertyDetailView({ site }: { site: BeamAsset }) {
  const [activeTab, setActiveTab] = useState<TabId>('tenancy')
  const title = site.publicTitle || site.name
  const summary = site.publicSummary || site.publicNarrative || site.operatorNarrative
  const seeded = formatSeeded(site.createdAt)
  const uses = site.primaryUseCases ?? []
  const ngoLinks = site.ngoLinks ?? []
  const earnLinks = ngoLinks.filter((link) => ['cohort-project', 'service-site'].includes(link.relationshipType))

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-10">
      <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-white/56 transition hover:text-white/82">
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to properties
      </Link>

      <section className="mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1813] shadow-grounds">
        <div
          className="relative min-h-[280px] bg-[radial-gradient(circle_at_top_left,rgba(136,170,143,0.55),transparent_28%),linear-gradient(135deg,#1d3c31_0%,#0f1d18_65%,#09110d_100%)] px-6 pb-20 pt-8 sm:px-8"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 84%, 0 100%)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-beam-gold">
              {classLabel(site.locationType)} · {nodeLabel(site.regionId)}
            </p>
            {seeded ? <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Seeded {seeded}</p> : null}
          </div>

          <div className="mt-10 max-w-4xl">
            <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/76">
              <MapPin className="h-4 w-4" />
              {site.address}
            </p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/76">{summary}</p>
          </div>
        </div>

        <div className="-mt-14 bg-grounds-mist px-6 pb-8 pt-16 text-[#10231b] sm:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-[#10231b]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#10231b]/48">Region</p>
              <p className="mt-2 text-lg font-semibold">{nodeLabel(site.regionId)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#10231b]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#10231b]/48">Class</p>
              <p className="mt-2 text-lg font-semibold">{classLabel(site.locationType)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#10231b]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#10231b]/48">Stewardship</p>
              <p className="mt-2 text-lg font-semibold">{site.stewardshipStatus || 'Unassigned'}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#10231b]/60">
                <Coins className="h-4 w-4 text-grounds-clay" aria-hidden="true" />
                Potential uses
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {uses.length > 0 ? uses.map((use) => <span key={use} className="rounded-full border border-[#10231b]/12 bg-white/80 px-3 py-1 text-xs font-medium text-[#10231b]/82">{use}</span>) : <span className="text-sm text-[#10231b]/58">No public uses listed yet.</span>}
              </div>

              {ngoLinks.length > 0 ? (
                <div className="mt-6">
                  <SectionLabel>In relation with</SectionLabel>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ngoLinks.map((link) => (
                      <span key={`${link.ngoId}-${link.linkedAt}`} className="rounded-full border border-[#10231b]/12 bg-white/80 px-3 py-1 text-xs font-medium text-[#10231b]/82">
                        {link.ngoName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#10231b]/60">
                <Users className="h-4 w-4 text-grounds-clay" aria-hidden="true" />
                Ways to earn
              </div>
              <div className="mt-3 space-y-3">
                {earnLinks.length > 0 ? (
                  earnLinks.map((link) => (
                    <div key={`${link.ngoId}-${link.linkedAt}`} className="rounded-[14px] border border-[#10231b]/10 bg-white/70 p-4">
                      <p className="text-sm font-semibold text-[#10231b]">{earnLabel(link.ngoId, link.ngoName)}</p>
                      <p className="mt-2 text-xs text-[#10231b]/62">{link.ngoName} participants · Ongoing · Varies by sprint</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-[#10231b]/12 bg-white/50 p-4 text-sm text-[#10231b]/58">
                    Public earning tracks will appear here when the site has a cohort structure attached.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-grounds sm:p-8">
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-5 border-b border-white/10">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab
              const Icon = tab.icon

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 pb-3 text-sm transition',
                    isActive ? 'border-[#88aa8f] text-[#88aa8f]' : 'border-transparent text-white/52 hover:text-white/74',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6">
          <TabPanel tab={activeTab} site={site} />
        </div>
      </section>
    </div>
  )
}

