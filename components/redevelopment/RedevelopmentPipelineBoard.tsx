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
    label: 'Feasibility Stage',
    bgClass: 'bg-amber-400/10',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300/40',
  },
  'phase-1': {
    label: 'Phase 1 Active',
    bgClass: 'bg-sky-400/10',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-300/40',
  },
  active: {
    label: 'Active Development',
    bgClass: 'bg-emerald-400/10',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300/40',
  },
  paused: {
    label: 'Paused / Staged',
    bgClass: 'bg-slate-400/10',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-300/40',
  },
  complete: {
    label: 'Fully Commissioned',
    bgClass: 'bg-purple-400/10',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-300/40',
  },
}

export function RedevelopmentPipelineBoard({
  viewMode = 'participant',
  initialProjects = [],
}: RedevelopmentPipelineBoardProps) {
  const [projects, setProjects] = useState<RedevelopmentProjectBundle[]>(initialProjects)
  const [loading, setLoading] = useState(initialProjects.length === 0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Fetch projects if not provided
    async function loadProjects() {
      try {
        const res = await fetch(`/api/redevelopment?mode=${viewMode}`)
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects || [])
        }
      } catch (err) {
        console.warn('Failed to fetch redevelopment projects for board:', err)
      } finally {
        setLoading(false)
      }
    }

    if (initialProjects.length === 0) {
      loadProjects()
    } else {
      setProjects(initialProjects)
      setLoading(false)
    }
  }, [viewMode, initialProjects])

  // Filter projects based on viewMode, statusFilter, and searchQuery
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

  // Summary Metrics
  const totalProjects = filteredProjects.length
  const activeCount = filteredProjects.filter((b) => b.project.status === 'active' || b.project.status === 'phase-1').length
  const totalOpenSlots = filteredProjects.reduce(
    (acc, b) => acc + b.equitySlots.filter((s) => s.isOpen).length,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header Banner & Controls */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-800" />
              <h2 className="text-xl font-bold text-[#0f172a]">
                Redevelopment Pipeline Board
              </h2>
              {viewMode === 'admin' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                  <ShieldCheck className="h-3 w-3" /> Admin View (All Projects)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                  <Globe className="h-3 w-3" /> Published Portfolio
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Portfolio-level view tracking active site transformations, phase milestones, open equity slots, and capital financing notes.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Projects
              </span>
              <span className="text-base font-extrabold text-[#0f172a]">{totalProjects}</span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Active Phases
              </span>
              <span className="text-base font-extrabold text-emerald-700">{activeCount}</span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Open Equity Slots
              </span>
              <span className="text-base font-extrabold text-amber-700">{totalOpenSlots}</span>
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
                      ? 'bg-[#1e293b] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Projects Card Grid */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs font-medium text-slate-500">
          Loading redevelopment pipeline board...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-2">
          <Building2 className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="text-sm font-bold text-[#0f172a]">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No redevelopment projects match your selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map(({ project, phases, equitySlots }) => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.feasibility
            const totalPhases = phases.length
            const completedPhases = phases.filter((p) => p.status === 'complete').length
            const phaseProgressPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

            // Open Equity Slots breakdown by laborType
            const openSlots = equitySlots.filter((s) => s.isOpen)
            const slotsByLaborType: Record<LaborType, number> = {
              volunteer: 0,
              licensed: 0,
              'faculty-supervised': 0,
              research: 0,
              planning: 0,
              production: 0,
            }
            openSlots.forEach((slot) => {
              if (slotsByLaborType[slot.laborType] !== undefined) {
                slotsByLaborType[slot.laborType] += 1
              }
            })

            return (
              <div
                key={project.slug}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
              >
                {/* Card Top Header */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#0f172a]">{project.name}</h3>
                        {!project.isPublished && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-800">
                            <Lock className="h-2.5 w-2.5" /> Unpublished
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{project.address}</p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-mono text-[10px] font-bold ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {project.summary}
                  </p>

                  {/* Phase Completion Progress */}
                  <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Phase Milestone Progress
                      </span>
                      <span className="font-mono text-[11px] text-slate-600">
                        {completedPhases} of {totalPhases} phases ({phaseProgressPct}%)
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${phaseProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Open Equity Slots Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <HardHat className="h-3.5 w-3.5 text-slate-700" />
                        Open Equity Slots ({openSlots.length})
                      </span>
                      <span className="text-[10px] font-mono text-slate-700">By Labor Category</span>
                    </div>

                    {openSlots.length === 0 ? (
                      <p className="text-[11px] italic text-slate-400">All equity slots currently assigned.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(slotsByLaborType) as LaborType[])
                          .filter((lt) => slotsByLaborType[lt] > 0)
                          .map((lt) => {
                            const config = laborTypes[lt]
                            const count = slotsByLaborType[lt]
                            return (
                              <span
                                key={lt}
                                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: config.colorBg,
                                  color: config.colorFg,
                                  borderColor: `${config.colorFg}33`,
                                }}
                              >
                                <strong>{count}</strong> {config.label}
                              </span>
                            )
                          })}
                      </div>
                    )}
                  </div>

                  {/* Financing Note Badge */}
                  {project.financingNote && (
                    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-3 text-xs text-amber-950 flex items-start gap-2">
                      <Coins className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                      <div>
                        <strong className="font-semibold block text-[11px] text-amber-900 uppercase tracking-wider">
                          Capital &amp; Financing Note:
                        </strong>
                        <span className="text-[11px] leading-relaxed text-amber-900">{project.financingNote}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{project.committedCount} Committed</span>
                    <span>•</span>
                    <span>{project.totalLoggedHours} Hrs Logged</span>
                  </div>

                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[#1e293b] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-sm transition"
                  >
                    View Project Detail <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
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
