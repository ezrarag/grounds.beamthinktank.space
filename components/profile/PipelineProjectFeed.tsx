'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Calendar,
  Compass,
  DollarSign,
  FileCheck,
  HardHat,
  MapPin,
  Search,
  Sparkles,
  Layers,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { CITIES, type PipelineProject } from '@/lib/cities'

interface PipelineProjectFeedProps {
  initialCityId?: string
  onInspectProject?: (project: PipelineProject) => void
}

export function PipelineProjectFeed({
  initialCityId = 'milwaukee-wi',
  onInspectProject,
}: PipelineProjectFeedProps) {
  const [selectedCityId, setSelectedCityId] = useState<string>(initialCityId)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<PipelineProject[]>([])
  const [isLiveSource, setIsLiveSource] = useState<boolean>(false)

  const fetchPipelineProjects = useCallback(async (cityId: string, query: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/civic/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId, q: query, limit: 30 }),
      })
      if (!res.ok) {
        throw new Error(`Pipeline API returned status ${res.status}`)
      }
      const data = (await res.json()) as {
        projects?: PipelineProject[]
        hasPipelineSource?: boolean
        isLive?: boolean
        message?: string
      }
      setProjects(data.projects ?? [])
      setIsLiveSource(!!data.isLive)
    } catch (err) {
      console.error('Failed to load pipeline projects:', err)
      setError(err instanceof Error ? err.message : 'Unable to fetch pipeline records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPipelineProjects(selectedCityId, searchQuery)
  }, [selectedCityId, searchQuery, fetchPipelineProjects])

  const selectedCityObj = CITIES.find((c) => c.id === selectedCityId)

  return (
    <div className="space-y-5">
      {/* Header Banner & Controls */}
      <div className="surface-panel p-5 shadow-grounds">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                FUTURE PIPELINE — COMING
              </span>
              <span className="text-xs text-white/50">Municipal CIP & Permit Layer</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">Future Development & Capital Pipeline</h2>
            <p className="mt-1 text-sm text-white/60">
              Scouted capital improvement projects, active building permits, and future civic investments across registered city nodes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/60">City Node:</span>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#12211c] px-3 py-2 text-xs font-semibold text-white shadow-sm focus:border-grounds-sand focus:outline-none"
            >
              {CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label} ({city.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits, trade scope, addresses, or project names..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-4 text-xs text-white placeholder-white/40 focus:border-grounds-sand/50 focus:outline-none"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs text-white/60 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notice Callout */}
      <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-xs leading-6 text-blue-200">
        <div className="flex items-start gap-2.5">
          <Compass className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <div>
            <strong className="font-semibold text-blue-100">Distinct Data Layer Notice:</strong> Pipeline projects represent future municipal investments and pending permit applications. They are kept strictly distinct from active acquirable <span className="font-mono text-amber-300">BEAM Assets</span> to ensure clear distinction between future scoping and immediate property claims.
          </div>
        </div>
      </div>

      {/* Results Container */}
      {loading ? (
        <div className="surface-panel flex min-h-[280px] items-center justify-center p-8 text-xs text-white/60 shadow-grounds">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin text-grounds-sand" />
            <span>Scanning civic pipeline records for {selectedCityObj?.label ?? selectedCityId}...</span>
          </div>
        </div>
      ) : error ? (
        <div className="surface-panel border-red-400/20 bg-red-500/10 p-6 text-xs text-red-200 shadow-grounds">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span>{error}</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="surface-panel flex min-h-[220px] flex-col items-center justify-center p-8 text-center text-xs text-white/60 shadow-grounds">
          <Layers className="h-8 w-8 text-white/20" />
          <p className="mt-3 font-semibold text-white/80">No pipeline projects found for {selectedCityObj?.label}</p>
          <p className="mt-1 max-w-md text-white/50">
            {searchQuery
              ? `No records matched "${searchQuery}". Try broadening your search.`
              : `This city has no registered pipeline dataset configured yet or dataset returned 0 active records.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.sourceId}
              onClick={() => onInspectProject?.(project)}
              className="surface-panel relative flex flex-col justify-between p-5 transition duration-200 hover:border-grounds-sand/40 hover:bg-white/[0.05]"
            >
              <div>
                {/* Top Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-300">
                    FUTURE PIPELINE
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/60">
                    Ref: {project.sourceId}
                  </span>
                </div>

                {/* Project Title & Address */}
                <h3 className="mt-3 text-base font-bold text-white leading-snug">{project.projectName}</h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/70">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-grounds-sand" />
                  <span className="truncate">{project.address}</span>
                </div>

                {/* Scope / Trade */}
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80">
                  <div className="flex items-center gap-1.5 font-semibold text-grounds-sand mb-1">
                    <HardHat className="h-3.5 w-3.5" />
                    <span>Trade Scope & Work Description</span>
                  </div>
                  <p className="leading-relaxed text-white/70">{project.tradeScope}</p>
                </div>

                {/* Status & Valuation details */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                    <span className="block text-white/40">Status</span>
                    <span className="font-semibold text-emerald-300">{project.status}</span>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                    <span className="block text-white/40">Est. Valuation</span>
                    <span className="font-semibold text-amber-200">{project.estimatedCost || 'TBD'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/50">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-white/40" />
                  <span>{project.estimatedTimeline}</span>
                </div>
                {project.applicantName && (
                  <span className="truncate max-w-[160px] text-right text-white/40">
                    Sponsor: {project.applicantName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
