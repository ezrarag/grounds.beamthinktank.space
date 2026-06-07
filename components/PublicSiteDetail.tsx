'use client'

import { CheckCircle2, Landmark, MapPinned, Users } from 'lucide-react'
import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'

const stageBadgeClasses: Record<BeamAssetStage, string> = {
  SIGNAL: 'border-amber-300/35 bg-amber-400/14 text-amber-100',
  CLAIM: 'border-blue-300/35 bg-blue-400/14 text-blue-100',
  ACCESS: 'border-purple-300/35 bg-purple-400/14 text-purple-100',
  STABILIZE: 'border-teal-300/35 bg-teal-400/14 text-teal-100',
  ACTIVATE: 'border-green-300/35 bg-green-400/14 text-green-100',
  SECURE: 'border-emerald-300/35 bg-emerald-400/14 text-emerald-100',
  TRANSFER: 'border-white/25 bg-white/10 text-white/78',
}

function StageBadge({ stage }: { stage: BeamAssetStage }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${stageBadgeClasses[stage]}`}>
      {stage}
    </span>
  )
}

function formatCurrency(value?: number) {
  if (value === undefined) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function PublicSiteDetail({ site }: { site: BeamAsset | null }) {
  if (!site) {
    return (
      <aside className="surface-panel p-6 shadow-grounds">
        <p className="text-sm font-medium text-white">Portfolio detail</p>
        <p className="mt-3 text-sm leading-7 text-white/60">Select a candidate site to see suggested uses, cohorts, and trust relationships.</p>
      </aside>
    )
  }

  const uses = site.cohortUses?.length ? site.cohortUses : site.primaryUseCases
  const estimatedCost = formatCurrency(site.financePlan?.estimatedCost)
  const monthlyRevenue = formatCurrency(site.financePlan?.projectedMonthlyRevenue)

  return (
    <aside className="surface-panel p-6 shadow-grounds">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Candidate Site</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">{site.name}</h2>
          <div className="mt-3 flex gap-2 text-sm leading-6 text-white/60">
            <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-grounds-sand" />
            {site.address}
          </div>
        </div>
        <StageBadge stage={site.acquisitionStage} />
      </div>

      <p className="mt-6 text-sm leading-7 text-white/74">
        {site.publicNarrative || site.operatorNarrative || 'This property is being reviewed as a potential community-serving acquisition.'}
      </p>

      <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
        <div className="flex items-center gap-3 text-white">
          <Users className="h-4 w-4 text-grounds-sand" />
          <p className="font-medium">Suggested by</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/70">
          {site.suggestedBy?.name || 'Community participant'}
          {site.suggestedBy?.affiliation ? `, ${site.suggestedBy.affiliation}` : ''}
        </p>
        {site.suggestedBy?.note ? <p className="mt-2 text-sm leading-6 text-white/58">{site.suggestedBy.note}</p> : null}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-white">Uses and cohorts</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {uses.length > 0 ? (
            uses.map((use) => (
              <span key={use} className="rounded-full border border-grounds-sand/45 px-3 py-1 text-xs font-medium text-grounds-sand">
                {use}
              </span>
            ))
          ) : (
            <span className="text-sm text-white/56">Uses and cohorts are being mapped.</span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Finance path</p>
          <p className="mt-2 text-sm font-medium text-white">{site.financePlan?.planType || 'To be mapped'}</p>
          {estimatedCost ? <p className="mt-2 text-xs text-white/56">Estimated cost: {estimatedCost}</p> : null}
          {monthlyRevenue ? <p className="mt-1 text-xs text-white/56">Projected revenue: {monthlyRevenue}/mo</p> : null}
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Community trust</p>
          <p className="mt-2 text-sm font-medium text-white">
            {site.financePlan?.bondFinancingEligible ? 'Bond financing eligible' : site.cohortPool ? `${site.cohortPool} cohort pool` : 'Relationship mapping pending'}
          </p>
          {site.financePlan?.civicAnchorUse ? <p className="mt-2 text-xs leading-5 text-white/56">{site.financePlan.civicAnchorUse}</p> : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-3 text-white">
          <Landmark className="h-4 w-4 text-grounds-sand" />
          <p className="font-medium">Mapped relationships</p>
        </div>
        <div className="mt-3 space-y-2">
          {site.ngoLinks && site.ngoLinks.length > 0 ? (
            site.ngoLinks.map((link) => (
              <div key={`${link.ngoId}-${link.relationshipType}-${link.linkedAt}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70">
                <CheckCircle2 className="h-4 w-4 text-grounds-sand" />
                {link.ngoName} · {link.relationshipType}
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/14 px-3 py-4 text-sm text-white/56">
              No public trust relationships have been mapped yet.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
