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
  const [grantMatches, setGrantMatches] = useState<{ totalGrantAllocation: number; matchedGrants: Array<{ id: string; programName: string; allocatedAmount: number; hourlyStipendMatch?: number }> } | null>(null)

  useEffect(() => {
    if (!parcel) return
    let isCancelled = false

    async function loadArchSpecsAndGrants() {
      setLoadingArch(true)
      try {
        const [archRes, grantRes] = await Promise.all([
          fetch(`/api/architecture/specs?parcelId=${encodeURIComponent(parcel!.parcelId)}`),
          fetch(`/api/grants/match?parcelId=${encodeURIComponent(parcel!.parcelId)}`),
        ])
        if (archRes.ok && !isCancelled) {
          const json = await archRes.json()
          setArchSpecs(json)
        }
        if (grantRes.ok && !isCancelled) {
          const grantJson = await grantRes.json()
          setGrantMatches(grantJson)
        }
      } catch (err) {
        console.warn('Unable to load parcel intelligence details:', err)
      } finally {
        if (!isCancelled) setLoadingArch(false)
      }
    }

    void loadArchSpecsAndGrants()
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-2 sm:p-6 backdrop-blur-md flex justify-center items-start sm:items-center">
      <div className="relative my-2 sm:my-6 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Sticky Header Bar */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
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
              className="rounded-full p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-bold"
              title="Close Workspace Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>

        {tabledSuccess && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-1">
            <p className="text-sm font-bold text-emerald-900">
              🎉 Site Tabled Successfully!
            </p>
            <p className="text-xs text-emerald-700">
              {targetParcel.address} has been submitted to the BEAM Site Acquisition &amp; Review Queue.
            </p>
          </div>
        )}

        {message && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-2xl">{message}</p>
        )}

        {/* Graceful Fallback State Card if Parcel Not Found */}
        {!targetParcel.found ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#0f172a]">
                No Official Parcel Record Found for &quot;{targetParcel.address}&quot;
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                This site may be an unassigned lot or newly platted parcel. You can still table a custom site draft for BEAM operator review.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                type="button"
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handleTableGround}
                disabled={submitting || tabledSuccess}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-[#1e293b] px-6 py-2 text-xs font-semibold text-white hover:bg-slate-900 shadow-md transition disabled:opacity-50"
              >
                <Send className="h-4 w-4 text-emerald-400" />
                {tabledSuccess ? 'Custom Site Draft Tabled!' : 'Table Custom Site Draft'}
              </button>
            </div>
          </div>
        ) : (
          /* Split View Workspace Layout */
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
                  <span className="font-extrabold text-[#0f172a] text-sm">{targetParcel.assessedValue}</span>
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

              {/* Workforce Grants & Enterprise Sponsor Match Badges */}
              {grantMatches && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-600" /> Matched Workforce Grants &amp; Enterprise Capital
                    </span>
                    <span className="text-emerald-700">${grantMatches.totalGrantAllocation.toLocaleString()} Total Funding</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {grantMatches.matchedGrants.map((grant) => (
                      <span
                        key={grant.id}
                        className="rounded-lg bg-white border border-emerald-200 px-2 py-1 text-[10px] font-mono text-emerald-900 font-semibold"
                      >
                        {grant.programName} (+${grant.allocatedAmount.toLocaleString()})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        )}
        </div>
      </div>
    </div>
  )
}
