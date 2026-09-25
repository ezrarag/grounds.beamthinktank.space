'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Camera,
  UploadCloud,
  HardHat,
  GitBranch,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
  FileSpreadsheet,
  UserCheck,
  Compass,
  ShieldCheck,
  Building2,
  X,
  Hammer,
  Wrench,
  Music,
  ArrowUpRight,
  Home,
  LogIn,
  LogOut,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth, sanitizeForFirestore, signOutUser } from '@/lib/firebase'
import { parseExifLocation } from '@/lib/exif'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import type { ParcelResult } from '@/app/api/parcel/route'
import { ParcelIntelligenceWorkspaceModal } from '@/components/profile/ParcelIntelligenceWorkspaceModal'
import { ParcelErrorBoundary } from '@/components/ParcelErrorBoundary'

export interface NeighborhoodRole {
  id: string
  title: string
  category: string
  description: string
  icon: typeof HardHat
  badgeColor: string
}

export const NEIGHBORHOOD_ROLES: NeighborhoodRole[] = [
  {
    id: 'gc-site-inspector',
    title: 'General Contractor Site Inspector',
    category: 'Construction & Feasibility',
    description: 'Walk property sites, inspect framing/roof integrity, and provide rehab cost estimates.',
    icon: HardHat,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'underwriter-analyst',
    title: 'Financial Underwriter & Pro-Forma Analyst',
    category: 'Capital & Finance',
    description: 'Review MPROP municipal tax data, sweat-equity offsets, and HUD grant stacking.',
    icon: FileSpreadsheet,
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  {
    id: 'site-steward-safety',
    title: 'Neighborhood Site Steward & Warden',
    category: 'Property Stewardship',
    description: 'Conduct security walks, coordinate lot clearing, and manage site access keys.',
    icon: ShieldCheck,
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'master-plumber-mentor',
    title: 'Master Mechanical & Plumbing Mentor',
    category: 'Skilled Trades',
    description: 'Guide plumbing rough-ins, water line connections, and resident apprenticeship.',
    icon: Wrench,
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'luthier-woodworker',
    title: 'Luthier & Resonant Woodworker',
    category: 'Acoustics & Craft',
    description: 'Custom timber acoustic panels, instrument repair benches, and millwork.',
    icon: Sparkles,
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'aldermanic-cdc-liaison',
    title: 'Aldermanic & CDC Land Trust Liaison',
    category: 'Civic Partnerships',
    description: 'Coordinate 99-year ground lease agreements and municipal zoning overlay approvals.',
    icon: UserCheck,
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
]

export interface BusinessPlanStructuralElement {
  id: string
  title: string
  category: string
  currentSummary: string
  videoSlideNote: string
}

export const STRUCTURAL_BUSINESS_ELEMENTS: BusinessPlanStructuralElement[] = [
  {
    id: '99-yr-ground-lease',
    title: '99-Year CDC & Land Trust Ground Lease Model',
    category: 'Legal Structure',
    currentSummary: 'Ensures permanent co-ownership, preventing predatory flips while guaranteeing 99-year affordability.',
    videoSlideNote: 'Referenced in Slide 4: Land trust holds fee simple; cohort holds 99-year leasehold title.',
  },
  {
    id: 'sweat-equity-offset',
    title: 'Sweat-Equity Rehabilitation Wage Credit',
    category: 'Financial Model',
    currentSummary: 'Residents earn $30/hr sweat-equity credits (up to $2,160) applied directly as down-payment equity.',
    videoSlideNote: 'Referenced in Video Segment 2: Labor hours offset cash down-payment requirements.',
  },
  {
    id: 'acoustic-timber-scope',
    title: 'Mixed-Use Acoustic & Fine Woodworking Hub',
    category: 'Architecture & Layout',
    currentSummary: 'Ground floor soundproof studio & timber workshop with upper-floor co-housing residential suites.',
    videoSlideNote: 'Referenced in Slide 7: Dual-income revenue model from rehearsal rentals & resident suites.',
  },
]

export type NeighborhoodTab = 'search' | 'roles' | 'branches'

export function NeighborhoodCommunityWorkspace() {
  const { user } = usePortalAccessState()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<NeighborhoodTab>('search')
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Map & Parcel Search state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 43.0396, lng: -87.945 })
  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchedParcel, setSearchedParcel] = useState<ParcelResult | null>(null)
  const [searchNotice, setSearchNotice] = useState<string | null>(null)
  const [parcelModalOpen, setParcelModalOpen] = useState(false)

  // Photo EXIF parsing state
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoParsing, setPhotoParsing] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Role Nomination Modal state
  const [selectedRole, setSelectedRole] = useState<NeighborhoodRole | null>(null)
  const [nomineeName, setNomineeName] = useState('')
  const [nomineeContact, setNomineeContact] = useState('')
  const [nominationReason, setNominationReason] = useState('')
  const [submittingNomination, setSubmittingNomination] = useState(false)
  const [nominationNotice, setNominationNotice] = useState<string | null>(null)

  // Business Plan Branching Modal state
  const [selectedElement, setSelectedElement] = useState<BusinessPlanStructuralElement | null>(null)
  const [branchName, setBranchName] = useState('')
  const [proposedChange, setProposedChange] = useState('')
  const [proFormaAdjustment, setProFormaAdjustment] = useState('')
  const [submittingBranch, setSubmittingBranch] = useState(false)
  const [branchNotice, setBranchNotice] = useState<string | null>(null)

  // Handle Logout
  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOutUser()
      router.push('/login')
    } catch (err) {
      console.error('Sign out error:', err)
      setIsSigningOut(false)
    }
  }

  // 1. Parcel Search Handler
  async function handleExecuteSearch(overrideQuery?: string, coords?: { lat: number; lng: number }) {
    setSearching(true)
    setSearchNotice(null)
    try {
      let url = ''
      const q = (overrideQuery || searchInput).trim()

      if (coords) {
        url = `/api/parcel?lat=${coords.lat}&lng=${coords.lng}`
      } else {
        if (!q) return
        url = `/api/parcel?q=${encodeURIComponent(q)}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = (await res.json()) as ParcelResult
        setSearchedParcel(data)
        setParcelModalOpen(true)
        if (data.lat && data.lng) {
          setMapCenter({ lat: data.lat, lng: data.lng })
        }
      } else {
        setSearchNotice('Unable to query parcel endpoint.')
      }
    } catch {
      setSearchNotice('Error executing parcel search.')
    } finally {
      setSearching(false)
    }
  }

  // 2. EXIF Photo Upload Handler
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoParsing(true)
    setSearchNotice(null)

    const dataUrlReader = new FileReader()
    dataUrlReader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
    }
    dataUrlReader.readAsDataURL(file)

    const bufferReader = new FileReader()
    bufferReader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer
      let lat: number | null = null
      let lng: number | null = null

      if (buffer) {
        const exif = parseExifLocation(buffer)
        if (exif) {
          lat = exif.lat
          lng = exif.lng
        }
      }

      if (lat === null || lng === null) {
        lat = mapCenter.lat
        lng = mapCenter.lng
      }

      setMapCenter({ lat, lng })
      setPhotoParsing(false)
      void handleExecuteSearch(undefined, { lat, lng })
    }
    bufferReader.readAsArrayBuffer(file)
  }

  // 3. Submit Community Role Nomination to Firestore
  async function handleSubmitNomination(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRole) return

    setSubmittingNomination(true)
    setNominationNotice(null)

    try {
      const payload = sanitizeForFirestore({
        roleId: selectedRole.id,
        roleTitle: selectedRole.title,
        category: selectedRole.category,
        nomineeName: nomineeName.trim(),
        nomineeContact: nomineeContact.trim(),
        nominationReason: nominationReason.trim(),
        submittedBy: {
          uid: user?.uid || 'community-guest',
          name: user?.displayName || 'Community Neighbor',
          email: user?.email || '',
        },
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
      })

      if (db) {
        await addDoc(collection(db, 'neighborhoodRoleNominations'), payload)
      }

      setNominationNotice(`🎉 Recommendation for ${selectedRole.title} submitted to the Community Board!`)
      setTimeout(() => {
        setSelectedRole(null)
        setNomineeName('')
        setNomineeContact('')
        setNominationReason('')
        setNominationNotice(null)
      }, 3000)
    } catch (err) {
      setNominationNotice(err instanceof Error ? err.message : 'Unable to submit nomination.')
    } finally {
      setSubmittingNomination(false)
    }
  }

  // 4. Submit Git-Style Business Plan Branch to Firestore
  async function handleSubmitBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedElement) return

    setSubmittingBranch(true)
    setBranchNotice(null)

    try {
      const branchId = `branch-${selectedElement.id}-${Date.now().toString(36)}`
      const payload = sanitizeForFirestore({
        branchId,
        elementId: selectedElement.id,
        elementTitle: selectedElement.title,
        branchName: branchName.trim() || `branch/${selectedElement.id}-proposal`,
        proposedChange: proposedChange.trim(),
        proFormaAdjustment: proFormaAdjustment.trim(),
        submittedBy: {
          uid: user?.uid || 'community-guest',
          name: user?.displayName || 'Community Neighbor',
          email: user?.email || '',
        },
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
      })

      if (db) {
        await addDoc(collection(db, 'businessPlanBranches'), payload)
      }

      setBranchNotice(`🌿 Business Plan Branch "${branchName || branchId}" created & posted for community review!`)
      setTimeout(() => {
        setSelectedElement(null)
        setBranchName('')
        setProposedChange('')
        setProFormaAdjustment('')
        setBranchNotice(null)
      }, 3000)
    } catch (err) {
      setBranchNotice(err instanceof Error ? err.message : 'Unable to submit business plan branch.')
    } finally {
      setSubmittingBranch(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 space-y-8">
      {/* Hidden File Inputs for Camera & Gallery */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* HEADER SECTION (Organized like Admin Console) */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-grounds-sand">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow text-xs uppercase font-mono text-[#88aa8f]">Neighborhood Community Console</p>
            <h1 className="mt-0.5 text-2xl font-semibold text-white sm:text-3xl">Community Revitalization &amp; Sourcing</h1>
            <p className="mt-1 text-xs text-white/50 font-mono">
              Signed in as: <span className="text-white/80">{user?.email || user?.displayName || 'Community Neighbor'}</span> (Non-Monetary Portal)
            </p>
          </div>
        </div>

        {/* Global Exit & Auth Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <Home className="h-3.5 w-3.5" />
            Public Home
          </Link>

          <Link
            href="/login?next=/portal/neighborhood"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <LogIn className="h-3.5 w-3.5" />
            Switch Account
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 font-mono text-xs text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
          >
            {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Sign Out
          </button>
        </div>
      </header>

      {/* CATEGORY CARDS GRID (Matching Admin Console CARDS Architecture) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => setActiveTab('search')}
          type="button"
          className={`text-left flex flex-col rounded-[1.5rem] border p-6 transition ${
            activeTab === 'search'
              ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg'
              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
          }`}
        >
          <div className="flex items-center justify-between">
            <Search className="h-6 w-6 text-emerald-400" />
            <ArrowUpRight className="h-4 w-4 text-white/40" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">1. Parcel Search &amp; EXIF Intake</h2>
          <p className="mt-1.5 text-xs leading-6 text-white/60">
            Query municipal Socrata tax keys, street addresses, or upload site camera EXIF geotags.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          type="button"
          className={`text-left flex flex-col rounded-[1.5rem] border p-6 transition ${
            activeTab === 'roles'
              ? 'border-amber-400/50 bg-amber-500/10 shadow-lg'
              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
          }`}
        >
          <div className="flex items-center justify-between">
            <HardHat className="h-6 w-6 text-amber-400" />
            <ArrowUpRight className="h-4 w-4 text-white/40" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">2. Community Role Roster</h2>
          <p className="mt-1.5 text-xs leading-6 text-white/60">
            Browse 6 revitalization positions and nominate qualified community neighbors or yourself.
          </p>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          type="button"
          className={`text-left flex flex-col rounded-[1.5rem] border p-6 transition ${
            activeTab === 'branches'
              ? 'border-purple-400/50 bg-purple-500/10 shadow-lg'
              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
          }`}
        >
          <div className="flex items-center justify-between">
            <GitBranch className="h-6 w-6 text-purple-400" />
            <ArrowUpRight className="h-4 w-4 text-white/40" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">3. Business Plan Branching</h2>
          <p className="mt-1.5 text-xs leading-6 text-white/60">
            Propose Git-style structural branches &amp; pro-forma edits for 99-year land trust ground leases.
          </p>
        </button>
      </div>

      {/* ISOLATED ACTIVE WORKSPACE PANELS */}

      {/* TAB 1: PARCEL SEARCH & CIVIC INTAKE (ISOLATED MAP OPTIONS) */}
      {activeTab === 'search' && (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Municipal Parcel Search &amp; Site Geotags
                </h2>
                <p className="text-xs text-white/50 font-mono">
                  Socrata MPROP &amp; Regrid Civic API Connected • Isolated Map Viewers
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-mono text-xs text-emerald-300">
              Civic API Connected
            </span>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleExecuteSearch()
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search address or TaxKey (e.g. 639 N 25th St, Milwaukee, WI)..."
                className="w-full rounded-full border border-white/15 bg-[#102119] pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none shadow-inner"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={searching}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold text-black hover:bg-emerald-300 transition shadow-md disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>{searching ? 'Querying...' : 'Search Parcel'}</span>
              </button>

              <button
                onClick={() => cameraRef.current?.click()}
                disabled={photoParsing}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition shadow-sm"
                title="Take photo on mobile device with EXIF GPS location"
              >
                <Camera className="h-4 w-4 text-amber-400" />
                <span>{photoParsing ? 'Parsing...' : 'Camera EXIF'}</span>
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                disabled={photoParsing}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition shadow-sm"
                title="Upload image file from device gallery"
              >
                <UploadCloud className="h-4 w-4 text-sky-400" />
                <span>Upload Photo</span>
              </button>
            </div>
          </form>

          {searchNotice && (
            <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 p-3 rounded-2xl">
              {searchNotice}
            </p>
          )}

          {photoPreview && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <img src={photoPreview} alt="Uploaded site preview" className="h-12 w-12 rounded-xl object-cover border border-white/20" />
              <div className="text-xs font-mono text-white/80 space-y-0.5">
                <span className="font-bold text-emerald-400 block">📸 Geotagged Site Photo Loaded</span>
                <span className="text-[11px] text-white/50">
                  Extracted Coordinates: {mapCenter.lat.toFixed(4)}° N, {mapCenter.lng.toFixed(4)}° W
                </span>
              </div>
            </div>
          )}

          {/* ISOLATED MAP & INSPECTION OPTIONS (Clean fallback card replacing heavy embedded canvas) */}
          <div className="rounded-2xl border border-white/10 bg-[#091510] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span className="font-mono text-xs font-bold text-white">
                  Active Coordinates: {mapCenter.lat.toFixed(4)}° N, {mapCenter.lng.toFixed(4)}° W
                </span>
              </div>
              <span className="font-mono text-[10px] text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Isolated Map Trigger
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  if (searchedParcel) {
                    setParcelModalOpen(true)
                  } else {
                    void handleExecuteSearch()
                  }
                }}
                type="button"
                className="flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>⚡ Inspect Full Parcel Intelligence Modal</span>
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </button>

              <a
                href={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=17`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-amber-400/40 bg-amber-500/10 p-3.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-amber-400" />
                  <span>🌐 Open in Google / Apple Maps</span>
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <p className="text-center font-mono text-[11px] text-white/50">
              💡 <strong>Tip:</strong> Enter an address above or upload a photo to auto-inspect zoning, assessed values, tax liens, and HUD labor credits.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: NEIGHBORHOOD ROLE ROSTER & RECOMMENDATIONS */}
      {activeTab === 'roles' && (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">
                  Neighborhood Community Role Roster &amp; Recommendations
                </h2>
              </div>
              <p className="text-xs text-white/60 mt-1">
                Browse positions and nominate qualified community neighbors or recommend yourself for revitalization leads.
              </p>
            </div>
            <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-3.5 py-1 font-mono text-xs font-bold text-amber-300">
              {NEIGHBORHOOD_ROLES.length} Open Positions
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NEIGHBORHOOD_ROLES.map((role) => {
              const Icon = role.icon
              return (
                <div
                  key={role.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#102119]/80 p-5 transition hover:border-amber-400/40 hover:bg-[#152a20] shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="font-mono text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                        {role.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-tight">{role.title}</h3>
                    <p className="text-xs text-white/65 leading-relaxed">{role.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRole(role)
                      setNominationNotice(null)
                    }}
                    type="button"
                    className="mt-4 w-full rounded-full bg-amber-400 px-4 py-2 font-mono text-xs font-bold text-black hover:bg-amber-300 transition shadow-md"
                  >
                    Nominate or Recommend Candidate →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STRUCTURAL BUSINESS PLAN BRANCHING */}
      {activeTab === 'branches' && (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">
                  Git-Style Structural Business Plan Branching
                </h2>
              </div>
              <p className="text-xs text-white/60 mt-1">
                Propose non-monetary adjustments to structural site elements, 99-year ground lease deeds, and sweat-equity pro-formas.
              </p>
            </div>
            <span className="rounded-full bg-purple-400/10 border border-purple-400/30 px-3.5 py-1 font-mono text-xs font-bold text-purple-300">
              Open Proposal Stage
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {STRUCTURAL_BUSINESS_ELEMENTS.map((element) => (
              <div
                key={element.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#102119]/80 p-5 space-y-4 hover:border-purple-400/40 transition"
              >
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-purple-300 bg-purple-400/10 px-2 py-0.5 rounded-md border border-purple-400/30 inline-block">
                    {element.category}
                  </span>
                  <h3 className="text-sm font-bold text-white">{element.title}</h3>
                  <p className="text-xs text-white/65 leading-relaxed">{element.currentSummary}</p>
                  <p className="text-[11px] text-amber-300/80 font-mono bg-amber-400/5 p-2 rounded-xl border border-amber-400/20">
                    💡 {element.videoSlideNote}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedElement(element)
                    setBranchName(`branch/${element.id}-proposal`)
                    setBranchNotice(null)
                  }}
                  type="button"
                  className="w-full rounded-full border border-purple-400/50 bg-purple-500/10 px-4 py-2 font-mono text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
                >
                  🌿 Branch This Business Plan Element →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: COMMUNITY ROLE NOMINATION MODAL */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#091510] p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Nominate Candidate: {selectedRole.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNomination} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-white/70">Candidate / Nominee Name</label>
                <input
                  type="text"
                  required
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  placeholder="e.g. Marcus Johnson or Self Recommendation"
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-white/70">Contact Info / Handle</label>
                <input
                  type="text"
                  required
                  value={nomineeContact}
                  onChange={(e) => setNomineeContact(e.target.value)}
                  placeholder="e.g. marcus@community.org or phone/handle"
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-white/70">Qualifications &amp; Recommendation Notes</label>
                <textarea
                  required
                  rows={3}
                  value={nominationReason}
                  onChange={(e) => setNominationReason(e.target.value)}
                  placeholder="Describe experience with local trades, site inspections, or community stewardship..."
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {nominationNotice && (
                <p className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-2xl">
                  {nominationNotice}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingNomination}
                  className="flex-1 rounded-full bg-amber-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition shadow-md disabled:opacity-50"
                >
                  {submittingNomination ? 'Submitting...' : 'Submit Recommendation'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BUSINESS PLAN BRANCHING PROPOSAL MODAL */}
      {selectedElement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#091510] p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Branch Business Plan: {selectedElement.title}</h3>
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-white/70">Git Branch Name</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. branch/99-yr-lease-tenant-rights"
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-white/70">Proposed Structural Change</label>
                <textarea
                  required
                  rows={3}
                  value={proposedChange}
                  onChange={(e) => setProposedChange(e.target.value)}
                  placeholder="Detail your proposed modification to the ground lease, acoustic paneling, or sweat credit rules..."
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-white/70">Pro-Forma Adjustment Note (Optional)</label>
                <input
                  type="text"
                  value={proFormaAdjustment}
                  onChange={(e) => setProFormaAdjustment(e.target.value)}
                  placeholder="e.g. Increase sweat-equity limit from 72h to 100h per quarter"
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                />
              </div>

              {branchNotice && (
                <p className="text-xs text-purple-300 bg-purple-950/60 border border-purple-800/60 p-3 rounded-2xl">
                  {branchNotice}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingBranch}
                  className="flex-1 rounded-full bg-purple-400 px-5 py-2.5 text-xs font-bold text-black hover:bg-purple-300 transition shadow-md disabled:opacity-50"
                >
                  {submittingBranch ? 'Creating Branch...' : 'Submit Branch Proposal'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedElement(null)}
                  className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARCEL INTELLIGENCE WORKSPACE MODAL */}
      {searchedParcel && (
        <ParcelErrorBoundary fallbackTitle="Parcel Intelligence Workspace">
          <ParcelIntelligenceWorkspaceModal
            parcel={searchedParcel}
            user={user}
            uploadedPhotoUrl={photoPreview}
            onClose={() => setSearchedParcel(null)}
          />
        </ParcelErrorBoundary>
      )}
    </div>
  )
}
