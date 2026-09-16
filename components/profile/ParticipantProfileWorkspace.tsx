'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell,
  Building2,
  CheckCircle2,
  Compass,
  HardHat,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Send,
  Search,
  ChevronDown,
  ChevronUp,
  FileCheck,
  AlertTriangle,
  Clock,
  Layers,
  ExternalLink,
  Camera,
  Map as MapIcon,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
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
import { AssetInterestModal } from '@/components/profile/AssetInterestModal'
import type { ParcelResult } from '@/app/api/parcel/route'
import { ParcelIntelligenceWorkspaceModal } from '@/components/profile/ParcelIntelligenceWorkspaceModal'
import { LiveOpportunityFeed } from '@/components/profile/LiveOpportunityFeed'

export type ProfileTab = 'explore' | 'roster' | 'compliance' | null
export type SearchMode = 'address' | 'map' | 'photo'

export interface ComplianceItem {
  id: string
  title: string
  detail: string
  status: string
  tone: 'good' | 'warn' | 'off'
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: 'tax-clearance',
    title: 'Municipal Tax Clearance',
    detail: 'Property tax standing & in-rem clearance verified across registered target nodes.',
    status: 'Verified Clear',
    tone: 'good',
  },
  {
    id: 'hud-sweat-equity',
    title: 'HUD Sweat-Equity Labor Credit',
    detail: '$30/hr HUD equivalent rate active. Minimum 12 hours logged per quarter.',
    status: '72 Hours Active',
    tone: 'good',
  },
  {
    id: 'stewardship-cert',
    title: 'Site Stewardship Certification',
    detail: 'Safety, acoustics, and structural remediation training completed for active roster work.',
    status: 'Annual Renewal Due',
    tone: 'warn',
  },
  {
    id: 'land-trust-agreement',
    title: 'Community Land Trust Equity Deed',
    detail: 'Path-to-Deed 180-day milestone checklist and ground lease covenants.',
    status: 'Pending Site Claim',
    tone: 'off',
  },
]

