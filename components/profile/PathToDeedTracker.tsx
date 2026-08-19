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
  Plus,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import type { GroundsActiveAcquisition, GroundsProfile, GroundsSweatEquityLedger } from '@/lib/types/groundsProfile'
import { PropertyMatcherModal } from '@/components/profile/PropertyMatcherModal'

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
  const [matcherOpen, setMatcherOpen] = useState(false)

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
      <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 text-slate-500">
          <Clock className="h-5 w-5 animate-spin text-slate-700" />
          <p className="text-sm">Loading Path-to-Deed status...</p>
        </div>
      </div>
    )
  }

  return (
    <section className={`relative rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm sm:p-8 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Equity &amp; Deed Ledger</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
              <Scale className="h-3 w-3 text-slate-700" /> 42 U.S.C. § 12805 Match
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Path-to-Deed Tracker</h2>
          <p className="mt-1 text-xs text-slate-500">
            Sweat-equity logged hours converted directly to property equity and municipal compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {acquisition && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Active $1 Property Linked
            </div>
          )}
          <button
            onClick={() => setMatcherOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1e293b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            {acquisition ? 'Change $1 Site' : 'Link $1 Dollar City Site'}
          </button>
        </div>
      </div>

      {/* Main Condition Branch: Active Acquisition vs Proof of Funds Power */}
      {acquisition ? (
        /* CASE 1: Active Acquisition Assigned */
        <div className="mt-6 space-y-6">
          {/* Property Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Target $1 Homestead Property</p>
                <h3 className="mt-1 text-xl font-bold text-[#0f172a]">{acquisition.address || acquisition.propertyAddress}</h3>
                <p className="text-xs font-mono text-slate-500">TAXKEY / Asset ID: {acquisition.parcelId || acquisition.propertyId}</p>
              </div>

              {/* Legal Title Badge */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3 text-right">
                <a
                  href="https://law.beamthinktank.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-900 hover:underline"
                >
                  <Scale className="h-3.5 w-3.5 text-purple-700" /> Title Held: BEAM Land Trust
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="mt-0.5 text-[11px] text-purple-700">law.beamthinktank.space</p>
              </div>
            </div>

            {/* 180-Day Municipal Repair Window Countdown */}
            <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Hourglass className="h-4 w-4 text-amber-600" /> 180-Day Municipal Repair Compliance Window
                </span>
                <span className="font-mono font-bold text-[#0f172a]">
                  {daysRemaining180} Days Remaining (Deadline: {acquisition.repairDeadline180Day || '2026-11-28'})
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${percentComplianceWindow}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Municipal Code § 304-28: Essential envelope repairs must be completed within 180 days of transfer.
              </p>
            </div>
          </div>

          {/* Sweat Equity Ledger Progress Card */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved Labor Hours</p>
              <p className="mt-1 text-2xl font-extrabold text-[#0f172a]">{approvedHours} <span className="text-xs font-normal text-slate-500">hrs</span></p>
              <p className="mt-1 text-[11px] text-slate-400">Total Logged: {hoursLogged} hrs</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchasing Power Earned</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700">{formatCurrency(earnedPurchasingPowerUSD)}</p>
              <p className="mt-1 text-[11px] text-slate-400">$30/hr HUD Match Valuation</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Repair Budget Covered</p>
              <p className="mt-1 text-2xl font-extrabold text-[#0f172a]">{repairProgressPercent}%</p>
              <p className="mt-1 text-[11px] text-slate-400">Of {formatCurrency(repairBudgetUSD)} Essential Repairs</p>
            </div>
          </div>

          {/* Deed Restrictions & Land Trust Covenant Status */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <ShieldCheck className="h-4 w-4 text-slate-700" /> Deed Restrictions &amp; Anti-Speculation Covenant
            </div>

            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <span className="font-semibold text-slate-800">180-Day Essential Repairs</span>
                <p className="text-slate-500 text-[11px]">
                  Roof sealing, structural framing, HVAC, and plumbing. Current Status: <strong className="text-amber-700">In Progress ({approvedHours} hrs)</strong>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <span className="font-semibold text-slate-800">5-Year Equity Lock Covenant</span>
                <p className="text-slate-500 text-[11px]">
                  Active (Deed Covenant Expiry: {acquisition.deedCovenantExpiry || '2031-06-01'}). Prevents gentrification flipping.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: No Property Assigned Yet */
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <Home className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-lg font-bold text-[#0f172a]">No $1 Homestead Property Linked Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              You have <strong>{approvedHours} approved sweat-equity hours</strong> worth <strong>{formatCurrency(earnedPurchasingPowerUSD)}</strong> in BEAM purchasing power ready to apply toward a city $1 homestead property.
            </p>
            <button
              onClick={() => setMatcherOpen(true)}
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1e293b] px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-md transition"
            >
              <Plus className="h-4 w-4" />
              Browse &amp; Claim $1 City Homestead Property
            </button>
          </div>
        </div>
      )}

      {/* Property Matcher Modal */}
      <PropertyMatcherModal
        isOpen={matcherOpen}
        onClose={() => setMatcherOpen(false)}
        onLinked={(newAcquisition) => {
          setProfile((prev) => (prev ? { ...prev, activeAcquisition: newAcquisition } : { activeAcquisition: newAcquisition }))
        }}
      />
    </section>
  )
}
