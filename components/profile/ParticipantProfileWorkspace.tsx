'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Coins,
  ExternalLink,
  Hammer,
  HeartHandshake,
  Home,
  Layers,
  LifeBuoy,
  MapPin,
  Maximize2,
  Plus,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  ArrowUpRight,
  ChevronLeft,
  Filter,
} from 'lucide-react'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import { HousingPreferencesForm } from '@/components/profile/HousingPreferencesForm'
import { PathToDeedTracker } from '@/components/profile/PathToDeedTracker'
import { HousingSafetyNetCard } from '@/components/profile/HousingSafetyNetCard'
import { PropertyVisualizer } from '@/components/PropertyVisualizer'

interface PropertyPreviewItem {
  id: string
  name: string
  address: string
  city: string
  parcelId: string
  zoning: string
  essentialRepairCost: string
  status: string
  lat: number
  lng: number
  imageOverlay: string
}

const FEATURED_PROPERTIES: PropertyPreviewItem[] = [
  {
    id: 'prop-cumc',
    name: 'Central United Methodist Sanctuary',
    address: '639 N 25th St, Milwaukee, WI',
    city: 'Milwaukee',
    parcelId: '388-1204-000',
    zoning: 'RT4 Civic',
    essentialRepairCost: '$18,500',
    status: 'Active Cohort Intake',
    lat: 43.0396,
    lng: -87.945,
    imageOverlay: 'https://images.unsplash.com/photo-1548625361-185e7456d252?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prop-wells',
    name: 'Wells Street Civic Anchor',
    address: '800 W Wells St, Milwaukee, WI',
    city: 'Milwaukee',
    parcelId: '392-0501-100',
    zoning: 'C9A Commercial',
    essentialRepairCost: '$24,000',
    status: 'Design Phase',
    lat: 43.0408,
    lng: -87.922,
    imageOverlay: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prop-wisconsin',
    name: 'Wisconsin Ave Live/Work Studio',
    address: '814 W Wisconsin Ave, Milwaukee, WI',
    city: 'Milwaukee',
    parcelId: '392-0520-000',
    zoning: 'C9B Urban',
    essentialRepairCost: '$12,000',
    status: 'Sweat-Equity Eligible',
    lat: 43.0388,
    lng: -87.9225,
    imageOverlay: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
]

type ActiveTab = 'goals' | 'deed' | 'safety'

export function ParticipantProfileWorkspace() {
  const { user } = usePortalAccessState()
  const [activeTab, setActiveTab] = useState<ActiveTab>('goals')
  const [copiedBeacon, setCopiedBeacon] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyPreviewItem>(FEATURED_PROPERTIES[0])

  const displayName = user?.displayName || 'Oliver Bennet'
  const handle = `@${(user?.email ? user.email.split('@')[0] : 'oliver_bennet').toLowerCase()}`
  const disciplineBadge = 'Violinist • MYSO Alumni • Cohort Resident'
  const bioSnippet =
    'Musician & civic space steward focused on acoustic residency, live/work studio development, and sweat-equity housing access.'

  function handleShareBeacon() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedBeacon(true)
      setTimeout(() => setCopiedBeacon(false), 2500)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07100c] text-white selection:bg-[#88aa8f]/30">
      {/* Dynamic Cinematic Atmospheric Backdrop with Gradient Vignette */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-luminosity filter blur-[1px]"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07100c] via-[#07100c]/85 to-[#07100c]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(136,170,143,0.18),rgba(255,255,255,0))]" />
        {/* Subtle mesh background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header Navigation Trail */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-mono uppercase tracking-widest text-white/70 backdrop-blur-xl transition hover:border-[#88aa8f]/50 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              BEAM Grounds Portal
            </Link>
            <span className="text-white/30">/</span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#88aa8f]">
              Participant Workspace
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareBeacon}
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5 text-[#88aa8f]" />
              {copiedBeacon ? 'Beacon Copied!' : 'Share Profile Beacon'}
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#88aa8f]/40 bg-[#88aa8f]/10 px-4 py-1.5 text-xs font-medium text-[#88aa8f] transition hover:bg-[#88aa8f]/20 hover:text-white"
            >
              Account Portal
            </Link>
          </div>
        </div>

        {/* Desktop 2-Column Grid / Mobile Stack */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Floating Glassmorphic Profile Card (Desktop: 5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-white/20">
              {/* Card Ambient Glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#88aa8f]/10 blur-3xl" />

              {/* Profile Top Row: Avatar + Handle + Badge */}
              <div className="relative z-10 flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#88aa8f]/30 bg-[#88aa8f]/10 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#88aa8f]">
                      <ShieldCheck className="h-3 w-3" /> Verified Participant
                    </span>
                  </div>
                  <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {displayName}
                  </h1>
                  <p className="font-mono text-xs text-white/50">{handle}</p>
                </div>
              </div>

              {/* Discipline & Bio */}
              <div className="relative z-10 mt-4 space-y-2 border-t border-white/10 pt-4">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#88aa8f]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {disciplineBadge}
                </p>
                <p className="text-xs leading-relaxed text-white/75">{bioSnippet}</p>
              </div>

              {/* Key Metrics Row (Sweat Equity, Purchasing Power, Target Nodes) */}
              <div className="relative z-10 mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md">
                <div className="text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">Sweat Equity</p>
                  <p className="mt-1 text-lg font-extrabold text-white">72 <span className="text-xs font-normal text-[#88aa8f]">hrs</span></p>
                  <p className="text-[9px] text-white/40">$30/hr HUD match</p>
                </div>
                <div className="border-x border-white/10 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">Purchasing Power</p>
                  <p className="mt-1 text-lg font-extrabold text-[#88aa8f]">$2,160</p>
                  <p className="text-[9px] text-white/40">BEAM-backed proof</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">Target Nodes</p>
                  <p className="mt-1 text-lg font-extrabold text-white">2 <span className="text-xs font-normal text-[#88aa8f]">cities</span></p>
                  <p className="text-[9px] text-white/40">MKE • ATL</p>
                </div>
              </div>

              {/* Primary Action Pill Buttons */}
              <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('goals')}
                  type="button"
                  className="flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full border border-[#88aa8f]/40 bg-gradient-to-r from-[#88aa8f]/20 via-[#88aa8f]/10 to-transparent px-4 py-2.5 text-center text-xs font-semibold text-white shadow-lg transition hover:border-[#88aa8f] hover:bg-[#88aa8f]/30"
                >
                  Edit Housing Goals
                </button>
                <button
                  onClick={() => setActiveTab('deed')}
                  type="button"
                  className="flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-center text-xs font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                >
                  Path to Deed (180-Day)
                </button>
              </div>
            </div>

            {/* Property Map / Visualizer Featured Site Card */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#88aa8f]" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-white/90">
                    Selected Site Parcel Map
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                  {selectedProperty.city} Node
                </span>
              </div>

              <div className="h-48 overflow-hidden rounded-2xl border border-white/10">
                <PropertyVisualizer
                  address={selectedProperty.address}
                  propertyName={selectedProperty.name}
                  lat={selectedProperty.lat}
                  lng={selectedProperty.lng}
                  compact={true}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                <span>Parcel: <code className="font-mono text-[#88aa8f]">{selectedProperty.parcelId}</code></span>
                <span>Est. Repairs: <strong className="text-white">{selectedProperty.essentialRepairCost}</strong></span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Curated Carousel + Modular Glass Tabs (Desktop: 7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Curated Property & Cohort Preview Carousel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-xs uppercase tracking-widest text-[#88aa8f]">
                    Curated Property &amp; Cohort Preview
                  </h2>
                  <p className="text-xs text-white/60">
                    Active BEAM Grounds sites in your target residency nodes
                  </p>
                </div>
                <Link
                  href="/portal/properties"
                  className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[#88aa8f] hover:text-white"
                >
                  View All Properties <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Horizontal Scroll Carousel */}
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 pt-1">
                {FEATURED_PROPERTIES.map((prop) => {
                  const isSelected = prop.id === selectedProperty.id
                  return (
                    <button
                      key={prop.id}
                      onClick={() => setSelectedProperty(prop)}
                      type="button"
                      className={`group relative min-w-[260px] max-w-[280px] shrink-0 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-2xl transition-all duration-300 ${
                        isSelected
                          ? 'border-[#88aa8f] bg-black/60 shadow-[0_0_20px_rgba(136,170,143,0.25)]'
                          : 'border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/50'
                      }`}
                    >
                      {/* Image Thumbnail Overlay */}
                      <div className="relative h-28 w-full overflow-hidden rounded-xl">
                        <img
                          src={prop.imageOverlay}
                          alt={prop.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <span className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white backdrop-blur-md">
                          {prop.zoning}
                        </span>
                        <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-emerald-300">
                          {prop.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h4 className="line-clamp-1 text-sm font-semibold text-white group-hover:text-[#88aa8f]">
                          {prop.name}
                        </h4>
                        <p className="line-clamp-1 text-xs text-white/60">{prop.address}</p>
                        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] font-mono text-white/50">
                          <span>PARCEL {prop.parcelId}</span>
                          <span className="text-[#88aa8f]">{prop.essentialRepairCost}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modular Glass Tabs System */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-2xl">
              {/* Tab Navigation Header */}
              <div className="flex border-b border-white/10 bg-white/[0.02] p-2">
                <button
                  onClick={() => setActiveTab('goals')}
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-semibold transition-all ${
                    activeTab === 'goals'
                      ? 'border border-[#88aa8f]/40 bg-[#88aa8f]/15 text-white shadow-lg'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Home className="h-3.5 w-3.5 text-[#88aa8f]" />
                  <span>Housing &amp; Location Goals</span>
                </button>

                <button
                  onClick={() => setActiveTab('deed')}
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-semibold transition-all ${
                    activeTab === 'deed'
                      ? 'border border-[#88aa8f]/40 bg-[#88aa8f]/15 text-white shadow-lg'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Hammer className="h-3.5 w-3.5 text-[#88aa8f]" />
                  <span>Path to Deed (180-Day)</span>
                </button>

                <button
                  onClick={() => setActiveTab('safety')}
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-semibold transition-all ${
                    activeTab === 'safety'
                      ? 'border border-amber-500/40 bg-amber-500/15 text-amber-200 shadow-lg'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LifeBuoy className="h-3.5 w-3.5 text-amber-400" />
                  <span>Safety Net Intake</span>
                </button>
              </div>

              {/* Tab Panel Content */}
              <div className="p-6">
                {activeTab === 'goals' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Residency &amp; Location Preferences</h3>
                        <p className="text-xs text-white/60">
                          Select your target BEAM nodes, acoustic studio space specifications, and move-in timeline.
                        </p>
                      </div>
                    </div>
                    <HousingPreferencesForm />
                  </div>
                )}

                {activeTab === 'deed' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Sweat-Equity &amp; Municipal Compliance</h3>
                        <p className="text-xs text-white/60">
                          Track your 180-day essential repair countdown, logged labor valuation ($30/hr), and deed covenant status.
                        </p>
                      </div>
                    </div>
                    <PathToDeedTracker />
                  </div>
                )}

                {activeTab === 'safety' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-amber-300">Emergency Intake &amp; Housing Safety Net</h3>
                        <p className="text-xs text-white/60">
                          Rapid stabilization intake, IMPACT 2-1-1 coordination, and emergency cohort placement.
                        </p>
                      </div>
                    </div>
                    <HousingSafetyNetCard />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
