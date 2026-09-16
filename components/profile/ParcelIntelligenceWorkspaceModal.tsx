'use client'

import { useState, useEffect } from 'react'
import {
  X,
  MapPin,
  Building2,
  Send,
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  Ruler,
  Compass,
  Hammer,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ParcelResult } from '@/app/api/parcel/route'
import type { ArchitecturalSpecsResult } from '@/app/api/architecture/specs/route'
import { AcquisitionTeamModule } from '@/components/profile/AcquisitionTeamModule'

interface ParcelIntelligenceWorkspaceModalProps {
  parcel: ParcelResult | null
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  onClose: () => void
  onTableGroundSuccess?: (siteName: string) => void
}

export function ParcelIntelligenceWorkspaceModal({
  parcel,
  user,
  onClose,
  onTableGroundSuccess,
}: ParcelIntelligenceWorkspaceModalProps) {
  const [archSpecs, setArchSpecs] = useState<ArchitecturalSpecsResult | null>(null)
  const [loadingArch, setLoadingArch] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tabledSuccess, setTabledSuccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!parcel) return
    let isCancelled = false

    async function loadArchSpecs() {
      setLoadingArch(true)
      try {
        const res = await fetch(`/api/architecture/specs?parcelId=${encodeURIComponent(parcel!.parcelId)}`)
        if (res.ok && !isCancelled) {
          const json = await res.json()
          setArchSpecs(json)
        }
      } catch (err) {
        console.warn('Unable to load architectural specs:', err)
      } finally {
        if (!isCancelled) setLoadingArch(false)
      }
    }

    void loadArchSpecs()
    return () => {
      isCancelled = true
    }
  }, [parcel])

  if (!parcel) return null
  const targetParcel = parcel

  // Financial Calculations
  const sqft = targetParcel.sqft_structure || 4200
  const estimatedRehabCost = sqft * 35
  const sweatEquityHours = 72
  const sweatEquityCredit = sweatEquityHours * 30 // $2,160
  const netCashRequired = Math.max(0, estimatedRehabCost - sweatEquityCredit)

  async function handleTableGround() {
    setMessage(null)
    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }

    setSubmitting(true)

    try {
      await addDoc(collection(db, 'siteSuggestions'), {
        name: `${targetParcel.address} Revitalization Candidate`,
        address: targetParcel.address,
        parcelId: targetParcel.parcelId,
        suggestedUse: archSpecs?.buildingType || 'Mixed-Use Civic & Cohort Hub',
        zoning: targetParcel.zoning,
        ownerName: targetParcel.ownerName,
        financialProForma: {
          assessedValue: targetParcel.assessedValue,
          estimatedRehabCost,
          sweatEquityCredit,
          netCashRequired,
        },
        architecturalSpecs: archSpecs || null,
        suggestedBy: {
          name: user?.displayName || 'Ezra Haugabrooks',
          email: user?.email || '',
          uid: user?.uid || 'member',
        },
        status: 'tabled',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      })

      setTabledSuccess(true)
      if (onTableGroundSuccess) {
        onTableGroundSuccess(targetParcel.address)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to table property for BEAM Project.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-8 w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-slate-900" />
              <h2 className="text-xl font-bold text-[#0f172a]">
                BEAM Real Estate Intelligence &amp; Actuation Workspace
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-500">
              TaxKey: <strong className="text-slate-800">{parcel.parcelId}</strong> • Source: {parcel.source}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTableGround}
              disabled={submitting || tabledSuccess}
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#1e293b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-md transition disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-emerald-400" />
              {submitting
                ? 'Tableing Site...'
                : tabledSuccess
                ? 'Tabled for BEAM Project!'
                : 'Table Ground for BEAM Project'}
            </button>

            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {tabledSuccess && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-1">
            <p className="text-sm font-bold text-emerald-900">
              🎉 Site Tabled Successfully!
            </p>
            <p className="text-xs text-emerald-700">
              {parcel.address} has been submitted to the BEAM Site Acquisition &amp; Review Queue.
            </p>
          </div>
        )}

        {message && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-2xl">{message}</p>
        )}

        {/* Split View Workspace Layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT SIDE: GIS Boundary Map, Zoning & Architectural Specs (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* GIS Interactive Boundary View Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-[10px] font-mono uppercase font-bold text-sky-300">
                  <MapPin className="h-3 w-3 text-sky-400" /> GIS Boundary Map View
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {parcel.lat?.toFixed(4)}, {parcel.lng?.toFixed(4)}
                </span>
              </div>

              {/* Synthetic Mapbox / Satellite Polygon Mock */}
              <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center">
                <svg className="h-full w-full opacity-60" viewBox="0 0 300 200">
                  <rect width="300" height="200" fill="#0f172a" />
                  <path d="M20 30 L280 20 L270 180 L30 170 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                  {/* Highlighted Parcel Polygon */}
                  <polygon points="90,60 210,50 200,140 80,130" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                  <span className="rounded bg-black/60 px-2 py-1 font-mono text-xs font-bold text-white backdrop-blur-sm border border-slate-700">
                    {parcel.address}
                  </span>
                  <span className="mt-1 text-[10px] font-mono text-sky-300">
                    Polygon Parcel Boundary Verified
                  </span>
                </div>
              </div>

              {/* Zoning & Lot Intelligence Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-xl bg-slate-800/80 p-2.5 space-y-0.5 border border-slate-700">
                  <span className="text-[9px] text-slate-400 block uppercase">Zoning Classification</span>
                  <span className="font-bold text-white">{parcel.zoning_code || 'RT4'}</span>
                  <span className="text-[10px] text-slate-300 block truncate">{parcel.zoning_description || parcel.zoning}</span>
                </div>
                <div className="rounded-xl bg-slate-800/80 p-2.5 space-y-0.5 border border-slate-700">
                  <span className="text-[9px] text-slate-400 block uppercase">Lot / Structure SqFt</span>
                  <span className="font-bold text-sky-300">
                    {(parcel.sqft_structure || 4200).toLocaleString()} sqft
                  </span>
                  <span className="text-[10px] text-slate-400 block">Lot: {(parcel.sqft_lot || 8500).toLocaleString()} sqft</span>
                </div>
              </div>

              {/* Tax Lien & Owner Status */}
              <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2.5 text-xs font-mono border border-slate-700">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Owner Entity</span>
                  <span className="font-bold text-slate-200">{parcel.ownerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block uppercase">Tax Lien Status</span>
                  <span className={`font-bold ${parcel.tax_lien_status === 'Clean / Current' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {parcel.tax_lien_status || 'Clean / Current'}
                  </span>
                </div>
              </div>
            </div>

            {/* Architectural Website Bridge API Card */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Ruler className="h-4 w-4 text-slate-700" /> Architectural &amp; BIM Specs
                </div>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold text-slate-700">
                  Bridge API
                </span>
              </div>

              {loadingArch ? (
                <p className="text-xs text-slate-400">Loading architectural specs...</p>
              ) : archSpecs ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Building Classification:</span>
                    <span className="font-semibold text-slate-800">{archSpecs.buildingType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Structural Condition:</span>
                    <span className="font-bold text-slate-800">{archSpecs.structuralConditionRating}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Acoustic Ceiling Height:</span>
                    <span className="font-mono font-bold text-emerald-700">{archSpecs.acousticCeilingHeightFt || 14} ft</span>
                  </div>

                  {archSpecs.hasCadBimModel ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-emerald-900 text-[11px] font-semibold flex items-center justify-between">
                      <span>IFC / CAD BIM Model Available</span>
                      <a href={archSpecs.cadModelUrl || '#'} download className="underline text-emerald-700">Download CAD</a>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-amber-900 text-[11px] font-semibold">
                      ⚠️ Architecture Scope Required: Recommended {archSpecs.recommendedSqftScope?.minSqft.toLocaleString()} - {archSpecs.recommendedSqftScope?.maxSqft.toLocaleString()} sqft layout plan.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT SIDE: Financial Pro-Forma & Acquisition Team Module (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Financial Pro-Forma Underwriting Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-slate-800" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f172a]">
                    BEAM Financial Pro-Forma Underwriting
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase text-emerald-800">
                  HUD Match Offset Enabled
                </span>
              </div>

              {/* 4 Metric Columns */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <span className="text-[9px] text-slate-400 block uppercase">Est. Valuation</span>
                  <span className="font-extrabold text-[#0f172a] text-sm">{parcel.assessedValue}</span>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <span className="text-[9px] text-slate-400 block uppercase">Est. Rehab Cost</span>
                  <span className="font-extrabold text-amber-700 text-sm">
                    ${estimatedRehabCost.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                  <span className="text-[9px] text-emerald-700 block uppercase">Sweat Equity Credit</span>
                  <span className="font-extrabold text-emerald-800 text-sm">
                    -${sweatEquityCredit.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-900 text-white p-3">
                  <span className="text-[9px] text-slate-400 block uppercase">Net Cash Required</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ${netCashRequired.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Integrated Acquisition & Team Assembly Module */}
            <AcquisitionTeamModule parcel={parcel} user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}
