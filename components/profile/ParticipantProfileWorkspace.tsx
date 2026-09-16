'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  CreditCard,
  Filter,
  Hammer,
  HardHat,
  Home,
  LifeBuoy,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
  Send,
  Coins,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import { HousingPreferencesForm } from '@/components/profile/HousingPreferencesForm'
import { PathToDeedTracker } from '@/components/profile/PathToDeedTracker'
import { HousingSafetyNetCard } from '@/components/profile/HousingSafetyNetCard'
import { RoleDiscoveryBoard } from '@/components/profile/RoleDiscoveryBoard'
import {
  PropertyMatcherModal,
  CITY_HOMESTEAD_SITES,
  type PropertySiteOption,
} from '@/components/profile/PropertyMatcherModal'
import { PropertyWorkRosterModal } from '@/components/profile/PropertyWorkRosterModal'
import type {
  GroundsActiveAcquisition,
  GroundsTargetLocation,
  GroundsWorkRosterAttachment,
} from '@/lib/types/groundsProfile'
import { useAcquisitionSites, getAssetTrack, type BeamAsset } from '@/lib/useAcquisitionSites'
import { getTrackMeta } from '@/lib/tracks'
import { AssetInterestModal } from '@/components/profile/AssetInterestModal'

type ActiveDrawerTab = 'goals' | 'deed' | 'roles' | 'safety' | null
export type MemberCategoryFilter = 'ALL' | 'COMMERCIAL' | 'CIVIC' | 'HOMESTEAD'

