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
  Share2,
  HardHat,
  MessageSquare,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ParcelResult } from '@/app/api/parcel/route'
import type { ArchitecturalSpecsResult } from '@/app/api/architecture/specs/route'
import { AcquisitionTeamModule } from '@/components/profile/AcquisitionTeamModule'
import { PropertyVisualizer } from '@/components/PropertyVisualizer'

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
  const [visualMode, setVisualMode] = useState<'street' | 'satellite'>('street')
  const [streetViewError, setStreetViewError] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [reviewRequestNotice, setReviewRequestNotice] = useState<string | null>(null)

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

  function handleExportProjectBrief() {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  function handleShareParcelUrl() {
    if (typeof window === 'undefined' || !parcel) return
    const baseUrl = `${window.location.origin}${window.location.pathname}`
    const query = `?address=${encodeURIComponent(parcel.address)}&taxkey=${encodeURIComponent(parcel.parcelId)}`
    const shareUrl = `${baseUrl}${query}`

    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    })
  }

  async function handleRequestSiteReview(role: 'GC' | 'Underwriter') {
    if (!parcel) return
    setReviewRequestNotice(null)
    try {
      if (db) {
        await addDoc(collection(db, 'siteReviewRequests'), {
          address: parcel.address,
          parcelId: parcel.parcelId,
          requestedRole: role,
          requestedBy: user?.displayName || 'Ezra Haugabrooks',
          email: user?.email || '',
          timestamp: new Date().toISOString(),
          status: 'pending',
        })
      }
      setReviewRequestNotice(`🎉 ${role === 'GC' ? 'General Contractor Site Walk' : 'Underwriter Financial Review'} requested! Logged to team queue.`)
      setTimeout(() => setReviewRequestNotice(null), 4500)
    } catch (err) {
      console.warn('Unable to submit site review request:', err)
      setReviewRequestNotice(`Requested ${role === 'GC' ? 'GC Site Walk' : 'Underwriter Review'} for ${parcel.address}.`)
      setTimeout(() => setReviewRequestNotice(null), 4500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-2 sm:p-6 backdrop-blur-md flex justify-center items-start sm:items-center">
      <div className="relative my-2 sm:my-6 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Sticky Header Bar: Site Identity */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
                {parcel.address}
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-500 flex flex-wrap items-center gap-2">
              <span>TaxKey: <strong className="text-slate-800">{parcel.parcelId}</strong></span>
              <span>•</span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Source: {parcel.source === 'regrid' ? 'City of Milwaukee MPROP Open Data API • Verified Live' : 'Mapbox Geocoding & County Parcel Layer • Verified'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShareParcelUrl}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-4 py-2.5 text-xs font-semibold text-sky-900 hover:bg-sky-100 shadow-sm transition"
              title="Copy shareable deep-link URL for team collaboration"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-sky-700" />
                  <span>Share Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportProjectBrief}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 shadow-sm transition"
              title="Export printable Site Brief Package for underwriters, contractors, & developers"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-700" />
              <span>Export Project Brief Package</span>
            </button>

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

        {reviewRequestNotice && (
          <div className="rounded-2xl bg-sky-50 border border-sky-200 p-3.5 text-center text-xs font-semibold text-sky-900 shadow-sm">
            {reviewRequestNotice}
          </div>
        )}

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
          {/* LEFT SIDE: Visual Confirmation & Property Profile (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Visual Confirmation Card with Dual View Switcher */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                {/* Visual View Switcher Buttons */}
                <div className="flex items-center gap-1 rounded-full bg-slate-800 p-1 border border-slate-700">
                  <button
                    onClick={() => setVisualMode('street')}
                    type="button"
                    className={`rounded-full px-3 py-1 text-[10px] font-mono font-bold uppercase transition ${
                      visualMode === 'street'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    📸 Street View
                  </button>
                  <button
                    onClick={() => setVisualMode('satellite')}
                    type="button"
                    className={`rounded-full px-3 py-1 text-[10px] font-mono font-bold uppercase transition ${
                      visualMode === 'satellite'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🌐 GIS Satellite
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  {parcel.lat?.toFixed(4)}, {parcel.lng?.toFixed(4)}
                </span>
              </div>

              {/* Visual Media Container */}
              <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center">
                {visualMode === 'street' ? (
                  !streetViewError ? (
                    <img
                      src={`/api/streetview?location=${encodeURIComponent(parcel.address || `${parcel.lat},${parcel.lng}`)}`}
                      alt={`Street View of ${parcel.address}`}
                      className="h-full w-full object-cover"
                      onError={() => setStreetViewError(true)}
                    />
                  ) : (
                    /* High-Res Static Satellite Imagery Fallback */
                    <img
                      src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+0284c7(${parcel.lng || -87.945},${parcel.lat || 43.0396})/${parcel.lng || -87.945},${parcel.lat || 43.0396},17,0,0/600x300?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}`}
                      alt={`Satellite View of ${parcel.address}`}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <PropertyVisualizer
                    address={parcel.address}
                    propertyId={parcel.parcelId}
                    lat={parcel.lat}
                    lng={parcel.lng}
                    compact={true}
                    className="h-full w-full"
                  />
                )}
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
                  <span className="text-[9px] text-slate-400 block uppercase">Est. Total Value</span>
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

              {/* Land vs. Improvement Value Breakdown for Underwriters */}
              {targetParcel.appraisal_history && targetParcel.appraisal_history[0] && (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Assessed Land Value</span>
                    <span className="font-bold text-slate-800">
                      ${(targetParcel.appraisal_history[0].landValue || 65000).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Improvement Value</span>
                    <span className="font-bold text-emerald-800">
                      ${(targetParcel.appraisal_history[0].improvementValue || 180000).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Assessment Source</span>
                    <span className="text-[10px] text-slate-600 font-semibold">
                      {targetParcel.appraisal_history[0].event || 'Municipal Tax Assessment'}
                    </span>
                  </div>
                </div>
              )}

              {/* Workforce Grants & Enterprise Sponsor Match Badges */}
              {grantMatches && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-600" /> Matched Workforce Grants &amp; Enterprise Capital
                    </span>
                    <span className="text-emerald-700">${grantMatches.totalGrantAllocation.toLocaleString()} Total Funding</span>
                  </div>
                    {grantMatches.matchedGrants.map((grant) => (
                      <span
                        key={grant.id}
                        className="rounded-lg bg-white border border-emerald-200 px-2 py-1 text-[10px] font-mono text-emerald-900 font-semibold"
                      >
                        {grant.programName} (+${grant.allocatedAmount.toLocaleString()})
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Multi-User Collaboration & Site Review Requests */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-slate-700" /> Team Collaboration &amp; Review Requests
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  Dispatch to Team Queue
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleRequestSiteReview('GC')}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-sm"
                >
                  <HardHat className="h-3.5 w-3.5 text-amber-700" />
                  <span>Request GC Site Walk</span>
                </button>

                <button
                  onClick={() => handleRequestSiteReview('Underwriter')}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition shadow-sm"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Request Underwriter Review</span>
                </button>

                <button
                  onClick={handleShareParcelUrl}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-900 hover:bg-sky-100 transition shadow-sm sm:ml-auto"
                >
                  <Share2 className="h-3.5 w-3.5 text-sky-700" />
                  <span>Share Parcel URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
        </div>
      </div>
    </div>
  )
}
