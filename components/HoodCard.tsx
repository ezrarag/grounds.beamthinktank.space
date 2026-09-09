'use client'

import { Coins, ExternalLink, HeartHandshake, ShieldCheck } from 'lucide-react'

export interface HoodItem {
  name: string
  target: number
  progress: number
  funded: boolean
  category: string
  city: string
}

interface HoodCardProps {
  item?: HoodItem
  siteName?: string
}

export function HoodCard({ item, siteName = 'Grounds Asset Site' }: HoodCardProps) {
  // Default mock matching Hood's equipment schema for grounds site integration
  const data: HoodItem = item || {
    name: `Equipment & Build-out for ${siteName}`,
    target: 25000,
    progress: 14200,
    funded: false,
    category: 'Civic Infrastructure',
    city: 'Milwaukee',
  }

  const percent = Math.min(100, Math.round((data.progress / data.target) * 100))

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5 shadow-grounds space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-pink-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-pink-300">Hood ↔ Grounds Funding Line</span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 font-mono text-[10px] uppercase text-white/60">
          {data.category} · {data.city}
        </span>
      </div>

      <div>
        <h4 className="text-base font-semibold text-white">{data.name}</h4>
        <p className="mt-1 text-xs text-white/60">
          Build-out & equipment needs for this site generate an active Hood fundraising item.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-white/70">
            <strong className="text-white">${data.progress.toLocaleString()}</strong> raised
          </span>
          <span className="text-white/60 font-mono">${data.target.toLocaleString()} target ({percent}%)</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Sweat-Equity Matched</span>
        </div>
        <a
          href="https://hood.beamthinktank.space"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 border border-pink-500/40 px-3.5 py-1.5 text-xs font-medium text-pink-200 hover:bg-pink-500/30 transition"
        >
          <Coins className="h-3.5 w-3.5" />
          <span>Fund on Hood</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
