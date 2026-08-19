'use client'

import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import type { GroundsActiveAcquisition } from '@/lib/types/groundsProfile'
import type { ParcelResult } from '@/app/api/parcel/route'

export interface PropertySiteOption {
  id: string
  name: string
  address: string
  city: string
  state: string
  parcelId: string
  zoning: string
  essentialRepairsCost: number
  status: string
}

export const CITY_HOMESTEAD_SITES: PropertySiteOption[] = [
  // MILWAUKEE NODE
  {
    id: 'mke-cumc',
    name: 'Central United Methodist Sanctuary ($1 Homestead)',
    address: '639 N 25th St, Milwaukee, WI',
    city: 'Milwaukee',
    state: 'WI',
    parcelId: '388-1204-000',
    zoning: 'RT4 Civic / Residential',
    essentialRepairsCost: 18500,
    status: 'Available $1 City Homestead',
  },
  {
    id: 'mke-wells',
    name: 'Wells Street Civic Anchor Site',
    address: '800 W Wells St, Milwaukee, WI',
    city: 'Milwaukee',
    state: 'WI',
    parcelId: '392-0501-100',
    zoning: 'C9A Urban Commercial',
    essentialRepairsCost: 24000,
    status: 'Tax-Foreclosed Transfer Eligible',
  },
  {
    id: 'mke-wisconsin',
    name: 'Wisconsin Ave Live/Work Studio Parcel',
    address: '814 W Wisconsin Ave, Milwaukee, WI',
    city: 'Milwaukee',
    state: 'WI',
    parcelId: '392-0520-000',
    zoning: 'C9B Mixed Use',
    essentialRepairsCost: 12000,
    status: 'Sweat-Equity Path-to-Own',
  },

  // ATLANTA NODE
  {
    id: 'atl-auburn',
    name: 'Auburn Ave Cultural Preservation Site',
    address: '450 Auburn Ave NE, Atlanta, GA',
    city: 'Atlanta',
    state: 'GA',
    parcelId: '14-0052-0004-012',
    zoning: 'HC-20A Historic',
    essentialRepairsCost: 21500,
    status: 'BEAM Land Trust Priority',
  },
  {
    id: 'atl-westend',
    name: 'West End Artist Residency Parcel',
    address: '890 Ralph David Abernathy Blvd, Atlanta, GA',
    city: 'Atlanta',
    state: 'GA',
    parcelId: '14-0118-0002-045',
    zoning: 'MRC-1 Mixed Residential',
    essentialRepairsCost: 16800,
    status: 'Available Cohort Site',
  },

  // TAMPA NODE
  {
    id: 'tpa-ybor',
    name: 'Ybor City Artisan Studio & Housing',
    address: '1901 E 7th Ave, Tampa, FL',
    city: 'Tampa',
    state: 'FL',
    parcelId: 'A-18-29-19-4A0-000034',
    zoning: 'YC-1 Historic Commercial',
    essentialRepairsCost: 19200,
    status: 'Gulf Coast Anchor Site',
  },

  // ORLANDO NODE
  {
    id: 'orl-parramore',
    name: 'Parramore Community Land Trust Site',
    address: '620 W South St, Orlando, FL',
    city: 'Orlando',
    state: 'FL',
    parcelId: '26-22-29-5840-01-120',
    zoning: 'R-3A Urban Residential',
    essentialRepairsCost: 15500,
    status: 'Residency Acquisition Eligible',
  },
]

export interface PropertyMatcherModalProps {
  isOpen: boolean
  onClose: () => void
  onLinked?: (acquisition: GroundsActiveAcquisition) => void
  initialCity?: string | null
}

