'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Coins,
  Sparkles,
  Lock,
  Globe,
  ArrowUpRight,
  HardHat,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react'
import type { RedevelopmentProjectBundle, ProjectStatus, LaborType } from '@/lib/laborTypes'
import { laborTypes } from '@/lib/laborTypes'

interface RedevelopmentPipelineBoardProps {
  viewMode?: 'admin' | 'participant'
  initialProjects?: RedevelopmentProjectBundle[]
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  feasibility: {
    label: 'Feasibility Scoping',
    bgClass: 'bg-amber-400/10',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-400/30',
  },
  'phase-1': {
    label: 'Phase 1 Active',
    bgClass: 'bg-sky-400/10',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-400/30',
  },
  active: {
    label: 'Active Redevelopment',
    bgClass: 'bg-emerald-400/10',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/30',
  },
  paused: {
    label: 'Staged / Paused',
    bgClass: 'bg-white/5',
    textClass: 'text-white/60',
    borderClass: 'border-white/15',
  },
  complete: {
    label: 'Fully Commissioned',
    bgClass: 'bg-purple-400/10',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-400/30',
  },
}

// Curated default redevelopment project bundles matching BEAM Grounds target nodes
const DEFAULT_REDEVELOPMENT_BUNDLES: RedevelopmentProjectBundle[] = [
  {
    project: {
      slug: 'central-umc-milwaukee',
      name: 'Central UMC Civic Resilience Center & Microgrid',
      address: '2430 W Kilbourn Ave, Milwaukee, WI',
      assetId: 'mke-2430-kilbourn',
      status: 'active',
      summary: 'Adaptive reuse of historic 32,000 sqft civic sanctuary into community acoustic stage, solar microgrid, and tech incubator.',
      visionBody: 'Converting former church facilities into community land-trust housing and co-working workspace with $30/hr HUD Section 3 labor credits.',
      restorationRenderUrl: '/images/central-umc-render.jpg',
      heroImageUrl: '/images/central-umc-hero.jpg',
      committedCount: 8,
      totalLoggedHours: 240,
      financingNote: '$450,000 Total Capitalizing • $180,000 HUD Match Offset • $270,000 Equity Deed Fund',
      isPublished: true,
      sortOrder: 1,
      updatedAt: '2026-09-18T12:00:00Z',
    },
    phases: [
      {
        id: 'phase-1-structural',
        title: 'Phase 1: Masonry & Roof Stabilization',
        order: 1,
        status: 'complete',
        tasks: [
          { title: 'Tuckpointing & exterior masonry seal', laborType: 'licensed', estimatedHours: 60, status: 'complete', note: 'Completed by Milwaukee Heritage Masonry' },
          { title: 'Acoustic ceiling structural reinforcement', laborType: 'faculty-supervised', estimatedHours: 80, status: 'complete', note: 'Supervised by MSOE Engineering' },
        ],
      },
      {
        id: 'phase-2-solar',
        title: 'Phase 2: 75kW Solar Array & Battery Installation',
        order: 2,
        status: 'in-progress',
        tasks: [
          { title: 'Roof conduit & inverter mounting', laborType: 'licensed', estimatedHours: 50, status: 'in-progress', note: 'Electrician slot active' },
          { title: 'Battery storage room climate insulation', laborType: 'volunteer', estimatedHours: 40, status: 'in-progress', note: 'Community work-day scheduled' },
        ],
      },
    ],
    equitySlots: [
      { id: 'slot-1', role: 'Lead Electrician / Microgrid Engineer', laborType: 'licensed', hoursNeeded: 60, hoursCommitted: 40, requiresSupervision: false, isOpen: true, sortOrder: 1 },
      { id: 'slot-2', role: 'Architectural Surveyor & BIM Drafter', laborType: 'faculty-supervised', hoursNeeded: 40, hoursCommitted: 40, requiresSupervision: true, isOpen: false, sortOrder: 2 },
      { id: 'slot-3', role: 'Site Safety & Acoustic Insulation Specialist', laborType: 'planning', hoursNeeded: 50, hoursCommitted: 20, requiresSupervision: false, isOpen: true, sortOrder: 3 },
    ],
  },
  {
    project: {
      slug: 'parramore-workforce-hub-orlando',
      name: 'Parramore Community Workforce Innovation Hub',
      address: '614 W Church St, Orlando, FL',
      assetId: 'orl-614-church',
      status: 'phase-1',
      summary: 'Retrofit of commercial property into digital craft workshop, community kitchen, and 99-year land-trust housing.',
      visionBody: 'Empowering West Orlando residents through sweat-equity trades, micro-enterprise incubation, and solar canopy energy.',
      restorationRenderUrl: '/images/parramore-render.jpg',
      heroImageUrl: '/images/parramore-hero.jpg',
      committedCount: 5,
      totalLoggedHours: 140,
      financingNote: '$620,000 Total Capitalization • $220,000 City Grant Match • $400,000 Equity Trust',
      isPublished: true,
      sortOrder: 2,
      updatedAt: '2026-09-18T14:00:00Z',
    },
    phases: [
      {
        id: 'phase-1-interior',
        title: 'Phase 1: Interior Demolition & Structural Framing',
        order: 1,
        status: 'in-progress',
        tasks: [
          { title: 'HVAC ducting & air handler installation', laborType: 'licensed', estimatedHours: 45, status: 'in-progress', note: 'Active mechanical contractor' },
        ],
      },
    ],
    equitySlots: [
      { id: 'slot-orl-1', role: 'HVAC Mechanical Specialist', laborType: 'licensed', hoursNeeded: 45, hoursCommitted: 15, requiresSupervision: false, isOpen: true, sortOrder: 1 },
      { id: 'slot-orl-2', role: 'Community Workshop Apprentice', laborType: 'volunteer', hoursNeeded: 60, hoursCommitted: 30, requiresSupervision: true, isOpen: true, sortOrder: 2 },
    ],
  },
  {
    project: {
      slug: 'auburn-ave-resilience-atlanta',
      name: 'Auburn Avenue Historic Resilience Center',
      address: '450 Auburn Ave NE, Atlanta, GA',
      assetId: 'atl-450-auburn',
      status: 'feasibility',
      summary: 'Historic preservation of Auburn Avenue corridor asset into land-trust community facility and digital arts laboratory.',
      visionBody: 'Restoring historic facade while installing high-performance acoustic isolation and solar microgrid.',
      restorationRenderUrl: '/images/auburn-render.jpg',
      heroImageUrl: '/images/auburn-hero.jpg',
      committedCount: 4,
      totalLoggedHours: 90,
      financingNote: '$750,000 Total Capitalization • Fulton County Historic Preservation Partner',
      isPublished: true,
      sortOrder: 3,
      updatedAt: '2026-09-18T15:00:00Z',
    },
    phases: [
      {
        id: 'phase-1-historic',
        title: 'Phase 1: Historic Architecture & Environmental Scoping',
        order: 1,
        status: 'in-progress',
        tasks: [
          { title: 'Historic facade documentation & laser scan', laborType: 'research', estimatedHours: 35, status: 'in-progress', note: 'Underway' },
        ],
      },
    ],
    equitySlots: [
      { id: 'slot-atl-1', role: 'Historic Preservation Architect', laborType: 'licensed', hoursNeeded: 40, hoursCommitted: 10, requiresSupervision: false, isOpen: true, sortOrder: 1 },
    ],
  },
]

