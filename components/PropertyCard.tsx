'use client'

import { useState } from 'react'
import { X, ShieldCheck, AlertCircle, FileSpreadsheet } from 'lucide-react'
import type { BeamAsset, BeamAssetStage } from '@/lib/useAcquisitionSites'

interface PropertyCardProps {
  site: BeamAsset | null
  onClose: () => void
}

const stageBadgeClasses: Record<BeamAssetStage, string> = {
  SIGNAL: 'border-amber-300/35 bg-amber-400/14 text-amber-100',
  CLAIM: 'border-blue-300/35 bg-blue-400/14 text-blue-100',
  ACCESS: 'border-purple-300/35 bg-purple-400/14 text-purple-100',
  STABILIZE: 'border-teal-300/35 bg-teal-400/14 text-teal-100',
  ACTIVATE: 'border-green-300/35 bg-green-400/14 text-green-100',
  SECURE: 'border-emerald-300/35 bg-emerald-400/14 text-emerald-100',
  TRANSFER: 'border-white/25 bg-white/10 text-white/78',
}

const scoreLabels: Array<keyof BeamAsset['scores']> = ['capacity', 'impact', 'stability', 'revenue', 'partner']

function StageBadge({ stage }: { stage: BeamAssetStage }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${stageBadgeClasses[stage]}`}>
      {stage}
    </span>
  )
}

export function PropertyCard({ site, onClose }: PropertyCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'appraisal'>('overview')

  if (!site) return null

  const latestHistory = [...site.stageHistory].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]

  // Mock appraisal data fallback if none provided on site
  const appraisal = site.appraisalData || {
    estimatedValue: typeof site.ckanAssessedValue === 'number' ? site.ckanAssessedValue : 168400,
    repairCostEstimate: 45000,
    lienStatus: site.ckanTaxStatus === 'Current' ? 'Clean title — No tax liens' : 'Municipal lien flagged',
    source: 'BEAM Civic Intelligence + Regrid Parcel Feed',
    confidence: 0.88,
  }

  return (
    <aside className="surface-panel p-5 shadow-grounds">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{site.name}</h2>
          <p className="mt-1 text-sm text-white/60">{site.address}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close property details"
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <StageBadge stage={site.acquisitionStage} />

        {/* Tab Selector */}
        <div className="inline-flex rounded-full border border-white/10 bg-[#12211c] p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`rounded-full px-3 py-1 transition ${
              activeTab === 'overview' ? 'bg-grounds-sand text-[#0b1712]' : 'text-white/60 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appraisal')}
            className={`rounded-full px-3 py-1 transition ${
              activeTab === 'appraisal' ? 'bg-grounds-sand text-[#0b1712]' : 'text-white/60 hover:text-white'
            }`}
          >
            Appraisal provenance
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          <p className="mt-5 text-sm leading-7 text-white/70">{site.operatorNarrative}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {site.primaryUseCases.map((useCase) => (
              <span key={useCase} className="rounded-full border border-grounds-sand/45 px-3 py-1 text-xs font-medium text-grounds-sand">
                {useCase}
              </span>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-white">Scores</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {scoreLabels.map((scoreKey) => (
                <div key={scoreKey} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#12211c] px-3 py-2 text-sm">
                  <span className="capitalize text-white/66">{scoreKey}</span>
                  <span className="font-semibold text-white">{site.scores[scoreKey]} / 5</span>
                </div>
              ))}
            </div>
          </div>

          {latestHistory ? (
            <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
              <p className="text-sm font-medium text-white">Most recent stage</p>
              <div className="mt-3">
                <StageBadge stage={latestHistory.stage} />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/70">{latestHistory.note}</p>
              <p className="mt-2 text-xs text-white/50">{latestHistory.timestamp}</p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-white/50">
              <span>Appraisal Model Output</span>
              <span className="text-grounds-sand">{(appraisal.confidence * 100).toFixed(0)}% Confidence</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-xs text-white/50">Estimated Value</p>
                <p className="mt-1 text-lg font-semibold text-white">${appraisal.estimatedValue.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-xs text-white/50">Est. Repair / Rehab</p>
                <p className="mt-1 text-lg font-semibold text-amber-200">${appraisal.repairCostEstimate.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Lien & Title Status</span>
              </div>
              <p className="mt-1 text-sm font-medium text-white">{appraisal.lienStatus}</p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <FileSpreadsheet className="h-3.5 w-3.5 text-grounds-sand" />
                <span>Data Provenance Source</span>
              </div>
              <p className="mt-1 text-xs text-white/70">{appraisal.source}</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Simulated valuation output. Real backend `/api/appraisal` will plug into this exact data structure.</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

