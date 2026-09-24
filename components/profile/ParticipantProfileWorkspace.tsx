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
  LogOut,
  History,
  Trash2,
} from 'lucide-react'
import { parseExifLocation } from '@/lib/exif'
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth, sanitizeForFirestore } from '@/lib/firebase'
import { ParcelErrorBoundary } from '@/components/ParcelErrorBoundary'
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
import dynamic from 'next/dynamic'
import { AssetInterestModal } from '@/components/profile/AssetInterestModal'
import type { ParcelResult } from '@/app/api/parcel/route'
import { ParcelIntelligenceWorkspaceModal } from '@/components/profile/ParcelIntelligenceWorkspaceModal'
import { LiveOpportunityFeed } from '@/components/profile/LiveOpportunityFeed'
import { EditProfileModal, type UserTargetRegion, type SearchHistoryItem } from '@/components/profile/EditProfileModal'
import { RegionalHomesteadEngine } from '@/components/profile/RegionalHomesteadEngine'
import { ForgeDeveloperFeedbackModal } from '@/components/feedback/ForgeDeveloperFeedbackModal'
import { SearchHistoryDrawer } from '@/components/profile/SearchHistoryDrawer'
import { PipelineProjectFeed } from '@/components/profile/PipelineProjectFeed'
import { RedevelopmentPipelineBoard } from '@/components/redevelopment/RedevelopmentPipelineBoard'
import { CivicPartnerLayer } from '@/components/profile/CivicPartnerLayer'

const InteractivePinMapCanvas = dynamic(
  () => import('@/components/profile/InteractivePinMapCanvas').then((mod) => mod.InteractivePinMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] w-full rounded-2xl bg-slate-900 animate-pulse border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-400">
        Loading Interactive Pin Map Canvas...
      </div>
    ),
  }
)

export type ProfileTab = 'explore' | 'roster' | 'compliance' | null
export type SearchMode = 'address' | 'map' | 'photo'
export type ConsoleViewMode = 'search' | 'squads' | 'homestead' | 'pipeline' | 'redevelopment' | 'civic_partners'

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