export function RedevelopmentPipelineBoard({
  viewMode = 'participant',
  initialProjects = [],
}: RedevelopmentPipelineBoardProps) {
  const [projects, setProjects] = useState<RedevelopmentProjectBundle[]>(
    initialProjects.length > 0 ? initialProjects : DEFAULT_REDEVELOPMENT_BUNDLES
  )
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch(`/api/redevelopment?mode=${viewMode}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.projects) && data.projects.length > 0) {
            setProjects(data.projects)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch redevelopment projects for board, using curated bundles:', err)
      }
    }

    if (initialProjects.length === 0) {
      loadProjects()
    }
  }, [viewMode, initialProjects])

  const filteredProjects = projects.filter((bundle) => {
    const { project } = bundle
    if (viewMode === 'participant' && !project.isPublished) {
      return false
    }
    if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = project.name.toLowerCase().includes(q)
      const matchAddress = project.address.toLowerCase().includes(q)
      const matchSummary = project.summary.toLowerCase().includes(q)
      if (!matchName && !matchAddress && !matchSummary) return false
    }
    return true
  })

  const totalProjects = filteredProjects.length
  const activeCount = filteredProjects.filter(
    (b) => b.project.status === 'active' || b.project.status === 'phase-1'
  ).length
  const totalOpenSlots = filteredProjects.reduce(
    (acc, b) => acc + (b.equitySlots ? b.equitySlots.filter((s) => s.isOpen).length : 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header Banner & Controls (Dark Theme Design Tokens) */}
      <div className="surface-panel p-6 shadow-grounds">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-grounds-sand" />
              <h2 className="text-xl font-bold text-white">
                Portfolio Redevelopment Board
              </h2>
              {viewMode === 'admin' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  <ShieldCheck className="h-3 w-3 text-amber-400" /> Admin View (All Projects)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  <Globe className="h-3 w-3 text-emerald-400" /> Published Portfolio
                </span>
              )}
            </div>
            <p className="text-xs text-white/60">
              Portfolio-level view tracking active site transformations, phase milestones, open equity slots, and capital financing notes.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">
                Projects
              </span>
              <span className="text-base font-extrabold text-white">{totalProjects}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">
                Active Phases
              </span>
              <span className="text-base font-extrabold text-emerald-400">{activeCount}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/40">
                Open Equity Slots
              </span>
              <span className="text-base font-extrabold text-amber-300">{totalOpenSlots}</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'feasibility', label: 'Feasibility' },
              { id: 'phase-1', label: 'Phase 1' },
              { id: 'active', label: 'Active' },
              { id: 'paused', label: 'Paused' },
              { id: 'complete', label: 'Complete' },
            ].map((tab) => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-grounds-sand text-[#0b1712] font-bold shadow-sm'
                      : 'border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, address..."
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/40 focus:border-grounds-sand/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="surface-panel flex min-h-[260px] items-center justify-center p-8 text-xs text-white/60 shadow-grounds">
          <Clock className="mr-2 h-4 w-4 animate-spin text-grounds-sand" />
          <span>Loading portfolio redevelopment board...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="surface-panel flex min-h-[220px] flex-col items-center justify-center p-8 text-center text-xs text-white/60 shadow-grounds space-y-2">
          <AlertCircle className="h-8 w-8 text-white/20" />
          <p className="font-semibold text-white/80">No redevelopment projects found matching your filters.</p>
          <p className="text-white/50 text-[11px]">Try clearing search or switching status tabs.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((bundle) => {
            const { project, phases, equitySlots } = bundle
            const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.feasibility
            const openSlots = equitySlots.filter((s) => s.isOpen)

            return (
              <div
                key={project.slug}
                className="surface-panel flex flex-col justify-between p-6 shadow-grounds transition duration-200 hover:border-grounds-sand/40 hover:bg-white/[0.05]"
              >
                <div className="space-y-4">
                  {/* Top Header & Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-grounds-sand font-bold">
                        {project.slug}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-snug">{project.name}</h3>
                      <p className="mt-0.5 text-xs text-white/60">{project.address}</p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 font-mono text-xs font-semibold ${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Summary Narrative */}
                  <p className="text-xs leading-relaxed text-white/75">{project.summary}</p>

                  {/* Financing Note */}
                  {project.financingNote && (
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-3.5 text-xs text-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                        <Coins className="h-4 w-4" />
                        <span>Capitalization &amp; Financial Terms</span>
                      </div>
                      <p className="font-mono text-[11px] leading-relaxed text-emerald-100/90">{project.financingNote}</p>
                    </div>
                  )}

                  {/* Phases Progress */}
                  {phases.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-grounds-sand" /> Active Phase Milestones
                        </span>
                        <span className="text-[10px] font-mono text-white/50">{phases.length} Phases</span>
                      </div>
                      <div className="space-y-1.5">
                        {phases.slice(0, 2).map((phase) => (
                          <div
                            key={phase.id}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs"
                          >
                            <span className="font-medium text-white/80 truncate">{phase.title}</span>
                            <span
                              className={`ml-2 shrink-0 font-mono text-[10px] font-bold ${
                                phase.status === 'complete'
                                  ? 'text-emerald-400'
                                  : phase.status === 'in-progress'
                                  ? 'text-sky-300'
                                  : 'text-white/40'
                              }`}
                            >
                              {phase.status === 'complete' ? '✓ Complete' : phase.status === 'in-progress' ? '⚡ Active' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open Equity Slots */}
                  {openSlots.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <HardHat className="h-3.5 w-3.5 text-amber-400" /> Open Equity Slots ({openSlots.length})
                        </span>
                        <span className="text-[10px] font-mono text-white/50">$30/hr HUD Match</span>
                      </div>
                      <div className="space-y-1.5">
                        {openSlots.map((slot) => {
                          const typeInfo = laborTypes[slot.laborType] || { label: slot.laborType, color: 'text-amber-300' }
                          return (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 p-2.5 text-xs"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-white truncate block">{slot.role}</span>
                                <span className={`text-[10px] font-mono ${typeInfo.colorFg}`}>
                                  {typeInfo.label} • {slot.hoursNeeded - slot.hoursCommitted}h needed
                                </span>
                              </div>
                              <Link
                                href={`/projects/${project.slug}`}
                                className="ml-2 shrink-0 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-bold text-amber-300 hover:bg-amber-400/20 transition"
                              >
                                Claim Slot →
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Users className="h-3.5 w-3.5 text-grounds-sand" />
                    <span>{project.committedCount} Participants Enrolled</span>
                  </div>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-grounds-sand hover:underline"
                  >
                    <span>View Project Brief</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
