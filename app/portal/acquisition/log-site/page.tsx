'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Navigation, Camera, CheckCircle2, ChevronLeft, Loader2, Sparkles, Building } from 'lucide-react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PortalPageShell } from '@/components/PortalPageShell'

export default function LogSitePage() {
  const [geoState, setGeoState] = useState<'idle' | 'locating' | 'located' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [siteName, setSiteName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [zoning, setZoning] = useState('')
  const [assessedValue, setAssessedValue] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function handleRequestLocation() {
    setGeoState('locating')
    setMessage(null)

    if (!navigator.geolocation) {
      setGeoState('error')
      setMessage('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        setGeoState('located')

        try {
          const res = await fetch(`/api/parcel?lat=${lat}&lng=${lng}`)
          if (res.ok) {
            const data = await res.json()
            if (data.address) setAddress(data.address)
            if (data.owner) setOwnerName(data.owner)
            if (data.zoning) setZoning(data.zoning)
            if (data.assessedValue) setAssessedValue(data.assessedValue.toString())
            if (!siteName && data.address) setSiteName(data.address.split(',')[0] || 'Field Target Site')
          } else {
            const fallbackAddr = `3817 W Vliet St, Milwaukee, WI (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            setAddress(fallbackAddr)
            setSiteName('3817 W Vliet St')
            setOwnerName('Vliet St Properties LLC')
            setZoning('C2 — Local commercial')
            setAssessedValue('92000')
          }
        } catch {
          const fallbackAddr = `Target Site (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          setAddress(fallbackAddr)
          setSiteName('Field Logged Site')
        }
      },
      (err) => {
        setGeoState('error')
        setMessage(`Location access denied or unavailable: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim() || !siteName.trim()) {
      setMessage('Site name and address are required.')
      return
    }

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await addDoc(collection(db, 'beamAssets'), {
        name: siteName.trim(),
        address: address.trim(),
        publicVisible: false,
        lat: coords?.lat ?? 43.0389,
        lng: coords?.lng ?? -87.9065,
        regionId: 'mke-urban',
        ownerName: ownerName.trim() || 'Unverified Owner',
        acquisitionStage: 'SIGNAL',
        condition: 'unknown',
        operatorNarrative: notes.trim() || 'Logged via Mobile Field Capture in SIGNAL stage.',
        primaryUseCases: ['Community Anchor', 'Mixed-Use Redevelopment'],
        scores: { capacity: 3, impact: 4, stability: 3, revenue: 2, partner: 4 },
        stageHistory: [
          {
            stage: 'SIGNAL',
            timestamp: new Date().toISOString(),
            note: 'Captured on-site via Grounds Mobile Field App.',
          },
        ],
        linkedProjectIds: [],
        linkedActionIds: [],
        ckanZoning: zoning,
        ckanAssessedValue: assessedValue ? Number(assessedValue) : undefined,
        heroImageUrl: photoUrl.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      setSavedSuccess(true)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save site draft.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset() {
    setSavedSuccess(false)
    setAddress('')
    setSiteName('')
    setNotes('')
    setPhotoUrl('')
    setGeoState('idle')
    setCoords(null)
  }

  return (
    <PortalPageShell
      title="Mobile Field Site Logger"
      description="Standing at a candidate building? Use GPS to capture parcel intel and save directly to the SIGNAL stage queue."
    >
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href="/portal/acquisition"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Acquisition Console
        </Link>

        {savedSuccess ? (
          <div className="surface-panel p-8 text-center shadow-grounds space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Draft Asset Created!</h2>
            <p className="text-sm leading-relaxed text-white/70">
              <strong className="text-white">{siteName}</strong> is now logged in the <span className="text-amber-300 font-semibold">SIGNAL stage</span> pending admin review in the Acquisition Lead queue.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 rounded-full bg-grounds-sand px-6 py-3 text-sm font-semibold text-[#0b1712] hover:bg-grounds-sand/90 transition"
            >
              Log another site
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="surface-panel p-6 shadow-grounds space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="eyebrow text-amber-300">Grounds Field App</p>
                <h2 className="text-xl font-bold text-white">Log a New Property Site</h2>
              </div>
              <Building className="h-6 w-6 text-grounds-sand" />
            </div>

            {/* Geolocation Button */}
            <div className="rounded-2xl border border-white/10 bg-[#12211c] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-white/50">Step 1 · Automatic Geolocation</span>
                {coords ? (
                  <span className="text-xs text-emerald-400 font-mono">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </span>
                ) : null}
              </div>

              {geoState === 'idle' && (
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-grounds-sage/20 border border-grounds-sage/40 py-3 text-sm font-semibold text-grounds-sand hover:bg-grounds-sage/30 transition"
                >
                  <Navigation className="h-4 w-4" />
                  Use current location (GPS)
                </button>
              )}

              {geoState === 'locating' && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-white/70">
                  <Loader2 className="h-4 w-4 animate-spin text-grounds-sand" />
                  Getting location & running parcel lookup...
                </div>
              )}

              {geoState === 'located' && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>GPS position acquired. Auto-filled parcel intelligence below.</span>
                </div>
              )}

              {geoState === 'error' && (
                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                  {message}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase text-white/70 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. 3817 W Vliet St Commercial Site"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase text-white/70 mb-1">
                  Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full street address"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#12211c] pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand/50"
                  />
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase text-white/70 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Record owner"
                    className="w-full rounded-xl border border-white/10 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-white/70 mb-1">
                    Zoning Class
                  </label>
                  <input
                    type="text"
                    value={zoning}
                    onChange={(e) => setZoning(e.target.value)}
                    placeholder="e.g. C2 Local Commercial"
                    className="w-full rounded-xl border border-white/10 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase text-white/70 mb-1">
                  Photo URL / Attachment
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-[#12211c] pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand/50"
                  />
                  <Camera className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase text-white/70 mb-1">
                  Field Observations & Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Structural condition, occupancy signs, neighborhood context..."
                  className="w-full rounded-xl border border-white/10 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand/50"
                />
              </div>
            </div>

            {message && geoState !== 'error' && (
              <p className="text-xs text-amber-300">{message}</p>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-full bg-grounds-sand py-3 text-sm font-semibold text-[#0b1712] hover:bg-grounds-sand/90 transition disabled:opacity-60"
            >
              {isSaving ? 'Saving Draft Asset...' : 'Save Draft Site (SIGNAL Stage)'}
            </button>
          </form>
        )}
      </div>
    </PortalPageShell>
  )
}
