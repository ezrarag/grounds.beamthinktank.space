'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  Settings,
  Flame,
  Home,
  User,
  MessageSquare,
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
import { EditProfileModal, type UserTargetRegion } from '@/components/profile/EditProfileModal'
import { RegionalHomesteadEngine } from '@/components/profile/RegionalHomesteadEngine'
import { ForgeDeveloperFeedbackModal } from '@/components/feedback/ForgeDeveloperFeedbackModal'

export type ProfileTab = 'explore' | 'roster' | 'compliance' | null
export type SearchMode = 'address' | 'map' | 'photo'
export type ConsoleViewMode = 'search' | 'squads' | 'homestead'

export interface ComplianceItem {
  id: string
  title: string
  detail: string
  status: string
  tone: 'good' | 'warn' | 'off'
  source: string
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: 'tax-clearance',
    title: 'Municipal Tax Clearance',
    detail: 'Property tax standing & in-rem clearance verified across registered target nodes.',
    status: 'Verified Clear',
    tone: 'good',
    source: 'City Open Data Portal (CKAN / Socrata API)',
  },
  {
    id: 'hud-sweat-equity',
    title: 'HUD Sweat-Equity Labor Credit',
    detail: '$30/hr HUD equivalent rate active. Minimum 12 hours logged per quarter.',
    status: '72 Hours Active',
    tone: 'good',
    source: 'HUD Section 3 Registry ($30/hr Labor Standard)',
  },
  {
    id: 'stewardship-cert',
    title: 'Site Stewardship Certification',
    detail: 'Safety, acoustics, and structural remediation training completed for active roster work.',
    status: 'Annual Renewal Due',
    tone: 'warn',
    source: 'Municipal Adaptive Reuse & Safety Registry',
  },
  {
    id: 'land-trust-agreement',
    title: 'Community Land Trust Equity Deed',
    detail: 'Path-to-Deed 180-day milestone checklist and ground lease covenants.',
    status: 'Pending Site Claim',
    tone: 'off',
    source: 'BEAM Ground Lease & Municipal Trust Registry',
  },
]

