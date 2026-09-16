'use client'

import { useState } from 'react'
import {
  Users,
  Sparkles,
  Flame,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Building2,
  HardHat,
} from 'lucide-react'

export interface OpportunitySquadItem {
  id: string
  siteName: string
  address: string
  city: string
  track: 'A' | 'B' | 'C' | 'D'
  squadCount: number
  maxSquadCapacity: number
  joinedByCurrentUser: boolean
  recentActivityText: string
  stage: string
}

interface LiveOpportunityFeedProps {
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  onInspectSite?: (address: string) => void
}

export function LiveOpportunityFeed({ user, onInspectSite }: LiveOpportunityFeedProps) {
  const [squads, setSquads] = useState<OpportunitySquadItem[]>([
    {
      id: 'boniface-639',
      siteName: 'Central Sanctuary & Recording Studio Residency',
      address: '639 N 25th St',
      city: 'Milwaukee, WI',
      track: 'C',
      squadCount: 7,
      maxSquadCapacity: 10,
      joinedByCurrentUser: true,
      recentActivityText: '3 stewards attached trade skills & acoustics labor',
      stage: 'STABILIZE',
    },
    {
      id: 'sweet-auburn-450',
      siteName: 'Sweet Auburn Cultural & Acoustic Innovation Hub',
      address: '450 Auburn Ave NE',
      city: 'Atlanta, GA',
      track: 'C',
      squadCount: 5,
      maxSquadCapacity: 10,
      joinedByCurrentUser: false,
      recentActivityText: 'Flagged by 4 participants as historic residency candidate',
      stage: 'CLAIM',
    },
    {
      id: 'ybor-arts-1901',
      siteName: 'Ybor City Historic Production & Trade Lab',
      address: '1901 E 7th Ave',
      city: 'Tampa, FL',
      track: 'D',
      squadCount: 4,
      maxSquadCapacity: 10,
      joinedByCurrentUser: false,
      recentActivityText: 'Inspected by 6 stewards; structural rehab scope calculated',
      stage: 'SIGNAL',
    },
  ])

  function toggleJoinSquad(squadId: string) {
    setSquads((prev) =>
      prev.map((item) => {
        if (item.id === squadId) {
          const isJoined = item.joinedByCurrentUser
          return {
            ...item,
            joinedByCurrentUser: !isJoined,
            squadCount: isJoined ? item.squadCount - 1 : item.squadCount + 1,
          }
        }
        return item
      })
    )
  }

  return (
    <div className="rounded-[24px] border border-[rgba(237,243,234,0.14)] bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Header Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(237,243,234,0.1)] pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400" />
            <h3 className="font-serif text-lg font-medium text-[#edf3ea]">
              Live Opportunity Stream &amp; Project Squads
            </h3>
          </div>
          <p className="text-xs text-[rgba(237,243,234,0.6)]">
            High-interest civic &amp; commercial candidates forming active participant squads.
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 font-mono text-[10px] font-bold uppercase text-amber-300">
          <Sparkles className="h-3 w-3" /> Real-Time Activity
        </span>
      </div>

      {/* Grid of Hot Opportunity Squad Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {squads.map((site) => (
          <div
            key={site.id}
            className="flex flex-col justify-between rounded-2xl border border-[rgba(237,243,234,0.12)] bg-[#102119]/90 p-4 space-y-4 hover:border-[#88aa8f]/40 transition"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase text-[#c8b97a]">
                  {site.city}
                </span>
                <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-[#88aa8f]">
                  Track {site.track} • {site.stage}
                </span>
              </div>

              <div>
                <h4 className="font-serif text-sm font-medium text-[#edf3ea] leading-snug">
                  {site.siteName}
                </h4>
                <p className="text-xs text-[rgba(237,243,234,0.55)] mt-0.5">{site.address}</p>
              </div>

              <p className="text-[11px] text-emerald-300/90 leading-relaxed font-mono bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/40">
                ⚡ {site.recentActivityText}
              </p>
            </div>

            {/* Squad Status & Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-[rgba(237,243,234,0.08)]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 text-[rgba(237,243,234,0.7)]">
                  <Users className="h-3.5 w-3.5 text-[#c8b97a]" />
                  Squad: <strong className="text-white">{site.squadCount}/{site.maxSquadCapacity}</strong>
                </span>
                <span className="text-[10px] text-slate-400">
                  {site.squadCount >= 5 ? 'Elevated to Active' : 'Forming Squad'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleJoinSquad(site.id)}
                  type="button"
                  className={`flex-1 inline-flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                    site.joinedByCurrentUser
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#88aa8f] text-[#07100c] hover:bg-[#77997e]'
                  }`}
                >
                  {site.joinedByCurrentUser ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Squad Joined
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" /> Join Squad
                    </>
                  )}
                </button>

                {onInspectSite && (
                  <button
                    onClick={() => onInspectSite(site.address)}
                    type="button"
                    className="rounded-xl border border-[rgba(237,243,234,0.2)] bg-white/[0.04] p-1.5 text-[#edf3ea] hover:bg-white/[0.1] transition"
                    title="Inspect Parcel"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