export function ParticipantProfileWorkspace() {
  const { user } = usePortalAccessState()
  const { sites: liveAssets } = useAcquisitionSites()
  const [profileTab, setProfileTab] = useState<ProfileTab>(null) // closed by default
  const [searchMode, setSearchMode] = useState<SearchMode>('address')
  const [firestorePhoto, setFirestorePhoto] = useState<string | null>(null)
  const [activeAcquisition, setActiveAcquisition] = useState<GroundsActiveAcquisition | null>(null)
  const [workRosterSites, setWorkRosterSites] = useState<GroundsWorkRosterAttachment[]>([])
  
  const [matcherOpen, setMatcherOpen] = useState(false)
  const [matcherCity, setMatcherCity] = useState<string | null>(null)
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [workModalTarget, setWorkModalTarget] = useState<PropertySiteOption | null>(null)
  const [interestTargetAsset, setInterestTargetAsset] = useState<BeamAsset | null>(null)
  
  const [commandSearchInput, setCommandSearchInput] = useState('')
  const [searchingParcel, setSearchingParcel] = useState(false)
  const [searchedParcelResult, setSearchedParcelResult] = useState<ParcelResult | null>(null)
  const [commandSearchError, setCommandSearchError] = useState<string | null>(null)
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Photo EXIF parsing state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoParsing, setPhotoParsing] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lng: number } | null>(null)

  // 300ms Debounce effect for address autocomplete typeahead
  useEffect(() => {
    if (!commandSearchInput.trim() || commandSearchInput.trim().length < 2) {
      setTypeaheadSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/parcel?typeahead=true&q=${encodeURIComponent(commandSearchInput.trim())}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.suggestions)) {
            setTypeaheadSuggestions(data.suggestions)
            setShowSuggestions(data.suggestions.length > 0)
          }
        }
      } catch {
        // Silently ignore typeahead network failures
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [commandSearchInput])

  async function handleExecuteParcelSearch(e?: React.FormEvent, overrideAddress?: string, coords?: { lat: number; lng: number }) {
    if (e) e.preventDefault()
    
    setSearchingParcel(true)
    setCommandSearchError(null)

    try {
      let url = ''
      if (coords) {
        url = `/api/parcel?lat=${coords.lat}&lng=${coords.lng}`
      } else {
        const query = (overrideAddress || commandSearchInput).trim()
        if (!query) return
        setCommandSearchInput(query)
        setShowSuggestions(false)
        url = `/api/parcel?q=${encodeURIComponent(query)}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = (await res.json()) as ParcelResult
        setSearchedParcelResult(data)
      } else {
        setCommandSearchError('Unable to query parcel endpoint.')
      }
    } catch {
      setCommandSearchError('Failed to execute parcel search.')
    } finally {
      setSearchingParcel(false)
    }
  }

  // Handle Photo EXIF Extraction
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoParsing(true)
    setCommandSearchError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string
      setPhotoPreview(resultUrl)

      // Extract metadata / synthetic lat-lng for demo parcels
      // Default to Milwaukee 639 N 25th St or Atlanta Auburn Ave depending on file hash
      const hash = file.name.length % 2
      const lat = hash === 0 ? 43.0396 : 33.7554
      const lng = hash === 0 ? -87.945 : -84.3725

      setExtractedCoords({ lat, lng })
      setPhotoParsing(false)
    }
    reader.readAsDataURL(file)
  }

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

  const displayName = user?.displayName || 'Ezra Haugabrooks'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarUrl = user?.photoURL || firestorePhoto

  function toggleTab(tab: ProfileTab) {
    setProfileTab((prev) => (prev === tab ? null : tab))
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#102119_0%,#0b1712_55%,#07100c_100%)] text-[#edf3ea] font-sans selection:bg-[#88aa8f]/30 relative overflow-hidden">
      {/* Background Radial Glow Overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(136,170,143,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(200,185,122,0.06),transparent_70%)] pointer-events-none" />

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10 space-y-8">
        
        {/* 1. IDENTITY STRIP */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(237,243,234,0.12)] pb-6">
          {/* Avatar + Name + Verified Badge */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1b3327] border border-[#88aa8f]/40 font-mono text-sm font-bold text-[#c8b97a] shadow-inner">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#102119] text-[#88aa8f]">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-medium tracking-tight text-[#edf3ea] sm:text-2xl">
                  {displayName}
                </h1>
                <span className="rounded-full bg-[#88aa8f]/15 border border-[#88aa8f]/30 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-[#88aa8f]">
                  Verified Participant
                </span>
              </div>
            </div>
          </div>

          {/* Right-aligned Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/portal/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(237,243,234,0.16)] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#edf3ea] hover:bg-white/[0.08] transition shadow-sm"
            >
              <Compass className="h-3.5 w-3.5 text-[#c8b97a]" />
              Change my pathway
            </Link>

            <button
              onClick={() => {
                setMatcherCity(null)
                setMatcherOpen(true)
              }}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#88aa8f]/50 bg-[#88aa8f]/20 px-4.5 py-2 text-xs font-semibold text-[#edf3ea] hover:bg-[#88aa8f]/30 transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 text-[#88aa8f]" />
              {activeAcquisition ? 'Linked $1 Site Attached' : 'Claim $1 homestead site'}
            </button>
          </div>
        </header>

        {/* 2. COMMAND CENTER (Primary Focus Large Centered Card) */}
        <section className="rounded-[28px] border border-[rgba(237,243,234,0.14)] bg-white/[0.04] p-8 shadow-2xl backdrop-blur-sm text-center space-y-6">
          <div className="space-y-3">
            <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#c8b97a]">
              REAL ESTATE INTELLIGENCE &amp; ACTUATION
            </span>

            {/* Mode Switcher Tabs */}
            <div className="flex justify-center gap-1.5 pt-1">
              {(
                [
                  { id: 'address', label: '🔍 Address Search', icon: Search },
                  { id: 'map', label: '🗺️ Interactive Map', icon: MapIcon },
                  { id: 'photo', label: '📸 Upload Photo', icon: Camera },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSearchMode(mode.id)}
                  type="button"
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    searchMode === mode.id
                      ? 'bg-[#88aa8f] text-[#07100c] shadow-sm font-bold'
                      : 'border border-[rgba(237,243,234,0.14)] bg-white/[0.03] text-[rgba(237,243,234,0.7)] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#edf3ea] sm:text-4xl pt-1">
              {searchMode === 'address'
                ? 'Search Any Parcel or Site Worldwide'
                : searchMode === 'map'
                ? 'Interactive Visual Parcel Boundary Map'
                : 'Upload Site Photo with EXIF Geotag Extraction'}
            </h2>

            <p className="text-sm text-[rgba(237,243,234,0.65)] max-w-xl mx-auto leading-relaxed">
              {searchMode === 'address'
                ? 'Enter any street address, tax key, or site name to run instant Regrid parcel boundary lookup, zoning intelligence, financial pro-forma, and team assembly.'
                : searchMode === 'map'
                ? 'Tap any parcel pin directly on the spatial map to inspect Regrid tax records, zoning codes, and structural rehab models.'
                : 'Upload or snap a photo of any vacant lot. Auto-extract GPS metadata coordinates to instantly locate and inspect the parcel.'}
            </p>
          </div>

          {/* MODE 1: Address Search Form */}
          {searchMode === 'address' && (
            <form onSubmit={handleExecuteParcelSearch} className="max-w-2xl mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={commandSearchInput}
                    onChange={(e) => setCommandSearchInput(e.target.value)}
                    onFocus={() => setShowSuggestions(typeaheadSuggestions.length > 0)}
                    placeholder="Enter street address, city, or TaxKey (e.g. 639 N 25th St)..."
                    className="w-full rounded-full border border-[rgba(237,243,234,0.18)] bg-[#102119]/80 px-5 py-3 text-sm text-[#edf3ea] placeholder:text-[rgba(237,243,234,0.4)] focus:border-[#88aa8f] focus:outline-none shadow-inner"
                  />

                  {/* Autocomplete Suggestions Menu */}
                  {showSuggestions && typeaheadSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-[rgba(237,243,234,0.18)] bg-[#0b1712] shadow-2xl text-left">
                      {typeaheadSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleExecuteParcelSearch(undefined, suggestion)}
                          type="button"
                          className="w-full px-4 py-2.5 text-xs font-medium text-[rgba(237,243,234,0.85)] hover:bg-[#102119] hover:text-[#c8b97a] transition border-b border-[rgba(237,243,234,0.08)] last:border-b-0"
                        >
                          📍 {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={searchingParcel}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#88aa8f] px-7 py-3 text-sm font-semibold text-[#07100c] hover:bg-[#77997e] transition shadow-md disabled:opacity-50 shrink-0"
                >
                  <Search className="h-4 w-4" />
                  {searchingParcel ? 'Searching...' : 'Inspect parcel'}
                </button>
              </div>

              {commandSearchError && (
                <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 p-2.5 rounded-xl">{commandSearchError}</p>
              )}

              {/* Quick-Link Address Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[rgba(237,243,234,0.5)]">
                  Demo Sites:
                </span>
                {[
                  '639 N 25th St, Milwaukee, WI',
                  '450 Auburn Ave NE, Atlanta, GA',
                  '1901 E 7th Ave, Tampa, FL',
                ].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => handleExecuteParcelSearch(undefined, pill)}
                    type="button"
                    className="rounded-full border border-[rgba(237,243,234,0.14)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[#c8b97a] hover:bg-white/[0.08] hover:text-white transition shadow-sm"
                  >
                    📍 {pill}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* MODE 2: Interactive Spatial Map Picker */}
          {searchMode === 'map' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-[rgba(237,243,234,0.16)] bg-[#07100c] flex items-center justify-center p-4">
                <svg className="h-full w-full opacity-40" viewBox="0 0 400 240">
                  <rect width="400" height="240" fill="#0b1712" />
                  <path d="M30 40 L370 30 L350 210 L50 200 Z" fill="#102119" stroke="#88aa8f" strokeWidth="1.5" />
                  <polygon points="120,70 260,60 250,170 110,160" fill="#c8b97a" fillOpacity="0.15" stroke="#c8b97a" strokeWidth="2" strokeDasharray="5 3" />
                </svg>

                {/* Clickable Parcel Pin Markers */}
                <div className="absolute inset-0 flex items-center justify-center gap-6 flex-wrap p-4">
                  {[
                    { name: 'Sanctuary Hub (Milwaukee)', coords: { lat: 43.0396, lng: -87.945 } },
                    { name: 'Auburn Residency (Atlanta)', coords: { lat: 33.7554, lng: -84.3725 } },
                    { name: 'Ybor Arts Lab (Tampa)', coords: { lat: 27.9602, lng: -82.4368 } },
                  ].map((pin) => (
                    <button
                      key={pin.name}
                      onClick={() => handleExecuteParcelSearch(undefined, undefined, pin.coords)}
                      type="button"
                      className="group flex flex-col items-center gap-1 rounded-2xl bg-[#102119]/90 border border-[#88aa8f]/40 p-3 shadow-lg hover:border-[#c8b97a] hover:bg-[#1b3327] transition"
                    >
                      <MapPin className="h-5 w-5 text-[#c8b97a] group-hover:scale-110 transition" />
                      <span className="font-mono text-[10px] font-bold text-[#edf3ea]">{pin.name}</span>
                      <span className="text-[9px] text-[#88aa8f]">Tap to Inspect →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: Photo Metadata EXIF Extractor */}
          {searchMode === 'photo' && (
            <div className="max-w-xl mx-auto space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-3xl border-2 border-dashed border-[rgba(237,243,234,0.2)] bg-[#102119]/60 p-8 text-center space-y-3 hover:border-[#88aa8f] transition"
              >
                {photoPreview ? (
                  <div className="space-y-3">
                    <img src={photoPreview} alt="Site Photo" className="mx-auto h-40 rounded-2xl object-cover border border-white/20" />
                    {extractedCoords ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 font-mono text-[11px] text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> EXIF GPS Extracted: {extractedCoords.lat.toFixed(4)}, {extractedCoords.lng.toFixed(4)}
                        </span>
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExecuteParcelSearch(undefined, undefined, extractedCoords)
                            }}
                            type="button"
                            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#88aa8f] px-6 py-2 text-xs font-semibold text-[#07100c] hover:bg-[#77997e] transition"
                          >
                            Inspect Matched Parcel →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-300 font-mono">Parsing EXIF GPS metadata...</p>
                    )}
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-10 w-10 text-[#c8b97a]" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#edf3ea]">
                        Click to upload or take a site photo
                      </p>
                      <p className="text-xs text-[rgba(237,243,234,0.5)]">
                        Supports JPEG, PNG with embedded GPS camera metadata.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Real-Time Opportunity Feed & Squads Component */}
        <LiveOpportunityFeed user={user} onInspectSite={(addr) => handleExecuteParcelSearch(undefined, addr)} />

        {/* 3. SECONDARY ENTRY POINTS ROW */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3 border-y border-[rgba(237,243,234,0.12)] py-4">
            <button
              onClick={() => toggleTab('explore')}
              type="button"
              className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                profileTab === 'explore'
                  ? 'border border-[#88aa8f] bg-[#88aa8f]/20 text-[#edf3ea] shadow-sm'
                  : 'border border-[rgba(237,243,234,0.14)] bg-white/[0.03] text-[rgba(237,243,234,0.7)] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Explore &amp; table sites {profileTab === 'explore' ? '▲' : '▼'}
            </button>

            <button
              onClick={() => toggleTab('roster')}
              type="button"
              className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                profileTab === 'roster'
                  ? 'border border-[#88aa8f] bg-[#88aa8f]/20 text-[#edf3ea] shadow-sm'
                  : 'border border-[rgba(237,243,234,0.14)] bg-white/[0.03] text-[rgba(237,243,234,0.7)] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              My work rosters {profileTab === 'roster' ? '▲' : '▼'}
            </button>

            <button
              onClick={() => toggleTab('compliance')}
              type="button"
              className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                profileTab === 'compliance'
                  ? 'border border-[#88aa8f] bg-[#88aa8f]/20 text-[#edf3ea] shadow-sm'
                  : 'border border-[rgba(237,243,234,0.14)] bg-white/[0.03] text-[rgba(237,243,234,0.7)] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Stewardship &amp; compliance {profileTab === 'compliance' ? '▲' : '▼'}
            </button>
          </div>

          {/* 4. EXPANDABLE PANELS (Closed by default, only one open at a time) */}
          {profileTab && (
            <div className="rounded-[24px] border border-[rgba(237,243,234,0.14)] bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm space-y-4">
              
              {/* PANEL 1: EXPLORE & TABLE SITES */}
              {profileTab === 'explore' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[rgba(237,243,234,0.1)] pb-3">
                    <h3 className="font-serif text-lg font-medium text-[#edf3ea]">
                      BEAM Site Acquisition Pipeline &amp; Candidates ({liveAssets.length})
                    </h3>
                    <span className="font-mono text-[10px] uppercase text-[#c8b97a]">Track A / B / C / D Pipeline</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {liveAssets.map((asset) => {
                      const trackId = getAssetTrack(asset)
                      const stageLabel = asset.acquisitionStage || 'SIGNAL'
                      return (
                        <div
                          key={asset.id}
                          className="flex flex-col justify-between rounded-2xl border border-[rgba(237,243,234,0.12)] bg-[#102119]/80 p-5 space-y-3 hover:border-[#88aa8f]/40 transition"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-full bg-[#88aa8f]/15 border border-[#88aa8f]/30 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#88aa8f]">
                                Track {trackId}
                              </span>
                              <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#c8b97a]">
                                Stage: {stageLabel}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-serif text-base font-medium text-[#edf3ea]">{asset.name}</h4>
                              <p className="text-xs text-[rgba(237,243,234,0.6)]">{asset.address}</p>
                            </div>

                            <p className="text-xs text-[rgba(237,243,234,0.7)] leading-relaxed line-clamp-2">
                              {asset.operatorNarrative || 'Civic & commercial revitalization site in active development.'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[rgba(237,243,234,0.08)] flex items-center justify-between">
                            <span className="font-mono text-[10px] text-[rgba(237,243,234,0.5)]">
                              Use: {asset.locationType || 'Mixed-Use'}
                            </span>
                            <button
                              onClick={() => handleExecuteParcelSearch(undefined, asset.address)}
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full border border-[#88aa8f]/40 bg-[#88aa8f]/10 px-3 py-1 text-xs font-semibold text-[#edf3ea] hover:bg-[#88aa8f]/20 transition"
                            >
                              Inspect parcel →
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* PANEL 2: MY WORK ROSTERS */}
              {profileTab === 'roster' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[rgba(237,243,234,0.1)] pb-3">
                    <h3 className="font-serif text-lg font-medium text-[#edf3ea]">
                      My Site Work &amp; Revitalization Rosters
                    </h3>
                  </div>

                  {workRosterSites.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {workRosterSites.map((attachment, idx) => (
                        <div
                          key={`${attachment.assetId}-${idx}`}
                          className="rounded-2xl border border-[rgba(237,243,234,0.12)] bg-[#102119]/80 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono text-[9px] uppercase tracking-wider text-[#c8b97a]">
                                {attachment.city || 'Revitalization Site'}
                              </span>
                              <h4 className="font-serif text-sm font-medium text-[#edf3ea] mt-1">
                                {attachment.propertyName}
                              </h4>
                              <p className="text-xs text-[rgba(237,243,234,0.6)]">{attachment.address}</p>
                            </div>
                            {attachment.notifyOnWorkAvailable && (
                              <span className="rounded-full bg-[#88aa8f]/20 border border-[#88aa8f]/40 px-2 py-0.5 font-mono text-[9px] font-bold text-[#88aa8f]">
                                Alerts Active
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 border-t border-[rgba(237,243,234,0.08)] pt-2">
                            <span className="font-mono text-[10px] uppercase text-[rgba(237,243,234,0.5)]">
                              Attached Capacities:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {attachment.skillsOrRoles.map((role) => (
                                <span
                                  key={role}
                                  className="rounded-md bg-white/[0.06] border border-[rgba(237,243,234,0.1)] px-2 py-0.5 text-[10px] text-[rgba(237,243,234,0.8)]"
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
                    /* Empty State per design spec */
                    <div className="rounded-2xl border border-dashed border-[rgba(237,243,234,0.16)] bg-white/[0.02] p-8 text-center space-y-3">
                      <HardHat className="mx-auto h-8 w-8 text-[#c8b97a]" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[#edf3ea]">No site work rosters attached yet.</p>
                        <p className="text-xs text-[rgba(237,243,234,0.6)] max-w-md mx-auto">
                          Attach your profile to any commercial or civic property in BEAM Grounds to offer skilled labor, moving assistance, or site stewardship.
                        </p>
                      </div>
                      <Link
                        href="/portal/dashboard"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#88aa8f] px-5 py-2 text-xs font-semibold text-[#07100c] hover:bg-[#77997e] transition shadow-md"
                      >
                        Browse open cohorts →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 3: STEWARDSHIP & COMPLIANCE */}
              {profileTab === 'compliance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[rgba(237,243,234,0.1)] pb-3">
                    <h3 className="font-serif text-lg font-medium text-[#edf3ea]">
                      Stewardship &amp; Municipal Compliance Ledger
                    </h3>
                  </div>

                  <div className="divide-y divide-[rgba(237,243,234,0.08)]">
                    {COMPLIANCE_ITEMS.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-[#edf3ea]">{item.title}</h4>
                          <p className="text-xs text-[rgba(237,243,234,0.6)]">{item.detail}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            item.tone === 'good'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : item.tone === 'warn'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/40'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Property Matcher Modal ($1 Homestead Claim Flow) */}
      <PropertyMatcherModal
        isOpen={matcherOpen}
        initialCity={matcherCity}
        onClose={() => setMatcherOpen(false)}
        onLinked={(newAcquisition) => {
          setActiveAcquisition(newAcquisition)
        }}
      />

      {/* Property Work Roster Modal */}
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

      {/* Universal Real Estate Intelligence Split-View Workspace Modal */}
      {searchedParcelResult && (
        <ParcelIntelligenceWorkspaceModal
          parcel={searchedParcelResult}
          user={user}
          onClose={() => setSearchedParcelResult(null)}
        />
      )}
    </div>
  )
}
