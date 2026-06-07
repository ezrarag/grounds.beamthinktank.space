'use client'

import type { BeamAsset } from '@/lib/useAcquisitionSites'

export function AcquisitionSiteList({
  sites,
  selectedSite,
  onSelect,
}: {
  sites: BeamAsset[]
  selectedSite: BeamAsset | null
  onSelect: (site: BeamAsset) => void
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">Acquisition site list</p>
      <div className="mt-4 space-y-3">
        {sites.length > 0 ? (
          sites.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => onSelect(site)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                selectedSite?.id === site.id
                  ? 'border-grounds-sand/45 bg-grounds-sand/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <span className="block text-sm font-medium text-white">{site.name}</span>
              <span className="mt-1 block text-xs leading-5 text-white/56">{site.address}</span>
              <span className="mt-2 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/66">
                {site.acquisitionStage}
              </span>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/14 px-4 py-8 text-center text-sm text-white/56">
            No acquisition sites available.
          </div>
        )}
      </div>
    </section>
  )
}
