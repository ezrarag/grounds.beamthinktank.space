'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapPinned } from 'lucide-react'
import { PublicSiteCard } from '@/components/PublicSiteCard'
import { PublicSiteDetail } from '@/components/PublicSiteDetail'
import { usePublicAcquisitionSites, type BeamAsset } from '@/lib/useAcquisitionSites'

export function PublicPortfolio() {
  const { sites, loading, error } = usePublicAcquisitionSites()
  const [selectedSite, setSelectedSite] = useState<BeamAsset | null>(null)
  const selectedSiteFromFeed = useMemo(
    () => sites.find((site) => site.id === selectedSite?.id) ?? sites[0] ?? null,
    [selectedSite?.id, sites],
  )

  useEffect(() => {
    setSelectedSite((current) => {
      if (current && sites.some((site) => site.id === current.id)) return current
      return sites[0] ?? null
    })
  }, [sites])

  return (
    <section id="portfolio" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[1.75rem] border border-white/10 bg-[#12211c] p-5 shadow-grounds">
        <div className="flex items-center gap-3">
          <MapPinned className="h-5 w-5 text-grounds-sand" />
          <div>
            <p className="text-sm font-medium text-white">Candidate Sites for Community Acquisition</p>
            <p className="text-sm text-white/56">Curated public records from the BEAM Grounds portfolio.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 flex min-h-72 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.03] text-sm text-white/60">
            Loading public portfolio...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[1.5rem] border border-red-300/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
            {error}
          </div>
        ) : sites.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {sites.map((site) => (
              <PublicSiteCard key={site.id} site={site} isSelected={selectedSiteFromFeed?.id === site.id} onSelect={setSelectedSite} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/14 bg-white/[0.03] p-8 text-sm leading-7 text-white/62">
            Public candidate sites will appear here after the acquisition team marks portfolio records as public.
          </div>
        )}
      </div>

      <PublicSiteDetail site={selectedSiteFromFeed} />
    </section>
  )
}
