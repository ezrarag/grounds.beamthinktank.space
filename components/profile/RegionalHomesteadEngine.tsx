'use client'

import { useState } from 'react'
import {
  MapPin,
  ShieldCheck,
  Building2,
  Hammer,
  Plus,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { CITY_HOMESTEAD_SITES, type PropertySiteOption } from '@/components/profile/PropertyMatcherModal'
import type { UserTargetRegion } from '@/components/profile/EditProfileModal'

interface RegionalHomesteadEngineProps {
  userRegion: UserTargetRegion
  onSelectRegion: (region: UserTargetRegion) => void
  onClaimHomestead: (city: string) => void
}

const REGION_LABELS: Record<UserTargetRegion, { city: string; label: string }> = {
  MKE: { city: 'Milwaukee', label: 'Milwaukee, WI' },
  ATL: { city: 'Atlanta', label: 'Atlanta, GA' },
  TPA: { city: 'Tampa', label: 'Tampa, FL' },
}

export function RegionalHomesteadEngine({
  userRegion,
  onSelectRegion,
  onClaimHomestead,
}: RegionalHomesteadEngineProps) {
  const activeRegionMeta = REGION_LABELS[userRegion]

  const regionalProperties = CITY_HOMESTEAD_SITES.filter(
    (s) => s.city.toLowerCase() === activeRegionMeta.city.toLowerCase()
  )

  return (
    <div className="rounded-[28px] border border-[rgba(237,243,234,0.14)] bg-white/[0.04] p-8 shadow-2xl backdrop-blur-sm space-y-6 text-[#edf3ea]">
      {/* Module Title & Region Indicator Pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(237,243,234,0.12)] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#88aa8f]" />
            <h2 className="font-serif text-2xl font-medium tracking-tight">
              Regional $1 Homestead Claim Engine
            </h2>
          </div>
          <p className="text-xs text-[rgba(237,243,234,0.65)] max-w-xl">
            Explore curated $1 sweat-equity homestead sites and taxkey parcels in your registered target node.
          </p>
        </div>

        {/* Region Indicator Pill */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#88aa8f]/20 border border-[#88aa8f]/40 px-3.5 py-1 font-mono text-[10px] font-bold text-[#88aa8f]">
            <MapPin className="h-3 w-3 text-[#c8b97a]" />
            Showing active $1 Homestead inventory for: {activeRegionMeta.label}
          </span>

          {/* Quick Region Tabs */}
          <div className="flex gap-1">
            {(
              [
                { id: 'MKE', label: 'MKE' },
                { id: 'ATL', label: 'ATL' },
                { id: 'TPA', label: 'TPA' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectRegion(r.id)}
                type="button"
                className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase transition ${
                  userRegion === r.id
                    ? 'bg-[#c8b97a] text-[#07100c]'
                    : 'bg-white/[0.06] text-[rgba(237,243,234,0.5)] hover:bg-white/[0.12]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      {regionalProperties.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regionalProperties.map((site) => (
            <div
              key={site.id}
              className="flex flex-col justify-between rounded-2xl border border-[rgba(237,243,234,0.12)] bg-[#102119]/80 p-5 space-y-4 hover:border-[#88aa8f]/40 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#88aa8f]/15 border border-[#88aa8f]/30 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#88aa8f]">
                    {site.city}, {site.state}
                  </span>
                  <span className="font-mono text-[9px] text-[#c8b97a] font-bold">
                    TAXKEY: {site.parcelId}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-base font-medium text-[#edf3ea]">{site.name}</h3>
                  <p className="text-xs text-[rgba(237,243,234,0.6)] mt-0.5">{site.address}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(237,243,234,0.08)] space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[rgba(237,243,234,0.5)]">Est. Essential Repairs:</span>
                  <span className="font-bold text-[#c8b97a]">
                    ${site.essentialRepairsCost.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => onClaimHomestead(site.city)}
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#88aa8f] py-2 text-xs font-semibold text-[#07100c] hover:bg-[#77997e] transition shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" /> Claim $1 Homestead Site
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[rgba(237,243,234,0.16)] bg-white/[0.02] p-8 text-center space-y-2">
          <Building2 className="mx-auto h-8 w-8 text-[#c8b97a]" />
          <p className="text-sm font-medium text-[#edf3ea]">
            No $1 Homestead parcels currently listed for {activeRegionMeta.label}.
          </p>
          <p className="text-xs text-[rgba(237,243,234,0.6)]">
            Use the Universal Search Bar to inspect and table off-market parcels for BEAM review.
          </p>
        </div>
      )}
    </div>
  )
}
