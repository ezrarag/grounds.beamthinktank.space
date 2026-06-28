'use client'

import { useMemo, useState } from 'react'
import { PropertyGalleryFilters } from '@/components/PropertyGalleryFilters'
import { PropertyTeaserCard } from '@/components/PropertyTeaserCard'
import { usePublicAcquisitionSites } from '@/lib/useAcquisitionSites'

export default function PropertiesPage() {
  const { sites, loading, error } = usePublicAcquisitionSites()
  const [activeNode, setActiveNode] = useState('all')
  const [activeClass, setActiveClass] = useState('all')

  const nodes = useMemo(
    () => Array.from(new Set(sites.map((site) => site.regionId).filter(Boolean))),
    [sites],
  )
  const classes = useMemo(
    () => Array.from(new Set(sites.map((site) => site.locationType || 'civic-anchor'))),
    [sites],
  )

  const filtered = useMemo(
    () =>
      sites.filter((site) => {
        const nodeOk = activeNode === 'all' || site.regionId === activeNode
        const classOk = activeClass === 'all' || (site.locationType || 'civic-anchor') === activeClass
        return nodeOk && classOk
      }),
    [sites, activeNode, activeClass],
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <PropertyGalleryFilters
        nodes={nodes}
        classes={classes}
        activeNode={activeNode}
        activeClass={activeClass}
        onNodeChange={setActiveNode}
        onClassChange={setActiveClass}
      />

      {loading ? (
        <div className="mt-4 flex min-h-72 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.03] font-dm text-sm text-white/55">
          Loading sites…
        </div>
      ) : error ? (
        <div className="mt-4 rounded-[20px] border border-red-300/25 bg-red-500/10 p-5 font-dm text-sm leading-7 text-red-100">
          {error}
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          {filtered.map((site) => (
            <PropertyTeaserCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-dashed border-white/14 bg-white/[0.03] p-8 font-dm text-sm leading-7 text-white/60">
          No public sites match these filters yet.
        </div>
      )}
    </div>
  )
}
