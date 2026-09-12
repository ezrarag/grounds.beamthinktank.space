'use client'

import { useMemo } from 'react'
import {
  Scale,
  TrendingUp,
  Coins,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'
import { useAcquisitionSites, getAssetTrack } from '@/lib/useAcquisitionSites'
import { TRACK_META } from '@/lib/tracks'

export interface InvestorPosition {
  assetId: string
  equitySharePercent: number
  investedUSD: number
  distributedUSD: number
  shareType: 'Class-A Investor Equity' | 'CLT Dividend Certificate'
}

export function InvestorDashboard() {
  const { sites, loading, error } = useAcquisitionSites()

  // EXPLICIT FILTER: Only Track C (market-rate) & Track D (production) assets are investable.
  // Track A (supportive) and Track B (cultural) assets are non-profit and strictly excluded.
  const investableAssets = useMemo(() => {
    return sites.filter((site) => {
      const track = getAssetTrack(site)
      return track === 'C' || track === 'D'
    })
  }, [sites])

  // Sample portfolio holdings mapping for demo investor
  const positions: InvestorPosition[] = [
    {
      assetId: 'asset-track-c-commercial',
      equitySharePercent: 3.5,
      investedUSD: 25000,
      distributedUSD: 1850,
      shareType: 'Class-A Investor Equity',
    },
    {
      assetId: 'asset-track-d-production',
      equitySharePercent: 5.0,
      investedUSD: 50000,
      distributedUSD: 4200,
      shareType: 'CLT Dividend Certificate',
    },
  ]

  const totalInvested = positions.reduce((acc, p) => acc + p.investedUSD, 0)
  const totalDistributed = positions.reduce((acc, p) => acc + p.distributedUSD, 0)

  return (
    <PortalShell
      config={groundsConfig}
      title="Land Trust & Capital Equity Workspace"
      description="Investor portal for commercial (Track C) and production (Track D) asset holdings, dividend ledger, and non-speculation covenants."
    >
      <div className="space-y-6">
        {/* Compliance Notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="text-white font-semibold">Non-Speculation Capital Protection Policy:</strong> Investable equity positions are strictly restricted to Track C (Market-Rate Commercial) and Track D (Production Infrastructure) assets. Track A (Supportive Housing) and Track B (Civic Assembly) assets are permanently non-profit and non-investable.
          </div>
        </div>

        {/* Portfolio Summary Header */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-[#0d1813] to-[#09110d] p-6 shadow-grounds space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                  BEAM Land Trust Capital Portfolio
                </span>
                <h2 className="text-2xl font-bold text-white">Your Equity Position</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 font-semibold text-amber-200">
                {positions.length} Active Positions
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase text-white/50">Total Capital Invested</p>
              <p className="mt-1 text-2xl font-bold text-white">${totalInvested.toLocaleString()} USD</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase text-white/50">Distributions Distributed to Date</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">${totalDistributed.toLocaleString()} USD</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase text-white/50">Cooperative Anti-Flip Protection</p>
              <p className="mt-1 text-sm font-semibold text-grounds-sand">Packers-Style Member Non-Speculation Deed</p>
            </div>
          </div>
        </div>

        {/* Investable Holdings Table */}
        <div className="surface-panel p-6 shadow-grounds space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-grounds-sand" />
                Track C & Track D Asset Holdings
              </h3>
              <p className="text-xs text-white/60">
                Market-rate commercial and industrial production assets open to investor equity & land trust certificates.
              </p>
            </div>

            <span className="text-xs font-mono text-white/50">
              {investableAssets.length} Investable Sites Found
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-white/50">Loading investable portfolio...</div>
          ) : error ? (
            <div className="text-xs text-red-300 bg-red-500/10 p-3 rounded-xl">{error}</div>
          ) : (
            <div className="space-y-4">
              {investableAssets.map((asset) => {
                const trackId = getAssetTrack(asset)
                const meta = TRACK_META[trackId]
                const pos = positions.find((p) => p.assetId === asset.id)

                return (
                  <div
                    key={asset.id}
                    className="rounded-2xl border border-white/10 bg-[#12211c] p-5 space-y-3 hover:border-white/20 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                          {asset.productionLane ? (
                            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-mono uppercase">
                              Lane: {asset.productionLane}
                            </span>
                          ) : null}
                        </div>
                        <h4 className="mt-2 text-lg font-bold text-white">{asset.name}</h4>
                        <p className="text-xs text-white/60">{asset.address}</p>
                      </div>

                      {pos ? (
                        <div className="text-right bg-white/[0.04] border border-white/10 rounded-2xl p-3">
                          <p className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Your Active Holding</p>
                          <p className="text-base font-bold text-white">{pos.equitySharePercent}% Equity Share</p>
                          <p className="text-xs text-white/60">${pos.distributedUSD.toLocaleString()} Distributions Paid</p>
                        </div>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/50">
                          Open to Qualified Investment
                        </span>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-white/70">{asset.operatorNarrative}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/8 text-xs text-white/50 font-mono">
                      <span>Capital Instrument: {meta.capitalInstrument}</span>
                      <span>Holding Entity: {meta.holdingEntity.toUpperCase()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
