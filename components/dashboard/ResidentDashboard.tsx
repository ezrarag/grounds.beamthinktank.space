'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Home,
  Building,
  Key,
  Calendar,
  PhoneCall,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'
import type { Resident } from '@/lib/types/resident'
import type { Unit } from '@/lib/types/unit'
import { TRACK_META } from '@/lib/tracks'

interface ResidentDashboardProps {
  resident?: Resident
  unit?: Unit
}

export function ResidentDashboard({ resident: propResident, unit: propUnit }: ResidentDashboardProps) {
  // Sample fallback mock data for preview if no Firestore doc exists yet
  const resident: Resident = propResident || {
    id: 'res-101',
    displayName: 'Community Resident',
    assetId: 'asset-track-a-supportive',
    unitId: 'unit-2b',
    residencyType: 'supportive',
    movedInAt: '2026-02-15',
    isAlsoParticipant: false,
    monthlyRentFeeUSD: 0, // Rent-free supportive unit
    notes: 'Supportive resident under HUD Section 202 PRAC program.',
  }

  const unit: Unit = propUnit || {
    id: 'unit-2b',
    assetId: 'asset-track-a-supportive',
    label: 'Unit 2B — North Wing',
    beds: 1,
    baths: 1,
    hasKitchenette: true,
    hasLaundry: true,
    squareFeet: 580,
    occupancyStatus: 'occupied',
  }

  const trackMeta = TRACK_META.A

  return (
    <PortalShell
      config={groundsConfig}
      title="Your Housing & Residency Workspace"
      description="Residency portal for unit specs, building guidelines, program calendar, and housing services."
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-[#0d1813] to-[#09110d] p-6 shadow-grounds space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-teal-300">
                  {trackMeta.label}
                </span>
                <h2 className="text-2xl font-bold text-white">{unit.label}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-teal-400/40 bg-teal-500/15 px-3 py-1 font-mono text-xs font-semibold text-teal-200">
                {resident.residencyType.toUpperCase()} RESIDENCY
              </span>
              {resident.monthlyRentFeeUSD === 0 && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-semibold text-emerald-200">
                  RENT-FREE SUBSTANTIATED
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4 pt-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase text-white/50">Bedrooms / Baths</p>
              <p className="mt-1 text-lg font-bold text-white">{unit.beds} Bed / {unit.baths} Bath</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase text-white/50">Square Footage</p>
              <p className="mt-1 text-lg font-bold text-white">{unit.squareFeet || 550} sq ft</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase text-white/50">Kitchenette & Laundry</p>
              <p className="mt-1 text-sm font-semibold text-teal-300">
                {unit.hasKitchenette ? 'Private Kitchenette' : 'Shared Dining'} · {unit.hasLaundry ? 'In-Unit Laundry' : 'Shared Laundry'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-mono uppercase text-white/50">Holding Entity</p>
              <p className="mt-1 text-sm font-semibold text-white capitalize">{trackMeta.holdingEntity} CLT</p>
            </div>
          </div>
        </div>

        {/* Residency Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Building Program Calendar */}
          <div className="surface-panel p-6 shadow-grounds space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-grounds-sand" />
                Building Programme Calendar
              </h3>
              <span className="text-xs font-mono text-white/50">This Week</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#12211c] p-3.5 flex items-start gap-3">
                <div className="rounded-xl bg-grounds-sand/20 px-3 py-1.5 text-center text-xs font-bold text-grounds-sand font-mono">
                  MON<br />10AM
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Community Breakfast & Health Scan</p>
                  <p className="text-xs text-white/60 mt-0.5">North Wing Assembly Hall · Free for all residents</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#12211c] p-3.5 flex items-start gap-3">
                <div className="rounded-xl bg-teal-500/20 px-3 py-1.5 text-center text-xs font-bold text-teal-300 font-mono">
                  WED<br />2PM
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Resident Council & Facility Check-in</p>
                  <p className="text-xs text-white/60 mt-0.5">Community Room · Building updates & maintenance requests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency & Steward Contact */}
          <div className="surface-panel p-6 shadow-grounds space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-grounds-sand" />
                Building Steward & Services
              </h3>
              <span className="text-xs font-mono text-emerald-400">24/7 On-Call</span>
            </div>

            <div className="space-y-3 text-xs text-white/70">
              <div className="rounded-2xl border border-white/10 bg-[#12211c] p-4 space-y-2">
                <p className="font-semibold text-white text-sm">BEAM Grounds Supportive Housing Manager</p>
                <p>On-site steward: Elena Rios</p>
                <p className="font-mono text-grounds-sand">Direct Hotline: (414) 555-0199</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#12211c] p-4 space-y-1">
                <p className="font-semibold text-white text-sm">HUD PRAC Program Officer</p>
                <p>Guaranteed non-displacement tenancy protocol active under CLT deed covenant.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Opt-in Path to Participant Sweat Equity (Only shown as optional path) */}
        {!resident.isAlsoParticipant && (
          <div className="rounded-3xl border border-grounds-sand/30 bg-grounds-sand/10 p-6 shadow-grounds flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2 text-grounds-sand text-xs font-mono uppercase tracking-wider font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Optional Participant Pathway</span>
              </div>
              <h4 className="text-lg font-bold text-white">Want to earn build credit or skills?</h4>
              <p className="text-xs leading-relaxed text-white/75">
                As a Track A resident, labor is never required for your housing. If you choose to join a property ops cohort, your sweat equity converts into wages and housing credit.
              </p>
            </div>

            <Link
              href="/portal/participant"
              className="inline-flex items-center gap-2 rounded-full bg-grounds-sand px-6 py-3 text-sm font-semibold text-[#0b1712] hover:bg-grounds-sand/90 transition shadow-md"
            >
              <span>Explore Sweat-Equity Cohort</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </PortalShell>
  )
}