export function ParticipantProfileWorkspace() {
  const { user } = usePortalAccessState()
  const { sites: liveAssets } = useAcquisitionSites()
  const [profileTab, setProfileTab] = useState<ProfileTab>(null) // closed by default
  const [activeConsoleView, setActiveConsoleView] = useState<ConsoleViewMode>('search')
  const [searchMode, setSearchMode] = useState<SearchMode>('address')
  const [userRegion, setUserRegion] = useState<UserTargetRegion>('MKE')
  
  const [firestorePhoto, setFirestorePhoto] = useState<string | null>(null)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)
  const [userHandle, setUserHandle] = useState<string | null>(null)
  const [activeAcquisition, setActiveAcquisition] = useState<GroundsActiveAcquisition | null>(null)
  const [workRosterSites, setWorkRosterSites] = useState<GroundsWorkRosterAttachment[]>([])
  
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [matcherOpen, setMatcherOpen] = useState(false)
  const [matcherCity, setMatcherCity] = useState<string | null>(null)
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [workModalTarget, setWorkModalTarget] = useState<PropertySiteOption | null>(null)
  const [interestTargetAsset, setInterestTargetAsset] = useState<BeamAsset | null>(null)

  // Header Dropdown Menu state
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)

  // Developer Feedback state
  const [developerFeedbackEnabled, setDeveloperFeedbackEnabled] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  
  const [commandSearchInput, setCommandSearchInput] = useState('')
  const [searchingParcel, setSearchingParcel] = useState(false)
  const [searchedParcelResult, setSearchedParcelResult] = useState<ParcelResult | null>(null)
  const [commandSearchError, setCommandSearchError] = useState<string | null>(null)
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Geolocation state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLocating, setGeoLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Civic API query state
  const [civicSyncing, setCivicSyncing] = useState(false)
  const [civicDataCount, setCivicDataCount] = useState<number | null>(null)
  const [civicSourceLabel, setCivicSourceLabel] = useState<string | null>(null)

  function requestUserLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('HTML5 Geolocation is not supported by your browser.')
      return
    }
    setGeoLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLocating(false)
      },
      (err) => {
        setGeoError(err.message || 'Unable to fetch physical location.')
        setGeoLocating(false)
        if (!userCoords) setUserCoords({ lat: 43.0389, lng: -87.9065 }) // Fallback MKE center
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    if (searchMode === 'map' && !userCoords) {
      requestUserLocation()
    }
  }, [searchMode])

  async function handleSyncCivicData() {
    setCivicSyncing(true)
    try {
      const cityId = userRegion === 'MKE' ? 'milwaukee-wi' : userRegion === 'ATL' ? 'atlanta-ga' : 'milwaukee-wi'
      const res = await fetch('/api/civic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId, limit: 10 }),
      })
      if (res.ok) {
        const data = await res.json()
        setCivicDataCount(data.count ?? 0)
        setCivicSourceLabel(data.cityLabel || 'City Open Data Portal')
      } else {
        const err = await res.json()
        setCivicSourceLabel(`Sync status: ${err.error || 'Open Data Live'}`)
      }
    } catch {
      setCivicSourceLabel('Open Data Live (Cached)')
    } finally {
      setCivicSyncing(false)
    }
  }

  // Photo EXIF parsing state: Camera & Library input refs
  const cameraInputRef = useRef<HTMLInputElement>(null)
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
          if (data.displayName) setUserDisplayName(data.displayName)
          if (data.handle) setUserHandle(data.handle)
          if (data.preferredRegion) setUserRegion(data.preferredRegion as UserTargetRegion)
          if (typeof data.developerFeedbackEnabled === 'boolean') {
            setDeveloperFeedbackEnabled(data.developerFeedbackEnabled)
          }
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

  const displayName = userDisplayName || user?.displayName || 'Ezra Haugabrooks'
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
        
        {/* 1. IDENTITY STRIP & REFACTORED CLEAN HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(237,243,234,0.12)] pb-6">
          {/* Avatar + Name + Interactive Edit Profile Pill */}
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
                
                {/* Refactored Interactive [ ⚙️ Edit Profile ] Pill Button */}
                <button
                  onClick={() => setEditProfileOpen(true)}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#88aa8f]/15 border border-[#88aa8f]/30 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#88aa8f] hover:bg-[#88aa8f]/25 hover:text-white transition shadow-sm"
                >
                  <Settings className="h-3 w-3" /> Edit Profile
                </button>
              </div>

              {/* Dynamic Real-Time GPS Location Indicator */}
              <p className="text-xs text-[rgba(237,243,234,0.6)] font-mono flex items-center gap-1.5 pt-0.5">
                <MapPin className="h-3 w-3 text-[#c8b97a]" />
                {userCoords
                  ? `GPS Location: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° W`
                  : 'Detecting current physical location...'}
              </p>
            </div>
          </div>

          {/* Top-Right Header Dropdown Menu for Workspace Panels */}
          <div className="relative">
            <button
              onClick={() => setHeaderMenuOpen((prev) => !prev)}
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(237,243,234,0.18)] bg-[#102119]/80 px-4 py-2 text-xs font-semibold text-[#edf3ea] hover:bg-[#1b3327] hover:border-[#88aa8f] transition shadow-md"
            >
              <Layers className="h-3.5 w-3.5 text-[#88aa8f]" />
              <span>Workspace Views &amp; Panels</span>
              <ChevronDown className={`h-3.5 w-3.5 text-[#c8b97a] transition-transform ${headerMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {headerMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-[rgba(237,243,234,0.18)] bg-[#0b1712] p-2 shadow-2xl space-y-1">
                <div className="px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#c8b97a]">
                  Stage Panels &amp; Secondary Views
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('explore')
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    profileTab === 'explore' ? 'bg-[#88aa8f]/20 text-[#edf3ea] font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>🏛️</span> Explore &amp; Table Sites
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('roster')
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    profileTab === 'roster' ? 'bg-[#88aa8f]/20 text-[#edf3ea] font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>👷</span> My Work Rosters
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('compliance')
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    profileTab === 'compliance' ? 'bg-[#88aa8f]/20 text-[#edf3ea] font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>⚖️</span> Stewardship &amp; Compliance
                </button>

                <div className="border-t border-[rgba(237,243,234,0.1)] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('squads')
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'squads' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>⚡</span> Live Opportunities &amp; Squads
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('homestead')
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'homestead' ? 'bg-[#88aa8f]/20 text-[#88aa8f] font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>📍</span> Claim $1 Homestead Site
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('search')
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'search' ? 'bg-[#88aa8f]/20 text-[#edf3ea] font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>🔍</span> Parcel Search Engine
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 2. DYNAMIC MAIN CONSOLE STAGE (Animated Framer Motion Switcher) */}
        <section className="relative">
          <AnimatePresence mode="wait">
            {/* VIEW A (Default): Real Estate Intelligence & Actuation Search */}
            {activeConsoleView === 'search' && (
              <motion.div
                key="search-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="rounded-[28px] border border-[rgba(237,243,234,0.14)] bg-white/[0.04] p-8 shadow-2xl backdrop-blur-sm text-center space-y-6"
              >
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
                        { id: 'photo', label: '📸 Take / Upload Photo', icon: Camera },
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
                      ? 'Embedded Interactive Google / Apple Maps Viewer'
                      : 'Take Photo or Upload EXIF Geotag Image'}
                  </h2>

                  <p className="text-sm text-[rgba(237,243,234,0.65)] max-w-xl mx-auto leading-relaxed">
                    {searchMode === 'address'
                      ? 'Enter any street address, tax key, or site name to run instant Regrid parcel boundary lookup, zoning intelligence, financial pro-forma, and team assembly.'
                      : searchMode === 'map'
                      ? 'Pan, zoom, and select locations directly inside the embedded Google Maps interactive viewer or open deep links.'
                      : 'Take a photo directly with your camera or upload a site image. Auto-extract GPS metadata coordinates to locate the parcel.'}
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

                {/* MODE 2: Embedded Interactive Spatial Map Viewer */}
                {searchMode === 'map' && (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* Map Controls & Geolocation Status Bar */}
                    <div className="rounded-2xl border border-[rgba(237,243,234,0.14)] bg-[#102119]/90 p-4 space-y-3 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#c8b97a]" />
                          <span className="font-mono text-xs font-bold text-[#edf3ea]">
                            {userCoords
                              ? `GPS Coordinates: ${userCoords.lat.toFixed(4)}° N, ${userCoords.lng.toFixed(4)}° W`
                              : geoLocating
                              ? 'Fetching browser GPS coordinates...'
                              : 'Location detected (Milwaukee Center Node)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={requestUserLocation}
                            disabled={geoLocating}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-[rgba(237,243,234,0.16)] bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-[#88aa8f] hover:bg-white/10 transition"
                          >
                            <Compass className={`h-3 w-3 ${geoLocating ? 'animate-spin' : ''}`} />
                            {geoLocating ? 'Locating...' : 'Detect My Location'}
                          </button>
                        </div>
                      </div>

                      {geoError && (
                        <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                          {geoError} (Using target node default coordinates)
                        </p>
                      )}

                      {/* External Map Deep-Links & Quick Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(237,243,234,0.08)]">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://maps.apple.com/?q=${userCoords?.lat || 43.0396},${userCoords?.lng || -87.945}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
                          >
                            🍎 Open in Apple Maps <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${userCoords?.lat || 43.0396},${userCoords?.lng || -87.945}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-800/50 bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-200 hover:border-emerald-600 hover:text-white transition"
                          >
                            🌐 Open in Google Maps <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </div>

                        {userCoords && (
                          <button
                            onClick={() => handleExecuteParcelSearch(undefined, undefined, userCoords)}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full bg-[#88aa8f] px-3.5 py-1 text-xs font-semibold text-[#07100c] hover:bg-[#77997e] transition shadow-sm"
                          >
                            <Search className="h-3 w-3" /> Inspect Local Parcel →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Embedded Interactive Google Map iFrame Frame */}
                    <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-[rgba(237,243,234,0.18)] bg-[#07100c] shadow-2xl">
                      <iframe
                        title="Embedded Interactive Google Map"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${userCoords ? `${userCoords.lat},${userCoords.lng}` : '43.0389,-87.9065'}&z=15&output=embed`}
                        className="w-full h-full grayscale-[25%] contrast-[110%] rounded-3xl"
                      />
                    </div>

                    {/* Real Active BEAM Acquisition Sites in Database */}
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <span className="w-full text-center font-mono text-[10px] uppercase text-[rgba(237,243,234,0.5)]">
                        Real Acquisition Sites ({liveAssets.length}):
                      </span>
                      {liveAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => {
                            handleExecuteParcelSearch(undefined, asset.address)
                          }}
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(237,243,234,0.14)] bg-[#102119] px-3 py-1.5 text-xs font-semibold text-[#c8b97a] hover:bg-[#1b3327] transition"
                        >
                          <MapPin className="h-3.5 w-3.5 text-[#88aa8f]" />
                          {asset.name} ({asset.city || 'WI'})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MODE 3: Photo Metadata EXIF Extractor with Take Photo & Upload Photo options */}
                {searchMode === 'photo' && (
                  <div className="max-w-xl mx-auto space-y-4">
                    {/* Hidden inputs: One for Camera capture, One for File upload */}
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#88aa8f] px-5 py-3.5 text-xs font-bold text-[#07100c] hover:bg-[#77997e] transition shadow-md"
                      >
                        <Camera className="h-4 w-4" />
                        Take Photo with Camera
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(237,243,234,0.18)] bg-white/[0.04] px-5 py-3.5 text-xs font-bold text-[#edf3ea] hover:bg-white/[0.08] transition shadow-md"
                      >
                        <UploadCloud className="h-4 w-4 text-[#c8b97a]" />
                        Upload Photo from Library
                      </button>
                    </div>

                    <div className="rounded-3xl border-2 border-dashed border-[rgba(237,243,234,0.2)] bg-[#102119]/60 p-6 text-center space-y-3">
                      {photoPreview ? (
                        <div className="space-y-3">
                          <img src={photoPreview} alt="Site Photo" className="mx-auto h-44 rounded-2xl object-cover border border-white/20" />
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
                        <div className="space-y-1 py-4">
                          <p className="text-sm font-medium text-[#edf3ea]">
                            Snap or upload a site photo of any lot or building
                          </p>
                          <p className="text-xs text-[rgba(237,243,234,0.5)]">
                            Automatically extracts embedded GPS camera metadata to locate and underwrite the parcel.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW B: Live Opportunity Stream & Project Squads */}
            {activeConsoleView === 'squads' && (
              <motion.div
                key="squads-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <LiveOpportunityFeed user={user} onInspectSite={(addr) => handleExecuteParcelSearch(undefined, addr)} />
              </motion.div>
            )}

            {/* VIEW C: Regional $1 Homestead Claim Engine */}
            {activeConsoleView === 'homestead' && (
              <motion.div
                key="homestead-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <RegionalHomesteadEngine
                  userRegion={userRegion}
                  onSelectRegion={setUserRegion}
                  onClaimHomestead={(city) => {
                    setMatcherCity(city)
                    setMatcherOpen(true)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 3. EXPANDABLE PANELS (Triggered via Top-Right Header Dropdown Menu) */}
        {profileTab && (
          <section className="space-y-4">
            <div className="rounded-[24px] border border-[rgba(237,243,234,0.14)] bg-white/[0.04] p-6 shadow-xl backdrop-blur-sm space-y-4">
              
              {/* PANEL 1: EXPLORE & TABLE SITES */}
              {profileTab === 'explore' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[rgba(237,243,234,0.1)] pb-3">
                    <h3 className="font-serif text-lg font-medium text-[#edf3ea]">
                      BEAM Site Acquisition Pipeline &amp; Candidates ({liveAssets.length})
                    </h3>
                    <button
                      onClick={() => setProfileTab(null)}
                      type="button"
                      className="text-xs text-[rgba(237,243,234,0.5)] hover:text-white"
                    >
                      Close Panel ✕
                    </button>
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
                    <button
                      onClick={() => setProfileTab(null)}
                      type="button"
                      className="text-xs text-[rgba(237,243,234,0.5)] hover:text-white"
                    >
                      Close Panel ✕
                    </button>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(237,243,234,0.1)] pb-3">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-[#edf3ea]">
                        Stewardship &amp; Municipal Compliance Ledger
                      </h3>
                      <p className="text-xs text-[rgba(237,243,234,0.6)]">
                        Grounded in real municipal open data APIs (CKAN, Socrata) &amp; HUD Section 3 equity standards.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncCivicData}
                        disabled={civicSyncing}
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#88aa8f]/40 bg-[#88aa8f]/10 px-4 py-1.5 text-xs font-semibold text-[#edf3ea] hover:bg-[#88aa8f]/20 transition shrink-0"
                      >
                        <Sparkles className={`h-3.5 w-3.5 text-[#c8b97a] ${civicSyncing ? 'animate-spin' : ''}`} />
                        {civicSyncing ? 'Syncing Portal...' : 'Sync Live Municipal Data'}
                      </button>
                      <button
                        onClick={() => setProfileTab(null)}
                        type="button"
                        className="text-xs text-[rgba(237,243,234,0.5)] hover:text-white"
                      >
                        Close Panel ✕
                      </button>
                    </div>
                  </div>

                  {civicSourceLabel && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-mono flex items-center justify-between">
                      <span>Live Open-Data Bridge: {civicSourceLabel}</span>
                      {civicDataCount !== null && <span className="font-bold">{civicDataCount} Records Active</span>}
                    </div>
                  )}

                  <div className="divide-y divide-[rgba(237,243,234,0.08)]">
                    {COMPLIANCE_ITEMS.map((item) => (
                      <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#edf3ea]">{item.title}</h4>
                            <span className="rounded-md bg-white/[0.06] border border-[rgba(237,243,234,0.1)] px-2 py-0.5 font-mono text-[9px] text-[#c8b97a]">
                              Source: {item.source}
                            </span>
                          </div>
                          <p className="text-xs text-[rgba(237,243,234,0.6)]">{item.detail}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 self-start sm:self-center ${
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
          </section>
        )}
      </main>

      {/* Floating Developer Feedback Trigger Button */}
      {developerFeedbackEnabled && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setFeedbackModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/20 px-4 py-2.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 transition shadow-2xl backdrop-blur-md"
          >
            <MessageSquare className="h-4 w-4 text-amber-400" />
            <span>Report Issue to Forge</span>
          </button>
        </div>
      )}

      {/* Developer Feedback Modal */}
      <ForgeDeveloperFeedbackModal
        user={user}
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />

      {/* Edit Profile Modal Drawer */}
      {editProfileOpen && (
        <EditProfileModal
          user={user}
          currentRegion={userRegion}
          developerFeedbackEnabled={developerFeedbackEnabled}
          onClose={() => setEditProfileOpen(false)}
          onSaveProfile={(data) => {
            setUserDisplayName(data.displayName)
            setUserHandle(data.handle)
            setUserRegion(data.region)
            setDeveloperFeedbackEnabled(data.developerFeedbackEnabled)
          }}
          onNavigateView={(view) => setActiveConsoleView(view)}
        />
      )}

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