export function PropertyMatcherModal({
  isOpen,
  onClose,
  onLinked,
  initialCity,
}: PropertyMatcherModalProps) {
  const { user } = usePortalAccessState()
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>(initialCity || 'All')
  const [selectedSite, setSelectedSite] = useState<PropertySiteOption>(CITY_HOMESTEAD_SITES[0])
  const [customAddress, setCustomAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [customResult, setCustomResult] = useState<ParcelResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredSites =
    selectedCityFilter === 'All'
      ? CITY_HOMESTEAD_SITES
      : CITY_HOMESTEAD_SITES.filter(
          (s) => s.city.toLowerCase() === selectedCityFilter.toLowerCase(),
        )

  async function handleLookupCustom() {
    if (!customAddress.trim()) return
    setSearching(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/parcel?address=${encodeURIComponent(customAddress.trim())}`)
      if (res.ok) {
        const json = (await res.json()) as ParcelResult
        setCustomResult(json)
      } else {
        setFeedback('Address lookup failed. Selected seeded site fallback.')
      }
    } catch {
      setFeedback('Error connecting to parcel lookup endpoint.')
    } finally {
      setSearching(false)
    }
  }

  async function handleLinkProperty() {
    if (!user || !db) {
      setFeedback('Please sign in to link a property to your profile.')
      return
    }

    setSaving(true)
    setFeedback(null)

    const now = new Date()
    const deadline180 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)

    const acquisitionData: GroundsActiveAcquisition = {
      address: customResult?.address || selectedSite.address,
      propertyAddress: customResult?.address || selectedSite.address,
      propertyId: customResult?.parcelId || selectedSite.parcelId,
      parcelId: customResult?.parcelId || selectedSite.parcelId,
      closingDate: now.toISOString().split('T')[0],
      repairDeadline180Day: deadline180.toISOString().split('T')[0],
      essentialRepairsCost: selectedSite.essentialRepairsCost,
      deedCovenantExpiry: '2031-06-01',
      currentStatus: '180-Day Municipal Repair Window',
    }

    try {
      // Save to participantProfiles/{uid}
      await setDoc(
        doc(db, 'participantProfiles', user.uid),
        {
          uid: user.uid,
          activeAcquisition: acquisitionData,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      // Sync to groundsProfile/{uid}
      await setDoc(
        doc(db, 'groundsProfile', user.uid),
        {
          uid: user.uid,
          activeAcquisition: acquisitionData,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setFeedback('Property successfully linked to your profile!')
      if (onLinked) onLinked(acquisitionData)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Failed to link property:', err)
      setFeedback('Failed to update profile in Firestore.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-bold text-[#0f172a]">
              Multi-Location $1 Dollar Property Matcher
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-4 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Choose a target city node to browse active $1 dollar homestead sites and link them to your BEAM Grounds participant profile.
          </p>

          {/* City Node Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
              Target City:
            </span>
            {['All', 'Milwaukee', 'Atlanta', 'Tampa', 'Orlando'].map((cityName) => {
              const active = selectedCityFilter.toLowerCase() === cityName.toLowerCase()
              return (
                <button
                  key={cityName}
                  onClick={() => setSelectedCityFilter(cityName)}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-[#1e293b] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cityName}
                </button>
              )
            })}
          </div>

          {/* Seeded City Sites Grid */}
          <div className="space-y-2">
            <div className="max-h-64 overflow-y-auto no-scrollbar grid gap-3 sm:grid-cols-2 p-1">
              {filteredSites.map((site) => {
                const isSelected = selectedSite.id === site.id && !customResult
                return (
                  <button
                    key={site.id}
                    onClick={() => {
                      setSelectedSite(site)
                      setCustomResult(null)
                    }}
                    type="button"
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-[#1e293b] bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                          isSelected
                            ? 'bg-slate-800 text-sky-300 border border-slate-700'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {site.city}, {site.state}
                      </span>
                      <h4 className="mt-1.5 text-sm font-semibold leading-tight">{site.name}</h4>
                      <p
                        className={`mt-1 text-xs ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {site.address}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-current/10 pt-2 text-[11px] font-mono">
                      <span>TAXKEY {site.parcelId}</span>
                      <span className="font-bold">${site.essentialRepairsCost.toLocaleString()}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional Custom Address Lookup */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Or Lookup Custom City Parcel Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Enter address (e.g. 639 N 25th St, Milwaukee, WI)..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
              />
              <button
                onClick={handleLookupCustom}
                disabled={searching}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition disabled:opacity-50"
              >
                {searching ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Lookup
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800">
              {feedback}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleLinkProperty}
            disabled={saving}
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#1e293b] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-900 shadow-md transition disabled:opacity-50"
          >
            {saving ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            Link Property to My Profile
          </button>
        </div>
      </div>
    </div>
  )
}
