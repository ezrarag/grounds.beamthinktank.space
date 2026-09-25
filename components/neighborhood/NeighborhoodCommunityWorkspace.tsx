'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
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
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, sanitizeForFirestore } from '@/lib/firebase'
import { parseExifLocation } from '@/lib/exif'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import type { ParcelResult } from '@/app/api/parcel/route'
import { ParcelIntelligenceWorkspaceModal } from '@/components/profile/ParcelIntelligenceWorkspaceModal'
import { ParcelErrorBoundary } from '@/components/ParcelErrorBoundary'

const InteractivePinMapCanvas = dynamic(
  () => import('@/components/profile/InteractivePinMapCanvas').then((mod) => mod.InteractivePinMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] w-full rounded-3xl bg-slate-900 animate-pulse border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-400">
        Loading Neighborhood Pin Map Canvas...
      </div>
    ),
  }
)

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

export function NeighborhoodCommunityWorkspace() {
  const { user } = usePortalAccessState()

  // Map & Parcel Search state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 43.0396, lng: -87.945 })
  const [searchInput, setSearchInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchedParcel, setSearchedParcel] = useState<ParcelResult | null>(null)
  const [searchNotice, setSearchNotice] = useState<string | null>(null)

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
    <div className="space-y-8">
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

      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-800 bg-[#091510] text-white p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Neighborhood Community Workspace
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Civic Parcel Intelligence • Role Nominations • Git-Style Business Plan Branching
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-mono font-bold text-emerald-300">
            Non-Monetary Community Portal
          </span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Search local properties, drop interactive map pins, upload geotagged site photos, nominate community members for key revitalization positions, and branch structural site business plans — without money collection.
        </p>
      </div>

      {/* SECTION 1: Address Search, Interactive Map Canvas & Photo EXIF Uploader */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-800" />
            <h2 className="text-lg font-bold text-[#0f172a]">
              Local Parcel Search &amp; Interactive Map Visualizer
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Socrata MPROP &amp; Regrid GIS API Connected
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
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search property address or TaxKey (e.g. 639 N 25th St, Milwaukee, WI)..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1e293b] px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm disabled:opacity-50"
            >
              <Search className="h-4 w-4 text-emerald-400" />
              <span>{searching ? 'Searching...' : 'Search Parcel'}</span>
            </button>

            <button
              onClick={() => cameraRef.current?.click()}
              disabled={photoParsing}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-sm"
              title="Take real-time photo on mobile with embedded EXIF GPS tags"
            >
              <Camera className="h-4 w-4 text-amber-700" />
              <span>{photoParsing ? 'Parsing EXIF...' : 'Take Photo'}</span>
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoParsing}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-900 hover:bg-sky-100 transition shadow-sm"
              title="Upload existing property photo from device gallery"
            >
              <UploadCloud className="h-4 w-4 text-sky-700" />
              <span>Upload Photo</span>
            </button>
          </div>
        </form>

        {searchNotice && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-2xl">
            {searchNotice}
          </p>
        )}

        {photoPreview && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img src={photoPreview} alt="Uploaded site preview" className="h-12 w-12 rounded-xl object-cover border" />
            <div className="text-xs font-mono text-slate-700 space-y-0.5">
              <span className="font-bold text-emerald-800 block">📸 Geotagged Site Photo Loaded</span>
              <span className="text-[11px] text-slate-500">Coordinates centered on map canvas below.</span>
            </div>
          </div>
        )}

        {/* Dynamic Interactive Pin Map Canvas */}
        <InteractivePinMapCanvas
          center={mapCenter}
          onCoordsChange={(coords) => {
            setMapCenter(coords)
          }}
          onInspectParcel={(coords) => {
            void handleExecuteSearch(undefined, coords)
          }}
          fullBleedMobile={false}
        />
      </div>

      {/* SECTION 2: Neighborhood Community Role Roster & Nominations */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-slate-800" />
              <h2 className="text-lg font-bold text-[#0f172a]">
                Neighborhood Community Role Roster &amp; Recommendations
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Browse positions and nominate qualified community neighbors or recommend yourself for revitalization leads.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 font-mono text-xs font-bold text-slate-700">
            {NEIGHBORHOOD_ROLES.length} Open Positions
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEIGHBORHOOD_ROLES.map((role) => {
            const Icon = role.icon
            return (
              <div
                key={role.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-slate-100/80 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${role.badgeColor}`}>
                      {role.category}
                    </span>
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0f172a]">{role.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{role.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setSelectedRole(role)}
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1e293b] py-2 text-xs font-semibold text-white hover:bg-slate-900 transition shadow-sm"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Nominate Candidate</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 3: Git-Style Business Plan Branching & Structural Feedback Engine */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-slate-800" />
              <h2 className="text-lg font-bold text-[#0f172a]">
                Git-Style Business Plan Branching &amp; Structural Feedback
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              View video &amp; slide structural elements and propose branched business plan modifications for local sites.
            </p>
          </div>
          <span className="rounded-full bg-slate-900 text-emerald-400 px-3 py-1 font-mono text-xs font-bold border border-slate-700">
            Git-Style Proposals
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {STRUCTURAL_BUSINESS_ELEMENTS.map((element) => (
            <div
              key={element.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <span className="rounded-full bg-slate-200 text-slate-800 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider">
                  {element.category}
                </span>
                <h3 className="text-sm font-bold text-[#0f172a]">{element.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{element.currentSummary}</p>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] font-mono text-amber-900">
                  💡 {element.videoSlideNote}
                </div>
              </div>

              <button
                onClick={() => setSelectedElement(element)}
                type="button"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-emerald-400 hover:bg-black transition shadow-sm"
              >
                <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
                <span>Branch Business Plan Proposal</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Community Role Nomination Form */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-md flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <span>Nominate Candidate for {selectedRole.title}</span>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                type="button"
                className="rounded-full p-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {nominationNotice && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center font-bold">
                {nominationNotice}
              </p>
            )}

            <form onSubmit={handleSubmitNomination} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Candidate Name / Self-Recommendation</label>
                <input
                  type="text"
                  required
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  placeholder="Full Candidate Name (e.g. Marcus Vance)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Candidate Contact (Email or Phone)</label>
                <input
                  type="text"
                  required
                  value={nomineeContact}
                  onChange={(e) => setNomineeContact(e.target.value)}
                  placeholder="email@example.com or (414) 555-0199"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Recommendation Notes &amp; Qualifications</label>
                <textarea
                  rows={3}
                  required
                  value={nominationReason}
                  onChange={(e) => setNominationReason(e.target.value)}
                  placeholder="Explain why this candidate is recommended for this revitalization position..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedRole(null)}
                  type="button"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNomination}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-md transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submittingNomination ? 'Submitting...' : 'Submit Candidate Nomination'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Git-Style Business Plan Branch Proposal Form */}
      {selectedElement && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-md flex items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <GitBranch className="h-5 w-5 text-emerald-600" />
                <span>Branch Proposal for &quot;{selectedElement.title}&quot;</span>
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                type="button"
                className="rounded-full p-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {branchNotice && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center font-bold">
                {branchNotice}
              </p>
            )}

            <form onSubmit={handleSubmitBranch} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Branch Identifier / Name</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder={`branch/${selectedElement.id}-artisan-hub`}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Proposed Structural Modification / Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={proposedChange}
                  onChange={(e) => setProposedChange(e.target.value)}
                  placeholder="Describe your branched business plan adjustment (e.g., expand ground floor timber workshop to include 2 additional soundproof rehearsal booths)..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Pro-Forma / Scope Adjustment (Optional)</label>
                <input
                  type="text"
                  value={proFormaAdjustment}
                  onChange={(e) => setProFormaAdjustment(e.target.value)}
                  placeholder="e.g. +$15,000 rehab estimate offset by +40 hrs sweat equity"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-slate-800 focus:outline-none font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedElement(null)}
                  type="button"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBranch}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-emerald-400 hover:bg-black shadow-md transition disabled:opacity-50"
                >
                  <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{submittingBranch ? 'Branching Proposal...' : 'Create Branched Business Plan Proposal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parcel Intelligence Workspace Modal (Triggered by Search/Pin selection) */}
      {searchedParcel && (
        <ParcelErrorBoundary onClose={() => setSearchedParcel(null)}>
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