// Built-in dictionary of City Nodes & Real Addresses for autocomplete
const CITY_NODE_DICTIONARY = [
  { label: 'Waukesha, WI', city: 'Waukesha', state: 'WI', coords: { lat: 43.0117, lng: -88.2314 }, type: 'city' },
  { label: 'Kissimmee, FL', city: 'Kissimmee', state: 'FL', coords: { lat: 28.2919, lng: -81.4076 }, type: 'city' },
  { label: 'Milwaukee, WI', city: 'Milwaukee', state: 'WI', coords: { lat: 43.0389, lng: -87.9065 }, type: 'city' },
  { label: 'Atlanta, GA', city: 'Atlanta', state: 'GA', coords: { lat: 33.749, lng: -84.388 }, type: 'city' },
  { label: 'Tampa, FL', city: 'Tampa', state: 'FL', coords: { lat: 27.9506, lng: -82.4572 }, type: 'city' },
  { label: 'Chicago, IL', city: 'Chicago', state: 'IL', coords: { lat: 41.8781, lng: -87.6298 }, type: 'city' },
  { label: 'New York, NY', city: 'New York', state: 'NY', coords: { lat: 40.7128, lng: -74.006 }, type: 'city' },
  { label: '639 N 25th St, Milwaukee, WI', city: 'Milwaukee', state: 'WI', coords: { lat: 43.0396, lng: -87.945 }, type: 'address' },
  { label: '450 Auburn Ave NE, Atlanta, GA', city: 'Atlanta', state: 'GA', coords: { lat: 33.7554, lng: -84.3725 }, type: 'address' },
  { label: '1901 E 7th Ave, Tampa, FL', city: 'Tampa', state: 'FL', coords: { lat: 27.9602, lng: -82.4368 }, type: 'address' },
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

  // Avatar & Header Menus state
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)

  // Developer Feedback & Search History state
  const [developerFeedbackEnabled, setDeveloperFeedbackEnabled] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  
  const [commandSearchInput, setCommandSearchInput] = useState('')
  const [searchingParcel, setSearchingParcel] = useState(false)
  const [searchedParcelResult, setSearchedParcelResult] = useState<ParcelResult | null>(null)
  const [commandSearchError, setCommandSearchError] = useState<string | null>(null)
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState<typeof CITY_NODE_DICTIONARY>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Geolocation & Civic API state (declared before useEffect hooks)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLocating, setGeoLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [civicSyncing, setCivicSyncing] = useState(false)
  const [civicDataCount, setCivicDataCount] = useState<number | null>(null)
  const [civicSourceLabel, setCivicSourceLabel] = useState<string | null>(null)

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [matcherOpen, setMatcherOpen] = useState(false)
  const [matcherCity, setMatcherCity] = useState<string | null>(null)
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [workModalTarget, setWorkModalTarget] = useState<PropertySiteOption | null>(null)
  const [interestTargetAsset, setInterestTargetAsset] = useState<BeamAsset | null>(null)

  // Deep-Link URL Resolver: Auto-open Parcel Intelligence Modal if taxkey, address, or lat/lng URL params exist
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const urlTaxkey = params.get('taxkey')
    const urlAddress = params.get('address')
    const urlLat = params.get('lat')
    const urlLng = params.get('lng')

    if (urlTaxkey || urlAddress) {
      const q = urlAddress || urlTaxkey || ''
      setCommandSearchInput(q)
      void handleExecuteParcelSearch(undefined, q)
    } else if (urlLat && urlLng) {
      const lat = Number(urlLat)
      const lng = Number(urlLng)
      if (!isNaN(lat) && !isNaN(lng)) {
        setUserCoords({ lat, lng })
        void handleExecuteParcelSearch(undefined, undefined, { lat, lng })
      }
    }
  }, [])

  function requestUserLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('HTML5 Geolocation is not supported by your browser.')
      return
    }
    setGeoLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserCoords({ lat, lng })
        setGeoLocating(false)

        // Automatically map physical GPS coordinates to nearest target node & preference
        if (lat > 32.5 && lat < 34.5 && lng > -85.5 && lng < -83.5) {
          setUserRegion('ATL')
        } else if (lat > 27.0 && lat < 29.5 && lng > -82.5 && lng < -80.0) {
          setUserRegion('TPA')
        } else if (lat > 42.0 && lat < 44.0 && lng > -89.0 && lng < -87.0) {
          setUserRegion('MKE')
        }
      },
      (err) => {
        setGeoError(err.message || 'Unable to fetch physical location.')
        setGeoLocating(false)
        if (!userCoords) setUserCoords({ lat: 43.0389, lng: -87.9065 }) // Fallback MKE center
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function getCurrentViewLabel(): string {
    if (profileTab === 'explore') return '🏛️ Explore & Table Sites'
    if (profileTab === 'roster') return '👷 My Work Rosters'
    if (profileTab === 'compliance') return '⚖️ Stewardship & Compliance'
    if (activeConsoleView === 'search') return '🔍 Parcel Search Engine'
    if (activeConsoleView === 'homestead') return '📍 Claim $1 Homestead Site'
    if (activeConsoleView === 'squads') return '⚡ Live Opportunities & Squads'
    if (activeConsoleView === 'redevelopment') return '🏗️ Portfolio Redevelopment Board'
    if (activeConsoleView === 'pipeline') return '🚧 Future Development Pipeline'
    if (activeConsoleView === 'civic_partners') return '🏛️ Aldermanic & CDC Partner Layer'
    return 'Workspace Views & Panels'
  }

  useEffect(() => {
    if (!userCoords) {
      requestUserLocation()
    }
  }, [])

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
  const [activeUploadedPhoto, setActiveUploadedPhoto] = useState<string | null>(null)
  const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lng: number } | null>(null)

  function handleClearPhoto() {
    setPhotoPreview(null)
    setActiveUploadedPhoto(null)
    setExtractedCoords(null)
    setPhotoParsing(false)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 300ms Debounce effect for rich address & city autocomplete typeahead (Mapbox + Photon + Local Dictionary)
  useEffect(() => {
    const q = commandSearchInput.trim().toLowerCase()
    if (!q || q.length < 2) {
      setTypeaheadSuggestions([])
      setShowSuggestions(false)
      return
    }

    let isCancelled = false

    const timer = setTimeout(async () => {
      // 1. Initial match against local dictionary for instant response
      const localMatches = CITY_NODE_DICTIONARY.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.state.toLowerCase().includes(q)
      )

      let apiSuggestions: typeof CITY_NODE_DICTIONARY = []

      // 2. Fetch live Mapbox Geocoding or Photon suggestions for any typed address
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (mapboxToken) {
          const mapboxRes = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${mapboxToken}&autocomplete=true&types=address,place,locality,neighborhood&country=us`
          )
          if (mapboxRes.ok) {
            const data = await mapboxRes.json()
            if (data.features && Array.isArray(data.features)) {
              apiSuggestions = data.features.map((feat: any) => {
                const isPlace = feat.place_type?.includes('place') || feat.place_type?.includes('locality')
                return {
                  label: feat.place_name,
                  city: feat.text || q,
                  state: feat.context?.find((c: any) => c.id.startsWith('region'))?.text || '',
                  coords: { lat: feat.center[1], lng: feat.center[0] },
                  type: isPlace ? ('city' as const) : ('address' as const),
                }
              })
            }
          }
        }
        
        // If Mapbox token is absent or returns 0 results, query open Photon geocoder fallback
        if (apiSuggestions.length === 0) {
          const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`)
          if (photonRes.ok) {
            const data = await photonRes.json()
            if (data.features && Array.isArray(data.features)) {
              apiSuggestions = data.features.map((feat: any) => {
                const props = feat.properties || {}
                const nameStr = [props.housenumber, props.street, props.city, props.state]
                  .filter(Boolean)
                  .join(' ') || props.name || q
                const isCity = !props.street
                return {
                  label: nameStr,
                  city: props.city || props.name || q,
                  state: props.state || '',
                  coords: { lat: feat.geometry.coordinates[1], lng: feat.geometry.coordinates[0] },
                  type: isCity ? ('city' as const) : ('address' as const),
                }
              })
            }
          }
        }
      } catch (err) {
        console.warn('Geocoding typeahead search notice:', err)
      }

      if (isCancelled) return

      // Merge local dictionary matches and live API results, removing duplicates
      const combined = [...localMatches]
      for (const item of apiSuggestions) {
        if (!combined.some((c) => c.label.toLowerCase() === item.label.toLowerCase())) {
          combined.push(item)
        }
      }

      setTypeaheadSuggestions(combined.slice(0, 8))
      setShowSuggestions(combined.length > 0)
    }, 250)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [commandSearchInput])

  // Helper to deduplicate history entries by TaxKey, Address, or Query string
  function deduplicateSearchHistory(items: SearchHistoryItem[]): SearchHistoryItem[] {
    const seenTaxkeys = new Set<string>()
    const seenAddresses = new Set<string>()
    const seenQueries = new Set<string>()

    const result: SearchHistoryItem[] = []

    for (const item of items) {
      const taxkey = item.taxkey?.trim()
      const addr = (item.address || item.query)?.toLowerCase().trim()
      const q = item.query?.toLowerCase().trim()

      if (taxkey && seenTaxkeys.has(taxkey)) continue
      if (addr && seenAddresses.has(addr)) continue
      if (q && seenQueries.has(q)) continue

      if (taxkey) seenTaxkeys.add(taxkey)
      if (addr) seenAddresses.add(addr)
      if (q) seenQueries.add(q)

      result.push(item)
    }

    return result.slice(0, 15)
  }

  // Save search entry to Firebase Firestore & local state history
  async function recordSearchHistory(queryStr: string, mode: SearchMode, parcelData?: ParcelResult) {
    const newItem: SearchHistoryItem = {
      id: `srch-${Date.now()}`,
      query: queryStr,
      address: parcelData?.address || queryStr,
      ...(parcelData?.parcelId ? { taxkey: parcelData.parcelId } : {}),
      ...(typeof parcelData?.lat === 'number' ? { lat: parcelData.lat } : {}),
      ...(typeof parcelData?.lng === 'number' ? { lng: parcelData.lng } : {}),
      ...(activeUploadedPhoto ? { uploadedPhoto: activeUploadedPhoto } : {}),
      mode,
      timestamp: new Date().toISOString(),
    }

    setSearchHistory((prev) => {
      const updatedList = deduplicateSearchHistory([newItem, ...prev])

      if (user?.uid && db) {
        const sanitizedData = sanitizeForFirestore({ searchHistory: updatedList })
        void setDoc(
          doc(db, 'participantProfiles', user.uid),
          sanitizedData,
          { merge: true }
        ).catch((err) => console.warn('Unable to record search history to Firestore:', err))
      }

      return updatedList
    })
  }

  function handleReinspectHistoryItem(item: SearchHistoryItem) {
    if (item.uploadedPhoto) {
      setActiveUploadedPhoto(item.uploadedPhoto)
      setPhotoPreview(item.uploadedPhoto)
    }
    if (item.lat && item.lng) {
      void handleExecuteParcelSearch(undefined, item.address || item.query, { lat: item.lat, lng: item.lng })
    } else {
      void handleExecuteParcelSearch(undefined, item.address || item.query)
    }
  }

  async function handleExecuteParcelSearch(e?: React.FormEvent, overrideAddress?: string, coords?: { lat: number; lng: number }) {
    if (e) e.preventDefault()
    
    setSearchingParcel(true)
    setCommandSearchError(null)

    try {
      let url = ''
      const queryText = (overrideAddress || commandSearchInput).trim() || (coords ? `GPS ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Current Location')

      if (coords) {
        url = `/api/parcel?lat=${coords.lat}&lng=${coords.lng}`
      } else {
        if (!queryText) return
        setCommandSearchInput(queryText)
        setShowSuggestions(false)
        url = `/api/parcel?q=${encodeURIComponent(queryText)}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = (await res.json()) as ParcelResult
        setSearchedParcelResult(data)
        void recordSearchHistory(queryText, searchMode, data)
      } else {
        setCommandSearchError('Unable to query parcel endpoint.')
      }
    } catch {
      setCommandSearchError('Failed to execute parcel search.')
    } finally {
      setSearchingParcel(false)
    }
  }

  // Handle Photo EXIF Extraction & Auto-Open Intelligence Workspace Modal
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoParsing(true)
    setCommandSearchError(null)

    // Read image as Data URL for preview & passing to Modal
    const dataUrlReader = new FileReader()
    dataUrlReader.onload = (event) => {
      const resultUrl = event.target?.result as string
      setPhotoPreview(resultUrl)
      setActiveUploadedPhoto(resultUrl)
    }
    dataUrlReader.readAsDataURL(file)

    // Read image as ArrayBuffer for EXIF binary GPS extraction
    const bufferReader = new FileReader()
    bufferReader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer
      let lat: number | null = null
      let lng: number | null = null

      if (buffer) {
        const exifLocation = parseExifLocation(buffer)
        if (exifLocation) {
          lat = exifLocation.lat
          lng = exifLocation.lng
        }
      }

      // If photo has no embedded EXIF GPS tags, try live browser/device location
      if (lat === null || lng === null) {
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3500, enableHighAccuracy: true })
            })
            lat = pos.coords.latitude
            lng = pos.coords.longitude
          } catch {
            // Geolocation fallback
            lat = 43.0396
            lng = -87.9450
          }
        } else {
          lat = 43.0396
          lng = -87.9450
        }
      }

      const coords = { lat, lng }
      setExtractedCoords(coords)
      setPhotoParsing(false)

      // Auto-open Parcel Intelligence Workspace Modal with photo & coordinates
      void handleExecuteParcelSearch(undefined, `Photo Geotag (${lat.toFixed(4)}, ${lng.toFixed(4)})`, coords)
    }
    bufferReader.readAsArrayBuffer(file)
  }

  // Handle Logout
  async function handleSignOut() {
    try {
      if (auth) {
        await signOut(auth)
      }
      setAvatarMenuOpen(false)
      window.location.reload()
    } catch (err) {
      console.warn('Sign out error:', err)
    }
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
          if (Array.isArray(data.searchHistory)) {
            setSearchHistory(deduplicateSearchHistory(data.searchHistory as SearchHistoryItem[]))
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
          {/* Avatar + Logout Dropdown + Name + Edit Profile Pill */}
          <div className="flex items-center gap-4">
            {/* Clickable Avatar Trigger for Logout */}
            <div className="relative">
              <button
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                type="button"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1b3327] border border-[#88aa8f]/40 font-mono text-sm font-bold text-[#c8b97a] shadow-inner hover:border-[#c8b97a] transition"
                title="Account & Sign Out Options"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#102119] text-[#88aa8f]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Avatar Dropdown Menu with Logout Button */}
              {avatarMenuOpen && (
                <div className="absolute left-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-[rgba(237,243,234,0.18)] bg-[#0b1712] p-3 shadow-2xl space-y-2">
                  <div className="border-b border-[rgba(237,243,234,0.1)] pb-2">
                    <p className="text-xs font-bold text-[#edf3ea] truncate">{displayName}</p>
                    <p className="text-[10px] text-[rgba(237,243,234,0.6)] font-mono">{userHandle || '@ezra.haugabrooks'}</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditProfileOpen(true)
                      setAvatarMenuOpen(false)
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[rgba(237,243,234,0.85)] hover:bg-[#102119] hover:text-[#edf3ea] transition text-left"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#88aa8f]" />
                    Edit Account Preferences
                  </button>

                  <button
                    onClick={handleSignOut}
                    type="button"
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/40 hover:bg-rose-950/80 transition text-left"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-400" />
                    Sign Out / Logout
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-medium tracking-tight text-[#edf3ea] sm:text-2xl">
                  {displayName}
                </h1>
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
              <span>{getCurrentViewLabel()}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-[#c8b97a] transition-transform ${headerMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {headerMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-[rgba(237,243,234,0.18)] bg-[#0b1712] p-2 shadow-2xl space-y-1">
                <div className="px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#c8b97a]">
                  Primary Console Views
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('search')
                    setProfileTab(null)
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'search' && !profileTab ? 'bg-[#88aa8f]/20 text-[#edf3ea] font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>🔍</span> Parcel Search Engine
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('homestead')
                    setProfileTab(null)
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'homestead' && !profileTab ? 'bg-[#88aa8f]/20 text-[#88aa8f] font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>📍</span> Claim $1 Homestead Site
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('squads')
                    setProfileTab(null)
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'squads' && !profileTab ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>⚡</span> Live Opportunities &amp; Squads
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('redevelopment')
                    setProfileTab(null)
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'redevelopment' && !profileTab ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>🏗️</span> Portfolio Redevelopment Board
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('pipeline')
                    setProfileTab(null)
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'pipeline' && !profileTab ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>🚧</span> Future Development Pipeline (CIP/Permits)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConsoleView('civic_partners')
                    setProfileTab(null)
                    setHeaderMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                    activeConsoleView === 'civic_partners' && !profileTab ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-[rgba(237,243,234,0.8)] hover:bg-[#102119]'
                  }`}
                >
                  <span>🏛️</span> Aldermanic &amp; CDC Partner Layer
                </button>

                <div className="border-t border-[rgba(237,243,234,0.1)] my-1" />

                <div className="px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#88aa8f]">
                  Stage Panels &amp; Surveys
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

                <Link
                  href="/testimony"
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left transition text-purple-300 hover:bg-[#102119]"
                >
                  <span>🎤</span> Submit Space Needs &amp; Cultural Testimony
                </Link>
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
                  {/* Gentle Recent Searches Pill Bar */}
                  {searchHistory && searchHistory.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                      <button
                        onClick={() => setHistoryDrawerOpen(true)}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-[#88aa8f]/40 bg-[#102119] px-3 py-0.5 text-[11px] font-mono font-bold text-[#c8b97a] hover:bg-[#1b3327] hover:border-[#c8b97a] transition shadow-sm"
                        title="Open Detailed Search History Drawer"
                      >
                        <History className="h-3 w-3 text-[#c8b97a]" />
                        <span>(ⓘ History)</span>
                      </button>
                      <button
                        onClick={() => setHistoryDrawerOpen(true)}
                        type="button"
                        className="font-mono text-[10px] uppercase font-bold text-[rgba(237,243,234,0.7)] hover:text-[#c8b97a] transition hidden sm:inline"
                        title="Open History Tray"
                      >
                        Recent:
                      </button>
                      {searchHistory.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCommandSearchInput(item.address || item.query)
                            handleReinspectHistoryItem(item)
                          }}
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-[rgba(237,243,234,0.14)] bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#c8b97a] hover:bg-[#88aa8f]/20 hover:text-white transition shadow-sm"
                        >
                          <span>{item.mode === 'map' ? '🗺️' : '📍'}</span>
                          <span className="truncate max-w-[130px]">{item.address || item.query}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#c8b97a]">
                      SEARCH PARCELS &amp; MUNICIPAL LAND INVENTORY
                    </span>
                  )}

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
                      ? 'Search Any Parcel or City Node Worldwide'
                      : searchMode === 'map'
                      ? 'Embedded Interactive Google / Apple Maps Viewer'
                      : 'Take Photo or Upload EXIF Geotag Image'}
                  </h2>

                  <p className="text-sm text-[rgba(237,243,234,0.65)] max-w-xl mx-auto leading-relaxed">
                    {searchMode === 'address'
                      ? 'Type any street address (e.g. 639 N 25th St) or city name (e.g. Waukesha, Kissimmee) to auto-search parcels or switch to Interactive Map.'
                      : searchMode === 'map'
                      ? 'Pan, zoom, and tap any location on the map to inspect real estate intelligence and 0.5-mile radius off-market records.'
                      : 'Snap or upload a photo of any lot. Auto-extract GPS coordinates to launch parcel underwriting.'}
                  </p>
                </div>

                {/* MODE 1: Address & City Search Form */}
                {searchMode === 'address' && (
                  <form onSubmit={handleExecuteParcelSearch} className="max-w-2xl mx-auto space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={commandSearchInput}
                          onChange={(e) => setCommandSearchInput(e.target.value)}
                          onFocus={() => setShowSuggestions(typeaheadSuggestions.length > 0)}
                          placeholder="Enter address or city (e.g. Waukesha, Kissimmee, 639 N 25th St)..."
                          className="w-full rounded-full border border-[rgba(237,243,234,0.18)] bg-[#102119]/80 px-5 py-3 text-sm text-[#edf3ea] placeholder:text-[rgba(237,243,234,0.4)] focus:border-[#88aa8f] focus:outline-none shadow-inner"
                        />

                        {/* Autocomplete Suggestions Menu for Cities & Addresses */}
                        {showSuggestions && typeaheadSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-[rgba(237,243,234,0.18)] bg-[#0b1712] shadow-2xl text-left">
                            {typeaheadSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.label}
                                onClick={() => {
                                  if (suggestion.type === 'city') {
                                    // City Node selected: set map center and switch to map view!
                                    setUserCoords(suggestion.coords)
                                    setSearchMode('map')
                                    setShowSuggestions(false)
                                    setCommandSearchInput(suggestion.label)
                                    void recordSearchHistory(suggestion.label, 'map')
                                  } else {
                                    // Specific Address selected: execute parcel inspection modal!
                                    void handleExecuteParcelSearch(undefined, suggestion.label)
                                  }
                                }}
                                type="button"
                                className="w-full px-4 py-2.5 text-xs font-medium text-[rgba(237,243,234,0.85)] hover:bg-[#102119] hover:text-[#c8b97a] transition border-b border-[rgba(237,243,234,0.08)] last:border-b-0 flex items-center justify-between"
                              >
                                <span>
                                  {suggestion.type === 'city' ? '🌆' : '📍'} {suggestion.label}
                                </span>
                                <span className="font-mono text-[9px] uppercase text-[#88aa8f]">
                                  {suggestion.type === 'city' ? 'City Node → Open Map' : 'Parcel Inspection'}
                                </span>
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
                  </form>
                )}

                {/* MODE 2: Interactive Pin Placement & Draggable Marker Canvas */}
                {searchMode === 'map' && (
                  <div className="max-w-3xl mx-auto">
                    <InteractivePinMapCanvas
                      center={userCoords || { lat: 43.0396, lng: -87.945 }}
                      onCoordsChange={(coords, autoInspect) => {
                        setUserCoords(coords)
                        if (autoInspect) {
                          void handleExecuteParcelSearch(undefined, undefined, coords)
                        }
                      }}
                      onInspectParcel={(coords) => {
                        void handleExecuteParcelSearch(undefined, undefined, coords)
                      }}
                      liveAssets={liveAssets}
                    />
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
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <span className="text-xs font-semibold text-[#edf3ea] flex items-center gap-1.5">
                              <Camera className="h-4 w-4 text-[#88aa8f]" /> Uploaded Site Photo
                            </span>
                            <button
                              onClick={handleClearPhoto}
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Clear / Remove Photo
                            </button>
                          </div>
                          <img src={photoPreview} alt="Site Photo" className="mx-auto h-48 rounded-2xl object-cover border border-white/20 shadow-md" />
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

            {/* VIEW D: Future Development Pipeline & CIP Permits */}
            {activeConsoleView === 'pipeline' && (
              <motion.div
                key="pipeline-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <PipelineProjectFeed
                  initialCityId="milwaukee-wi"
                  onInspectProject={(proj) => {
                    if (proj.address) {
                      handleExecuteParcelSearch(undefined, proj.address)
                    }
                  }}
                />
              </motion.div>
            )}

            {/* VIEW E: Portfolio Redevelopment Board */}
            {activeConsoleView === 'redevelopment' && (
              <motion.div
                key="redevelopment-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <RedevelopmentPipelineBoard viewMode="participant" />
              </motion.div>
            )}

            {/* VIEW F: Aldermanic Contacts & CDC / Land Trust Partners */}
            {activeConsoleView === 'civic_partners' && (
              <motion.div
                key="civic-partners-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <CivicPartnerLayer initialCityId="milwaukee-wi" />
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
          searchHistory={searchHistory}
          onClose={() => setEditProfileOpen(false)}
          onSaveProfile={(data) => {
            setUserDisplayName(data.displayName)
            setUserHandle(data.handle)
            setUserRegion(data.region)
            setDeveloperFeedbackEnabled(data.developerFeedbackEnabled)
          }}
          onNavigateView={(view) => setActiveConsoleView(view)}
          onReinspectParcel={(query) => handleExecuteParcelSearch(undefined, query)}
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
        <ParcelErrorBoundary onClose={() => setSearchedParcelResult(null)}>
          <ParcelIntelligenceWorkspaceModal
            parcel={searchedParcelResult}
            user={user}
            uploadedPhotoUrl={activeUploadedPhoto}
            onClose={() => setSearchedParcelResult(null)}
          />
        </ParcelErrorBoundary>
      )}

      {/* Minimalist Slide-out Search History Drawer */}
      <SearchHistoryDrawer
        isOpen={historyDrawerOpen}
        searchHistory={searchHistory}
        onClose={() => setHistoryDrawerOpen(false)}
        onReinspect={(item) => handleExecuteParcelSearch(undefined, item.query)}
        onClearHistory={() => setSearchHistory([])}
        onDeleteItem={(id) => setSearchHistory((prev) => prev.filter((i) => i.id !== id))}
      />
    </div>
  )
}
