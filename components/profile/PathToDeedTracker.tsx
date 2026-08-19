'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Hammer,
  HelpCircle,
  Home,
  Hourglass,
  Layers,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import type { GroundsActiveAcquisition, GroundsProfile, GroundsSweatEquityLedger } from '@/lib/types/groundsProfile'

export interface PathToDeedTrackerProps {
  profile?: GroundsProfile | null
  className?: string
}

const DEFAULT_LEDGER: GroundsSweatEquityLedger = {
  totalHoursLogged: 84,
  approvedHours: 72,
  estimatedValueUSD: 2160, // $30/hr labor valuation
}

const HOURLY_SWAT_VALUE_USD = 30

function calculateDaysRemaining(targetDateStr?: string): number {
  if (!targetDateStr) return 180
  const target = new Date(targetDateStr).getTime()
  const now = new Date().getTime()
  const diffTime = target - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(180, diffDays))
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function PathToDeedTracker({ profile: initialProfile, className = '' }: PathToDeedTrackerProps) {
  const { user } = usePortalAccessState()
  const [profile, setProfile] = useState<GroundsProfile | null>(initialProfile || null)
  const [loading, setLoading] = useState(!initialProfile)

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile)
      setLoading(false)
      return
    }

    if (!user || !db) {
      setLoading(false)
      return
    }

    let isCancelled = false

    async function fetchProfile() {
      try {
        const snap = await getDoc(doc(db!, 'participantProfiles', user!.uid))
        if (snap.exists() && !isCancelled) {
          setProfile(snap.data() as GroundsProfile)
        }
      } catch (err) {
        console.warn('Unable to load profile for PathToDeedTracker:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void fetchProfile()

    return () => {
      isCancelled = true
    }
  }, [user, initialProfile])

  const ledger: GroundsSweatEquityLedger = profile?.sweatEquityLedger || DEFAULT_LEDGER
  const acquisition: GroundsActiveAcquisition | undefined = profile?.activeAcquisition

  const hoursLogged = ledger.totalHoursLogged
  const approvedHours = ledger.approvedHours
  const earnedPurchasingPowerUSD = approvedHours * HOURLY_SWAT_VALUE_USD

  // Days remaining in 180-day compliance window
  const daysRemaining180 = acquisition ? calculateDaysRemaining(acquisition.repairDeadline180Day) : 0
  const daysElapsed = 180 - daysRemaining180
  const percentComplianceWindow = Math.round((daysElapsed / 180) * 100)

  // Essential repair budget progress
  const repairBudgetUSD = acquisition?.essentialRepairsCost || 15000
  const repairProgressPercent = Math.min(100, Math.round((earnedPurchasingPowerUSD / repairBudgetUSD) * 100))

  if (loading) {
    return (
      <div className={`surface-panel p-6 shadow-grounds ${className}`}>
        <div className="flex items-center gap-3 text-white/60">
          <Clock className="h-5 w-5 animate-spin text-grounds-sand" />
          <p className="text-sm">Loading Path-to-Deed status...</p>
        </div>
      </div>
    )
  }

  return (
    <section className={`surface-panel relative p-6 shadow-grounds sm:p-8 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Equity & Deed Ledger</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-grounds-sand/30 bg-grounds-sand/12 px-2.5 py-0.5 text-xs font-medium text-grounds-sand">
              <Scale className="h-3 w-3" /> 42 U.S.C. § 12805 Match
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Path-to-Deed Tracker</h2>
          <p className="mt-1 text-sm text-white/64">
            Sweat-equity logged hours converted directly to property equity and municipal compliance.
          </p>
        </div>

        {acquisition && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200">
            <ShieldCheck className="h-4 w-4" /> Active Acquisition Assigned
          </div>
        )}
      </div>

      {/* Main Condition Branch: Active Acquisition vs Proof of Funds Power */}
      {acquisition ? (
        /* CASE 1: Active Acquisition Assigned */
        <div className="mt-6 space-y-6">
          {/* Property Info Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-grounds-sand">Target Property</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{acquisition.address}</h3>
                <p className="text-xs text-white/50">Asset ID: {acquisition.propertyId}</p>
              </div>

              {/* Legal Title Badge */}
              <div className="rounded-2xl border border-purple-400/30 bg-purple-400/10 p-3 text-right">
                <a
                  href="https://law.beamthinktank.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-200 transition hover:underline"
                >
                  <Scale className="h-3.5 w-3.5 text-purple-300" /> Title Held: BEAM Land Trust
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="mt-0.5 text-[11px] text-purple-200/60">law.beamthinktank.space</p>
              </div>
            </div>

            {/* 180-Day Municipal Compliance Countdown */}
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <Hourglass className="h-4 w-4 text-amber-300" /> 180-Day Municipal Repair Compliance Window
                </span>
                <span className="font-mono font-semibold text-amber-200">{daysRemaining180} Days Remaining</span>
              </div>

              <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${100 - percentComplianceWindow}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[11px] text-white/50">
                <span>Closing Date: {acquisition.closingDate || '2026-06-01'}</span>
                <span>Repair Deadline: {acquisition.repairDeadline180Day || '2026-11-28'}</span>
              </div>
            </div>

            {/* Essential Repair Budget vs Sweat-Equity Progress */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Logged Sweat-Equity Hours</span>
                  <span className="font-semibold text-grounds-sand">{approvedHours} Approved / {hoursLogged} Total</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(earnedPurchasingPowerUSD)}</p>
                <p className="mt-1 text-xs text-white/50">Valued at ${HOURLY_SWAT_VALUE_USD}/hr non-debt labor match</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Essential Repairs Budget</span>
                  <span className="font-semibold text-emerald-300">{repairProgressPercent}% Funded</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(repairBudgetUSD)}</p>
                <p className="mt-1 text-xs text-white/50">Roof, MEP systems & structural stabilization</p>
              </div>
            </div>

            {/* 5-Year Owner-Occupancy Covenant Status */}
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/80">
              <BadgeCheck className="h-5 w-5 shrink-0 text-grounds-sand" />
              <div>
                <span className="font-semibold text-white">5-Year Owner-Occupancy Covenant: </span>
                <span>Active (Deed Covenant Expiry: {acquisition.deedCovenantExpiry || '2031-06-01'}). Prevents gentrification flipping.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: No Active Acquisition Assigned -> Proof of Funds Power */
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-grounds-sand/30 bg-grounds-sand/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-grounds-sand" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-grounds-sand">
                    Proof of Funds Purchasing Power
                  </span>
                </div>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {formatCurrency(earnedPurchasingPowerUSD)}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                  Your <strong className="text-white">{approvedHours} approved sweat-equity hours</strong> generate
                  BEAM-backed purchasing power for multi-location housing placement or community land trust acquisition.
                </p>
              </div>

              <Link
                href="/portal/properties"
                className="inline-flex items-center gap-2 rounded-full border border-grounds-sand bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] transition hover:bg-grounds-sand/90"
              >
                Browse Acquisition Sites
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Breakdown Stats */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/50">Hours Approved</p>
                <p className="mt-1 text-2xl font-semibold text-white">{approvedHours} hrs</p>
                <p className="mt-1 text-[11px] text-white/40">{hoursLogged} total logged in cohorts</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/50">BEAM Credit Rate</p>
                <p className="mt-1 text-2xl font-semibold text-grounds-sand">${HOURLY_SWAT_VALUE_USD} / hr</p>
                <p className="mt-1 text-[11px] text-white/40">HUD-aligned sweat equity valuation</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/50">Land Trust Status</p>
                <p className="mt-1 text-base font-semibold text-emerald-300">Ready for Assignment</p>
                <p className="mt-1 text-[11px] text-white/40">BEAM Land Trust pre-approved</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
