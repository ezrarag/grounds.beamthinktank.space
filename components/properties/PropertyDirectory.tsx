'use client'

import { useMemo, useState } from 'react'
import { PropertyGalleryFilters } from '@/components/PropertyGalleryFilters'
import { PropertyTeaserCard } from '@/components/PropertyTeaserCard'
import { seededPublicProperties } from '@/lib/publicPropertySeeds'
import { usePublicAcquisitionSites } from '@/lib/useAcquisitionSites'

export function PropertyDirectory({ audience = 'public' }: { audience?: 'public' | 'participant' }) {
  const { sites, loading, error } = usePublicAcquisitionSites()
  const [activeNode, setActiveNode] = useState('all')
  const [activeClass, setActiveClass] = useState('all')

  const displayProperties = sites.length > 0 ? sites : seededPublicProperties

  const nodes = useMemo(
    () => Array.from(new Set(displayProperties.map((site) => site.regionId).filter(Boolean))),
    [displayProperties],
  )
  const classes = useMemo(
    () => Array.from(new Set(displayProperties.map((site) => site.locationType || 'civic-anchor'))),
    [displayProperties],
  )

  const filtered = useMemo(
    () =>
      displayProperties.filter((site) => {
        const nodeOk = activeNode === 'all' || site.regionId === activeNode
        const classOk = activeClass === 'all' || (site.locationType || 'civic-anchor') === activeClass
        return nodeOk && classOk
      }),
    [displayProperties, activeNode, activeClass],
  )

  const intro =
    audience === 'participant'
      ? 'Browse active public entries, then open the dedicated property page for the full civic-intelligence record.'
      : 'Browse public entries and open each property page for the full civic-intelligence record.'

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-beam-gold">
          {audience === 'participant' ? 'Participant property index' : 'Public property index'}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-white/62">{intro}</p>
      </div>

      <PropertyGalleryFilters
        nodes={nodes}
        classes={classes}
        activeNode={activeNode}
        activeClass={activeClass}
        onNodeChange={setActiveNode}
        onClassChange={setActiveClass}
      />

      {loading && sites.length === 0 ? (
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
