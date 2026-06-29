'use client'

import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { getPropertyHref } from '@/lib/propertySlugs'
import type { BeamAsset } from '@/lib/useAcquisitionSites'

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

export function PropertyTeaserCard({ site }: { site: BeamAsset }) {
  const title = site.publicTitle || site.name
  const summary = site.publicSummary || site.publicNarrative || site.operatorNarrative
  const seeded = formatSeeded(site.createdAt)
  const href = getPropertyHref(site)
  const uses = (site.primaryUseCases ?? []).slice(0, 3)
  const ngoLinks = site.ngoLinks ?? []
  const clippedSummary = summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}...` : summary

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1813] shadow-grounds transition duration-300 hover:-translate-y-1 hover:border-white/18"
    >
      <div
        className="relative min-h-[210px] bg-[radial-gradient(circle_at_top_left,rgba(136,170,143,0.48),transparent_26%),linear-gradient(135deg,#274b3f_0%,#152720_62%,#0b1511_100%)] px-5 pb-16 pt-5"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 84%, 0 100%)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-beam-gold">
            {classLabel(site.locationType)} · {nodeLabel(site.regionId)}
          </p>
          {seeded ? <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">Seeded {seeded}</p> : null}
        </div>

        <div className="mt-12 max-w-sm">
          <h2 className="font-display text-[30px] leading-[1.02] text-white">{title}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/76">
            <MapPin className="h-4 w-4" />
            {site.address}
          </p>
        </div>
      </div>

      <div className="-mt-10 bg-grounds-mist px-5 pb-5 pt-12 text-[#10231b]">
        <p className="text-sm leading-7 text-[#10231b]/78">{clippedSummary}</p>

        {uses.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {uses.map((use) => (
              <span key={use} className="rounded-full border border-[#10231b]/12 bg-white/75 px-3 py-1 text-xs font-medium text-[#10231b]/82">
                {use}
              </span>
            ))}
          </div>
        ) : null}

        {ngoLinks.length > 0 ? (
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#10231b]/48">
            In relation with: {ngoLinks.slice(0, 2).map((link) => link.ngoName).join(', ')}
          </p>
        ) : null}

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-grounds-moss transition group-hover:translate-x-1">
          Open property page
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
