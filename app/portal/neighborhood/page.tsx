'use client'

import { useMemo, useState } from 'react'
import { NeighborDonateForm } from '@/components/NeighborDonateForm'
import { PropertyTeaserCard } from '@/components/PropertyTeaserCard'
import { cityLabel } from '@/lib/cities'
import { usePublicAcquisitionSites } from '@/lib/useAcquisitionSites'

export default function NeighborhoodDashboardPage() {
  const { sites, loading } = usePublicAcquisitionSites()
  const [city, setCity] = useState('all')

  const cities = useMemo(
    () => Array.from(new Set(sites.map((site) => site.regionId).filter(Boolean))),
    [sites],
  )
  const filtered = useMemo(
    () => (city === 'all' ? sites : sites.filter((site) => site.regionId === city)),
    [sites, city],
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="space-y-3">
        <p className="eyebrow">Neighborhood dashboard</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Support &amp; browse sites</h1>
        <p className="max-w-2xl text-sm leading-7 text-white/70">
          Pledge toward a participant, a cohort, or a site&apos;s activation — and browse every public site across the
          cities BEAM Grounds is working in.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <NeighborDonateForm />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Browse sites</p>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="rounded-full border border-white/15 bg-[#12211c] px-3 py-1.5 text-xs text-white outline-none focus:border-grounds-sand/50"
            >
              <option value="all">All cities</option>
              {cities.map((regionId) => (
                <option key={regionId} value={regionId}>
                  {cityLabel(regionId)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <p className="text-sm text-white/55">Loading sites…</p>
            ) : filtered.length > 0 ? (
              filtered.map((site) => <PropertyTeaserCard key={site.id} site={site} />)
            ) : (
              <p className="rounded-[20px] border border-dashed border-white/14 bg-white/[0.03] p-6 text-sm text-white/60">
                No public sites here yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