export function ParticipantProfileWorkspace() {
  const { user } = usePortalAccessState()
  const { sites: liveAssets } = useAcquisitionSites()
  const [activeDrawerTab, setActiveDrawerTab] = useState<ActiveDrawerTab>(null)
  const [firestorePhoto, setFirestorePhoto] = useState<string | null>(null)
  const [activeAcquisition, setActiveAcquisition] = useState<GroundsActiveAcquisition | null>(null)
  const [workRosterSites, setWorkRosterSites] = useState<GroundsWorkRosterAttachment[]>([])
  const [targetLocations, setTargetLocations] = useState<GroundsTargetLocation[]>([
    { city: 'Milwaukee', state: 'WI', priority: 1 },
    { city: 'Atlanta', state: 'GA', priority: 2 },
  ])
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('All')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<MemberCategoryFilter>('ALL')
  const [propertySearchQuery, setPropertySearchQuery] = useState<string>('')
  const [matcherOpen, setMatcherOpen] = useState(false)
  const [matcherCity, setMatcherCity] = useState<string | null>(null)
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [workModalTarget, setWorkModalTarget] = useState<PropertySiteOption | null>(null)
  const [interestTargetAsset, setInterestTargetAsset] = useState<BeamAsset | null>(null)

  // Fetch participant profile from Firestore if signed in
  useEffect(() => {
    if (!user || !db) return
    let isCancelled = false

    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db!, 'participantProfiles', user!.uid))
        if (snap.exists() && !isCancelled) {
          const data = snap.data()
          if (data.photoURL || data.headshotUrl || data.avatarUrl) {
            setFirestorePhoto(data.photoURL || data.headshotUrl || data.avatarUrl)
          }
          if (data.activeAcquisition) {
            setActiveAcquisition(data.activeAcquisition as GroundsActiveAcquisition)
          }
          if (Array.isArray(data.workRosterSites)) {
            setWorkRosterSites(data.workRosterSites as GroundsWorkRosterAttachment[])
          }
          if (Array.isArray(data.targetLocations) && data.targetLocations.length > 0) {
            setTargetLocations(data.targetLocations as GroundsTargetLocation[])
          }
        }
      } catch (err) {
        console.warn('Unable to load profile from participantProfiles:', err)
      }
    }

    void loadProfile()
    return () => {
      isCancelled = true
    }
  }, [user])

  const displayName = user?.displayName || 'ezra haugabrooks'
  const handle = `@${(user?.email ? user.email.split('@')[0] : 'ezra.haugabrooks').toLowerCase()}`
  const title = 'Violinist • MYSO Alumni • Cohort Resident'
  const bio = 'Musician & civic space steward focused on residency.'

  const avatarUrl =
    user?.photoURL ||
    firestorePhoto ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

  const targetCityNames = Array.from(new Set(targetLocations.map((l) => l.city)))
  const targetNodesSummary = targetCityNames.map((c) => c.slice(0, 3).toUpperCase()).join(' • ')

  const locationAssociatedProperties = CITY_HOMESTEAD_SITES.filter((s) => {
    const matchesCity =
      selectedLocationFilter === 'All' ||
      s.city.toLowerCase() === selectedLocationFilter.toLowerCase()
    const matchesQuery =
      !propertySearchQuery ||
      s.name.toLowerCase().includes(propertySearchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(propertySearchQuery.toLowerCase()) ||
      s.parcelId.toLowerCase().includes(propertySearchQuery.toLowerCase())
    return matchesCity && matchesQuery
  })

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#0f172a] font-sans selection:bg-slate-200">
      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Profile Info Header Section */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar with Verified Badge Overlay */}
            <div className="relative h-32 w-32 shrink-0">
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-32 w-32 rounded-full object-cover border-2 border-white shadow-md"
              />
              {/* Verified Badge Icon */}
              <div className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b] text-white ring-4 ring-white shadow-sm">
                <ShieldCheck className="h-5 w-5 text-sky-300" />
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
                {displayName}
              </h1>
              <p className="text-sm text-slate-500 font-normal">{handle}</p>
              <p className="pt-1 text-sm font-medium text-slate-700">{title}</p>
              <p className="pt-2 text-sm text-slate-600 leading-relaxed max-w-xl">{bio}</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0 pt-2 sm:pt-0">
            <Link
              href="/portal/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition"
            >
              <Compass className="h-3.5 w-3.5 text-slate-600" />
              Change My Pathway
            </Link>

            <button
              onClick={() => {
                setWorkModalTarget(null)
                setWorkModalOpen(true)
              }}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-sm transition"
            >
              <HardHat className="h-3.5 w-3.5 text-slate-700" />
              Attach to Site Work Roster
            </button>

            <button
              onClick={() => {
                setMatcherCity(null)
                setMatcherOpen(true)
              }}
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#1e293b] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-900 shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              {activeAcquisition ? 'Linked $1 Site Attached' : 'Claim $1 Homestead Site'}
            </button>
          </div>
        </section>

        {/* Three Horizontal Metric Cards */}
        <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* CARD 1: SWEAT EQUITY */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition hover:shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              SWEAT EQUITY
            </h2>

            <div className="relative my-6 flex items-center justify-center">
              <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#1e293b]"
                  strokeDasharray="72, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-[#0f172a]">72</span>
                <span className="text-xs font-normal text-slate-500">hrs</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">$30/hr HUD match equivalent</p>
          </div>

          {/* CARD 2: PURCHASING POWER */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition hover:shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              PURCHASING POWER
            </h2>

            <div className="my-6 flex h-36 items-center justify-center">
              <div className="relative h-20 w-32 rounded-xl border-2 border-[#1e293b] bg-slate-50 p-2 shadow-sm">
                <div className="h-4 w-full rounded bg-[#1e293b]" />
                <div className="mt-4 flex items-center justify-between px-1">
                  <div className="h-2 w-8 rounded bg-slate-300" />
                  <div className="flex gap-1">
                    <span className="h-3.5 w-3.5 rounded-full bg-rose-400 opacity-90" />
                    <span className="h-3.5 w-3.5 -ml-2 rounded-full bg-amber-400 opacity-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <span className="text-3xl font-extrabold text-[#0f172a]">$2,160</span>
              <p className="mt-1 text-[11px] text-slate-400">BEAM proof-of-funds</p>
            </div>
          </div>

          {/* CARD 3: TARGET NODES */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition hover:shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              TARGET NODES
            </h2>

            <div className="my-6 flex h-36 w-full items-center justify-center">
              <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#eef2f6]">
                <svg className="h-full w-full opacity-40" viewBox="0 0 200 120" fill="none">
                  <path
                    d="M10 20 C 40 10, 80 30, 120 15 C 160 0, 190 25, 195 60 C 200 95, 160 110, 110 105 C 60 100, 20 85, 10 20 Z"
                    fill="#cbd5e1"
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                </svg>

                <div className="absolute left-[38%] top-[25%] flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-md bg-[#e11d48] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    <MapPin className="h-2.5 w-2.5" /> MKE
                  </div>
                </div>

                <div className="absolute right-[24%] bottom-[20%] flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-md bg-[#0d9488] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    <MapPin className="h-2.5 w-2.5" /> ATL
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <span className="text-2xl font-extrabold text-[#0f172a]">
                {targetCityNames.length} {targetCityNames.length === 1 ? 'City' : 'Cities'}
              </span>
              <p className="mt-1 text-[11px] text-slate-400">{targetNodesSummary}</p>
            </div>
          </div>
        </section>

        {/* LAYER 2: Attached Site Work & Revitalization Roster Section */}
        <section className="mt-12 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-slate-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f172a]">
                  My Site Work &amp; Revitalization Rosters
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Properties where your profile is attached to receive work shift notifications and offer skilled labor (moving, trade skills, acoustics, site stewardship).
              </p>
            </div>

            <button
              onClick={() => {
                setWorkModalTarget(null)
                setWorkModalOpen(true)
              }}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Attach New Work Site
            </button>
          </div>

          {workRosterSites.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {workRosterSites.map((attachment, idx) => (
                <div
                  key={`${attachment.assetId}-${idx}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-white px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-700 border border-slate-200">
                        {attachment.city || 'Revitalization Site'}
                      </span>
                      <h4 className="mt-1.5 text-sm font-bold text-[#0f172a]">
                        {attachment.propertyName}
                      </h4>
                      <p className="text-xs text-slate-500">{attachment.address}</p>
                    </div>
                    {attachment.notifyOnWorkAvailable && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-800">
                        <Bell className="h-3 w-3 text-sky-600" /> Work Alerts Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Your Selected Work Capacities:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {attachment.skillsOrRoles.map((role) => (
                        <span
                          key={role}
                          className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <Building2 className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2 text-xs font-semibold text-slate-700">
                You haven&apos;t attached your profile to any site work rosters yet.
              </p>
              <p className="mt-1 text-[11px] text-slate-500 max-w-md mx-auto">
                Attach your profile to any commercial or civic property in BEAM Grounds to offer skilled labor, moving assistance, or site stewardship and receive shift alerts when work is scheduled.
              </p>
              <button
                onClick={() => {
                  setWorkModalTarget(null)
                  setWorkModalOpen(true)
                }}
                type="button"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1e293b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-sm transition"
              >
                <HardHat className="h-3.5 w-3.5" /> Attach Profile to a Work Site
              </button>
            </div>
          )}
        </section>

        {/* Real-Estate Exploration & Property Feed Section */}
        <section className="mt-12 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-slate-800" />
                  <h3 className="text-base font-bold text-[#0f172a]">
                    Real-Estate Exploration &amp; Site Pipeline
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Explore commercial production hubs, civic adaptive reuse anchors, and $1 homestead properties.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  placeholder="Search address, zoning, asset..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Toolbar: Category Tracks & City Nodes */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'ALL', label: 'All Properties' },
                    { id: 'COMMERCIAL', label: 'Commercial & Production (Track C/D)' },
                    { id: 'CIVIC', label: 'Civic & Residential (Track A/B)' },
                    { id: 'HOMESTEAD', label: '$1 Homestead Eligible' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    type="button"
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-[#1e293b] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* City Node Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedLocationFilter('All')}
                  type="button"
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    selectedLocationFilter === 'All'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Cities
                </button>
                {targetCityNames.map((city) => {
                  const isSelected = selectedLocationFilter.toLowerCase() === city.toLowerCase()
                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedLocationFilter(city)}
                      type="button"
                      className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {city}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Render Live BeamAsset Pipeline Properties */}
          {selectedCategoryFilter !== 'HOMESTEAD' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
                <span>Live Pipeline Assets ({liveAssets.length})</span>
                <span className="text-slate-400">Track A / B / C / D Pipeline</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {liveAssets
                  .filter((site) => {
                    const track = getAssetTrack(site)
                    const matchesCity =
                      selectedLocationFilter === 'All' ||
                      (site.city || '').toLowerCase().includes(selectedLocationFilter.toLowerCase()) ||
                      site.regionId.toLowerCase().includes(selectedLocationFilter.toLowerCase())
                    const matchesQuery =
                      !propertySearchQuery ||
                      site.name.toLowerCase().includes(propertySearchQuery.toLowerCase()) ||
                      site.address.toLowerCase().includes(propertySearchQuery.toLowerCase()) ||
                      (site.ckanZoning || '').toLowerCase().includes(propertySearchQuery.toLowerCase())

                    if (selectedCategoryFilter === 'COMMERCIAL') {
                      return (track === 'C' || track === 'D') && matchesCity && matchesQuery
                    }
                    if (selectedCategoryFilter === 'CIVIC') {
                      return (track === 'A' || track === 'B') && matchesCity && matchesQuery
                    }
                    return matchesCity && matchesQuery
                  })
                  .map((site) => {
                    const trackId = getAssetTrack(site)
                    const meta = getTrackMeta(trackId)
                    const isCommercial = trackId === 'C' || trackId === 'D'

                    return (
                      <div
                        key={site.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 hover:border-slate-300 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase font-bold ${meta.badgeClass}`}>
                              {meta.label}
                            </span>
                            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 font-mono text-[9px] uppercase text-slate-700 font-semibold">
                              Stage: {site.acquisitionStage}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-bold text-[#0f172a]">{site.name}</h4>
                            <p className="text-xs text-slate-500">{site.address}</p>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {site.operatorNarrative}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {site.locationType && (
                              <span className="rounded bg-slate-200/70 px-2 py-0.5 text-[9px] font-mono uppercase text-slate-700">
                                {site.locationType}
                              </span>
                            )}
                            {site.ckanZoning && (
                              <span className="rounded bg-slate-200/70 px-2 py-0.5 text-[9px] font-mono uppercase text-slate-700">
                                Zoning: {site.ckanZoning}
                              </span>
                            )}
                            {site.condition && (
                              <span className="rounded bg-slate-200/70 px-2 py-0.5 text-[9px] font-mono uppercase text-slate-700">
                                Condition: {site.condition}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financial & Valuation Metrics Summary */}
                        <div className="space-y-3 border-t border-slate-200 pt-3">
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="rounded-xl bg-white border border-slate-200 p-2">
                              <span className="text-[9px] text-slate-400 block">Est. Valuation</span>
                              <span className="font-bold text-[#0f172a]">
                                ${site.appraisalData?.estimatedValue
                                  ? site.appraisalData.estimatedValue.toLocaleString()
                                  : typeof site.ckanAssessedValue === 'number'
                                  ? site.ckanAssessedValue.toLocaleString()
                                  : '168,400'}
                              </span>
                            </div>

                            <div className="rounded-xl bg-white border border-slate-200 p-2">
                              <span className="text-[9px] text-slate-400 block">Repair Estimate</span>
                              <span className="font-bold text-amber-700">
                                ${site.appraisalData?.repairCostEstimate
                                  ? site.appraisalData.repairCostEstimate.toLocaleString()
                                  : '45,000'}
                              </span>
                            </div>
                          </div>

                          {site.financePlan && (
                            <div className="rounded-xl bg-slate-100 p-2.5 text-[11px] space-y-1">
                              <div className="flex justify-between font-mono">
                                <span className="text-slate-500">Plan Type:</span>
                                <span className="font-bold text-slate-800">{site.financePlan.planType}</span>
                              </div>
                              {site.financePlan.projectedMonthlyRevenue ? (
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-500">Proj. Monthly Rev:</span>
                                  <span className="font-bold text-emerald-700">
                                    ${site.financePlan.projectedMonthlyRevenue.toLocaleString()}/mo
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          )}

                          <div className="flex gap-2">
                            {isCommercial ? (
                              <button
                                onClick={() => setInterestTargetAsset(site)}
                                type="button"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1e293b] py-2 text-xs font-semibold text-white hover:bg-slate-900 transition shadow-sm"
                              >
                                <Send className="h-3.5 w-3.5 text-emerald-400" />
                                I&apos;m Interested
                              </button>
                            ) : (
                              <button
                                onClick={() => setInterestTargetAsset(site)}
                                type="button"
                                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-center text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                              >
                                Propose Use / Inquiry
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Render $1 Homestead Eligible Sites */}
          {(selectedCategoryFilter === 'ALL' || selectedCategoryFilter === 'HOMESTEAD' || selectedCategoryFilter === 'CIVIC') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
                <span>$1 Homestead Sweat-Equity Sites ({locationAssociatedProperties.length})</span>
                <span className="text-emerald-700 font-bold">$1 Homestead Track</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {locationAssociatedProperties.map((site) => {
                  const isLinkedHomestead = activeAcquisition?.parcelId === site.parcelId
                  const isAttachedWorkRoster = workRosterSites.some((w) => w.assetId === site.id)

                  return (
                    <div
                      key={site.id}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                        isLinkedHomestead
                          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                          : isAttachedWorkRoster
                          ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="inline-block rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-700">
                            {site.city}, {site.state}
                          </span>
                          {isLinkedHomestead && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
                              <ShieldCheck className="h-3 w-3" /> $1 Homestead
                            </span>
                          )}
                          {isAttachedWorkRoster && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-bold text-white">
                              <HardHat className="h-3 w-3" /> Work Roster
                            </span>
                          )}
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-[#0f172a]">{site.name}</h4>
                        <p className="mt-1 text-xs text-slate-500">{site.address}</p>
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                          <span>TAXKEY: {site.parcelId}</span>
                          <span className="font-bold text-[#0f172a]">
                            ${site.essentialRepairsCost.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setWorkModalTarget(site)
                              setWorkModalOpen(true)
                            }}
                            type="button"
                            className="flex-1 rounded-xl border border-slate-300 bg-white py-1.5 text-center text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                          >
                            {isAttachedWorkRoster ? 'Update Roster' : 'Attach Roster'}
                          </button>

                          <button
                            onClick={() => {
                              setMatcherCity(site.city)
                              setMatcherOpen(true)
                            }}
                            type="button"
                            className="flex-1 rounded-xl bg-slate-800 py-1.5 text-center text-xs font-semibold text-white hover:bg-slate-900 transition"
                          >
                            {isLinkedHomestead ? 'Manage $1 Site' : '$1 Homestead'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Collapsible Section for Functional Profile Tools */}
        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Participant Workspace Modules
              </h3>
              <p className="text-xs text-slate-500">
                Manage your location goals, municipal compliance ledger, and emergency safety net intake.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setActiveDrawerTab((prev) => (prev === 'goals' ? null : 'goals'))
                }
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeDrawerTab === 'goals'
                    ? 'border-[#1e293b] bg-[#1e293b] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                Housing Preferences
                {activeDrawerTab === 'goals' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={() => setActiveDrawerTab((prev) => (prev === 'deed' ? null : 'deed'))}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeDrawerTab === 'deed'
                    ? 'border-[#1e293b] bg-[#1e293b] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Hammer className="h-3.5 w-3.5" />
                Path to Deed (180-Day)
                {activeDrawerTab === 'deed' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={() => setActiveDrawerTab((prev) => (prev === 'roles' ? null : 'roles'))}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeDrawerTab === 'roles'
                    ? 'border-[#1e293b] bg-[#1e293b] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Role Discovery Board
                {activeDrawerTab === 'roles' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={() =>
                  setActiveDrawerTab((prev) => (prev === 'safety' ? null : 'safety'))
                }
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeDrawerTab === 'safety'
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <LifeBuoy className="h-3.5 w-3.5 text-amber-700" />
                Emergency Safety Net
                {activeDrawerTab === 'safety' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          {activeDrawerTab ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {activeDrawerTab === 'goals' && <HousingPreferencesForm />}
              {activeDrawerTab === 'deed' && <PathToDeedTracker />}
              {activeDrawerTab === 'roles' && <RoleDiscoveryBoard />}
              {activeDrawerTab === 'safety' && <HousingSafetyNetCard />}
            </div>
          ) : null}
        </section>
      </main>

      {/* Property Matcher Modal ($1 Homestead) */}
      <PropertyMatcherModal
        isOpen={matcherOpen}
        initialCity={matcherCity}
        onClose={() => setMatcherOpen(false)}
        onLinked={(newAcquisition) => {
          setActiveAcquisition(newAcquisition)
          setActiveDrawerTab('deed')
        }}
      />

      {/* Property Work Roster Modal (Layer 2 Revitalization Work) */}
      <PropertyWorkRosterModal
        isOpen={workModalOpen}
        targetProperty={workModalTarget}
        onClose={() => setWorkModalOpen(false)}
        onAttached={(newAttachment) => {
          setWorkRosterSites((prev) => [...prev.filter((w) => w.assetId !== newAttachment.assetId), newAttachment])
        }}
      />

      {/* Commercial & Track Asset Interest Inquiry Modal */}
      {interestTargetAsset && (
        <AssetInterestModal
          asset={interestTargetAsset}
          user={user}
          onClose={() => setInterestTargetAsset(null)}
        />
      )}
    </div>
  )
}
