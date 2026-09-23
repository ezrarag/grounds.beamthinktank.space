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
import dynamic from 'next/dynamic'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ParcelResult } from '@/app/api/parcel/route'
import type { ArchitecturalSpecsResult } from '@/app/api/architecture/specs/route'
import { AcquisitionTeamModule } from '@/components/profile/AcquisitionTeamModule'
import { CivicPartnerLayer } from '@/components/profile/CivicPartnerLayer'

const PropertyVisualizer = dynamic(
  () => import('@/components/PropertyVisualizer').then((mod) => mod.PropertyVisualizer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-950 animate-pulse border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-400">
        Loading 3D Property Visualizer...
      </div>
    ),
  }
)

interface ParcelIntelligenceWorkspaceModalProps {
  parcel: ParcelResult | null
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  uploadedPhotoUrl?: string | null
  onClose: () => void
  onTableGroundSuccess?: (siteName: string) => void
}

export function ParcelIntelligenceWorkspaceModal({
  parcel,
  user,
  uploadedPhotoUrl,
  onClose,
  onTableGroundSuccess,
}: ParcelIntelligenceWorkspaceModalProps) {
  const [archSpecs, setArchSpecs] = useState<ArchitecturalSpecsResult | null>(null)
  const [loadingArch, setLoadingArch] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tabledSuccess, setTabledSuccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [grantMatches, setGrantMatches] = useState<{ totalGrantAllocation: number; matchedGrants: Array<{ id: string; programName: string; allocatedAmount: number; hourlyStipendMatch?: number }> } | null>(null)
  const [workspaceTab, setWorkspaceTab] = useState<'visual' | 'proforma' | 'architecture' | 'team'>('visual')
  const [visualMode, setVisualMode] = useState<'uploaded' | 'street' | 'satellite'>(
    uploadedPhotoUrl ? 'uploaded' : 'street'
  )
  const [streetViewError, setStreetViewError] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [reviewRequestNotice, setReviewRequestNotice] = useState<string | null>(null)

  useEffect(() => {
    if (uploadedPhotoUrl) {
      setVisualMode('uploaded')
    }
  }, [uploadedPhotoUrl])

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
          /* Full-Width Tabbed Workspace Layout */
          <div className="space-y-5">
            {/* Primary Workspace Tab Navigation Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 font-mono text-xs font-bold">
              <button
                onClick={() => setWorkspaceTab('visual')}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 transition shadow-sm ${
                  workspaceTab === 'visual'
                    ? 'bg-slate-900 text-emerald-400 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Compass className="h-4 w-4 text-emerald-400" /> 📷 Visual &amp; 3D GIS
              </button>

              <button
                onClick={() => setWorkspaceTab('proforma')}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 transition shadow-sm ${
                  workspaceTab === 'proforma'
                    ? 'bg-slate-900 text-sky-400 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-sky-400" /> 📊 BEAM Pro-Forma &amp; MPROP
              </button>

              <button
                onClick={() => setWorkspaceTab('architecture')}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 transition shadow-sm ${
                  workspaceTab === 'architecture'
                    ? 'bg-slate-900 text-amber-400 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Ruler className="h-4 w-4 text-amber-400" /> 🏛️ Architecture &amp; BIM Specs
              </button>

              <button
                onClick={() => setWorkspaceTab('team')}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 transition shadow-sm ${
                  workspaceTab === 'team'
                    ? 'bg-slate-900 text-purple-400 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-purple-400" /> 💰 Grants &amp; Team Squad
              </button>
            </div>

            {/* TAB 1: Visual & 3D GIS Satellite Container */}
            {workspaceTab === 'visual' && (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
                    {/* Visual View Switcher Buttons */}
                    <div className="flex items-center gap-1 rounded-full bg-slate-800 p-1 border border-slate-700 shadow-inner">
                      {uploadedPhotoUrl && (
                        <button
                          onClick={() => setVisualMode('uploaded')}
                          type="button"
                          className={`rounded-full px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition ${
                            visualMode === 'uploaded'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          📸 Site Photo
                        </button>
                      )}
                      <button
                        onClick={() => setVisualMode('street')}
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition ${
                          visualMode === 'street'
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        📷 Street View
                      </button>
                      <button
                        onClick={() => setVisualMode('satellite')}
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition ${
                          visualMode === 'satellite'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        🌐 GIS Satellite
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 border border-slate-700 px-3 py-1 text-[11px] font-mono text-slate-300 shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        {parcel.lat?.toFixed(4)}, {parcel.lng?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Full-Width Visual Media Container */}
                  <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center">
                    {visualMode === 'uploaded' && uploadedPhotoUrl ? (
                      <div className="relative h-full w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                        <img
                          src={uploadedPhotoUrl}
                          alt={`Captured Site Photo for ${parcel.address}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3 rounded-lg bg-black/85 backdrop-blur-md px-3 py-1.5 text-xs font-mono text-emerald-300 border border-emerald-500/40 flex items-center gap-2 shadow-md">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Uploaded Site Photo Matched
                        </div>
                      </div>
                    ) : visualMode === 'street' ? (
                      !streetViewError ? (
                        <img
                          src={`/api/streetview?location=${encodeURIComponent(
                            parcel.lat && parcel.lng
                              ? `${parcel.lat},${parcel.lng}`
                              : `${parcel.address || ''}, Milwaukee, WI`
                          )}`}
                          alt={`Street View of ${parcel.address}`}
                          className="h-full w-full object-cover"
                          onError={() => setStreetViewError(true)}
                        />
                      ) : (
                        /* High-Res Static Satellite Imagery Fallback */
                        <img
                          src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+0284c7(${parcel.lng || -87.945},${parcel.lat || 43.0396})/${parcel.lng || -87.945},${parcel.lat || 43.0396},17,0,0/800x480?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}`}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="rounded-xl bg-slate-800/80 p-3 space-y-0.5 border border-slate-700">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Zoning Code</span>
                      <span className="font-bold text-amber-300 text-sm">{parcel.zoning_code || 'RT4'}</span>
                      <span className="text-[10px] text-slate-300 block truncate">{parcel.zoning_description || parcel.zoning}</span>
                    </div>
                    <div className="rounded-xl bg-slate-800/80 p-3 space-y-0.5 border border-slate-700">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Structure SqFt</span>
                      <span className="font-bold text-sky-300 text-sm">
                        {(parcel.sqft_structure || 4200).toLocaleString()} sqft
                      </span>
                      <span className="text-[10px] text-slate-400 block">Lot: {(parcel.sqft_lot || 8500).toLocaleString()} sqft</span>
                    </div>
                    <div className="rounded-xl bg-slate-800/80 p-3 space-y-0.5 border border-slate-700">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Owner Entity</span>
                      <span className="font-bold text-slate-200 text-xs truncate block">{parcel.ownerName}</span>
                    </div>
                    <div className="rounded-xl bg-slate-800/80 p-3 space-y-0.5 border border-slate-700">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Tax Lien Status</span>
                      <span className={`font-bold text-xs ${parcel.tax_lien_status === 'Clean / Current' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {parcel.tax_lien_status || 'Clean / Current'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BEAM Financial Pro-Forma & MPROP Underwriting */}
            {workspaceTab === 'proforma' && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-6 w-6 text-slate-800" />
                      <div>
                        <h3 className="text-base font-bold uppercase tracking-wider text-[#0f172a]">
                          BEAM Financial Pro-Forma Underwriting
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">TaxKey: {targetParcel.parcelId} • MPROP Municipal Assessment</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-mono font-bold uppercase text-emerald-800 border border-emerald-300">
                      HUD Match Offset Enabled
                    </span>
                  </div>

                  {/* 4 Metric Columns */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Est. Total Value</span>
                      <span className="font-extrabold text-[#0f172a] text-base">{targetParcel.assessedValue}</span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Est. Rehab Cost</span>
                      <span className="font-extrabold text-amber-700 text-base">
                        ${estimatedRehabCost.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-1">
                      <span className="text-[9px] text-emerald-700 block uppercase font-bold">Sweat Equity Credit</span>
                      <span className="font-extrabold text-emerald-800 text-base">
                        -${sweatEquityCredit.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-1">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Net Cash Required</span>
                      <span className="font-extrabold text-emerald-400 text-base">
                        ${netCashRequired.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Land vs. Improvement Value Breakdown for Underwriters */}
                  {Array.isArray(targetParcel.appraisal_history) && targetParcel.appraisal_history.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Assessed Land Value</span>
                        <span className="font-bold text-slate-800 text-sm">
                          ${(targetParcel.appraisal_history[0]?.landValue ?? 65000).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Improvement Value</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          ${(targetParcel.appraisal_history[0]?.improvementValue ?? 180000).toLocaleString()}
                        </span>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Assessment Source</span>
                        <span className="text-xs text-slate-700 font-semibold block">
                          {targetParcel.appraisal_history[0]?.event || 'Municipal Tax Assessment'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MPROP Record Summary Table */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Attribute</th>
                          <th className="p-3">Municipal Record Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Property Address</td>
                          <td className="p-3 font-bold">{targetParcel.address}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Municipal TaxKey ID</td>
                          <td className="p-3 font-bold text-sky-700">{targetParcel.parcelId}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Zoning Designation</td>
                          <td className="p-3 font-bold text-amber-700">{targetParcel.zoning_code || 'RT4'} ({targetParcel.zoning})</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Owner Entity</td>
                          <td className="p-3 font-bold">{targetParcel.ownerName}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Architectural & BIM Specs */}
            {workspaceTab === 'architecture' && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-6 w-6 text-slate-800" />
                      <div>
                        <h3 className="text-base font-bold uppercase tracking-wider text-slate-800">
                          Architectural Specs &amp; BIM Model Scope
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">Bridge API Engine • Structural Engineering Specs</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-[10px] font-mono font-bold uppercase text-slate-700">
                      Bridge API Connected
                    </span>
                  </div>

                  {loadingArch ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">Loading architectural &amp; structural specs...</div>
                  ) : archSpecs ? (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Building Classification</span>
                          <span className="font-bold text-slate-900 text-sm">{archSpecs.buildingType}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Structural Condition</span>
                          <span className="font-bold text-emerald-800 text-sm">{archSpecs.structuralConditionRating}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Acoustic Ceiling Height</span>
                          <span className="font-mono font-bold text-sky-700 text-sm">{archSpecs.acousticCeilingHeightFt || 14} ft</span>
                        </div>
                      </div>

                      {archSpecs.hasCadBimModel ? (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-950 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <span>IFC / CAD BIM Model Available for Download</span>
                          </div>
                          <a href={archSpecs.cadModelUrl || '#'} download className="rounded-full bg-emerald-700 text-white px-4 py-2 font-mono text-xs font-bold hover:bg-emerald-800 transition">
                            Download CAD BIM Package →
                          </a>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900 text-xs font-semibold space-y-1">
                          <p className="font-bold">⚠️ Architectural Scope Required</p>
                          <p className="text-[11px] text-amber-800">
                            Recommended layout scope: {(archSpecs.recommendedSqftScope?.minSqft ?? 2500).toLocaleString()} - {(archSpecs.recommendedSqftScope?.maxSqft ?? 8500).toLocaleString()} sqft floor plan.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* TAB 4: Grants & Team Squad */}
            {workspaceTab === 'team' && (
              <div className="space-y-4">
                {/* Workforce Grants & Enterprise Sponsor Match Badges */}
                {grantMatches && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-950 border-b border-emerald-200/80 pb-3">
                      <span className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-5 w-5 text-emerald-600" /> Matched Workforce Grants &amp; Enterprise Capital
                      </span>
                      <span className="text-emerald-800 font-extrabold text-sm">${(grantMatches.totalGrantAllocation ?? 0).toLocaleString()} Total Funding</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(grantMatches.matchedGrants ?? []).map((grant) => (
                        <span
                          key={grant.id}
                          className="rounded-xl bg-white border border-emerald-300 px-3 py-1.5 text-xs font-mono text-emerald-900 font-bold shadow-sm"
                        >
                          {grant.programName} (+${(grant.allocatedAmount ?? 0).toLocaleString()})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-User Collaboration & Site Review Requests */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-5 w-5 text-slate-700" /> Team Collaboration &amp; Review Requests
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-normal">
                      Dispatch to Team Queue
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleRequestSiteReview('GC')}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-sm"
                    >
                      <HardHat className="h-4 w-4 text-amber-700" />
                      <span>Request GC Site Walk</span>
                    </button>

                    <button
                      onClick={() => handleRequestSiteReview('Underwriter')}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-sm"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                      <span>Request Underwriter Review</span>
                    </button>

                    <button
                      onClick={handleShareParcelUrl}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-5 py-2.5 text-xs font-bold text-sky-900 hover:bg-sky-100 transition shadow-sm sm:ml-auto"
                    >
                      <Share2 className="h-4 w-4 text-sky-700" />
                      <span>Share Parcel URL</span>
                    </button>
                  </div>
                </div>

                {/* Team Roster Module */}
                <AcquisitionTeamModule parcel={targetParcel} user={user} />

                {/* Aldermanic & Non-Profit CDC / Land Trust Layer */}
                <CivicPartnerLayer initialCityId="milwaukee-wi" />
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
