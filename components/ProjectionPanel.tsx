'use client'

import type { BeamAsset } from '@/lib/useAcquisitionSites'

const scoreLabels: Array<[keyof BeamAsset['scores'], string]> = [
  ['capacity', 'Capacity'],
  ['impact', 'Impact'],
  ['stability', 'Stability'],
  ['revenue', 'Revenue'],
  ['partner', 'Partner'],
]

function formatCurrency(value?: number) {
  if (value === undefined) return 'Not set'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function ProjectionPanel({ site }: { site: BeamAsset | null }) {
  if (!site?.financePlan) return null

  const { financePlan } = site

  return (
    <section className="surface-panel p-5 shadow-grounds">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">Finance projection</p>
        <span className="rounded-full border border-grounds-sand/45 px-3 py-1 text-xs font-medium text-grounds-sand">
          {financePlan.planType}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#12211c] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Estimated cost</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(financePlan.estimatedCost)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12211c] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Monthly revenue</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(financePlan.projectedMonthlyRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12211c] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Civic anchor use</p>
          <p className="mt-2 text-sm leading-6 text-white/72">{financePlan.civicAnchorUse || 'Not set'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12211c] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Break-even</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {financePlan.breakEvenMonths !== undefined ? `${financePlan.breakEvenMonths} months` : 'Not set'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            financePlan.bondFinancingEligible
              ? 'border-emerald-300/35 bg-emerald-400/14 text-emerald-100'
              : 'border-white/15 bg-white/[0.04] text-white/64'
          }`}
        >
          Bond financing eligible: {financePlan.bondFinancingEligible ? 'yes' : 'no'}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-white">Scores</p>
        {scoreLabels.map(([scoreKey, label]) => {
          const value = site.scores[scoreKey]
          const width = `${Math.max(0, Math.min(value, 5)) * 20}%`

          return (
            <div key={scoreKey} className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/66">{label}</span>
                <span className="font-semibold text-white">{value} / 5</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-grounds-sand" style={{ width }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
