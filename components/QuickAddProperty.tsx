'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Camera, Search } from 'lucide-react'
import { db } from '@/lib/firebase'
import { useCities } from '@/lib/useCities'
import { AddressAutocomplete, type SelectedPlace } from '@/components/AddressAutocomplete'
import { PropertyMedia } from '@/components/PropertyMedia'
import type { ParcelResult } from '@/app/api/parcel/route'

const zeroScores = { capacity: 0, impact: 0, stability: 0, revenue: 0, partner: 0 }

export function QuickAddProperty() {
  const { cities } = useCities()
  const [name, setName] = useState('')
  const [regionId, setRegionId] = useState('')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({})
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [parcel, setParcel] = useState<ParcelResult | null>(null)
  const [publishPublic, setPublishPublic] = useState(true)
  const [publicSummary, setPublicSummary] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!regionId && cities.length) setRegionId(cities[0].id)
  }, [cities, regionId])

  function useStreetView() {
    if (!address.trim()) {
      setMessage('Enter an address first.')
      return
    }
    setHeroImageUrl(`/api/streetview?location=${encodeURIComponent(address.trim())}`)
  }

  async function lookupParcel() {
    if (!address.trim()) {
      setMessage('Enter an address first.')
      return
    }
    setMessage(null)
    setIsLookingUp(true)
    try {
      const response = await fetch(`/api/parcel?address=${encodeURIComponent(address.trim())}`)
      const payload = (await response.json()) as ParcelResult & { error?: string }
      if (!response.ok) {
        setMessage(payload.error ?? 'Parcel lookup failed.')
        return
      }
      if (!payload.found) {
        setMessage('No parcel match found for that address.')
        return
      }
      setParcel(payload)
      if (payload.lat && payload.lng) setCoords({ lat: payload.lat, lng: payload.lng })
      setMessage('Parcel details attached.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Parcel lookup failed.')
    } finally {
      setIsLookingUp(false)
    }
  }

  function handleSelectPlace(place: SelectedPlace) {
    setCoords({ lat: place.lat, lng: place.lng })
    // Snap the city dropdown to a matching registered city when possible.
    if (place.state) {
      const match = cities.find(
        (city) => city.state.toUpperCase() === place.state?.toUpperCase() && (!place.city || city.label.toLowerCase() === place.city?.toLowerCase()),
      )
      if (match) setRegionId(match.id)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }
    if (!name.trim() || !address.trim() || !regionId) {
      setMessage('Name, address, and city are required.')
      return
    }

    const city = cities.find((item) => item.id === regionId)
    const now = new Date().toISOString()

    setIsSaving(true)
    try {
      await addDoc(collection(db, 'beamAssets'), {
        name: name.trim(),
        address: address.trim(),
        ...(coords.lat !== undefined ? { lat: coords.lat } : {}),
        ...(coords.lng !== undefined ? { lng: coords.lng } : {}),
        regionId,
        city: city?.label ?? regionId,
        ownerName: parcel?.ownerName ?? '',
        acquisitionStage: 'SIGNAL',
        condition: 'unknown',
        locationType: 'property',
        stewardshipStatus: 'unmonitored',
        operatorNarrative: '',
        primaryUseCases: [],
        scores: zeroScores,
        stageHistory: [{ stage: 'SIGNAL', timestamp: now, note: 'Quick add' }],
        linkedProjectIds: [],
        linkedActionIds: [],
        ...(heroImageUrl.trim() ? { heroImageUrl: heroImageUrl.trim() } : {}),
        ...(parcel?.ownerName ? { ckanOwnerName: parcel.ownerName } : {}),
        ...(parcel?.zoning ? { ckanZoning: parcel.zoning } : {}),
        ...(parcel?.parcelId ? { ckanParcelId: parcel.parcelId } : {}),
        ...(parcel?.assessedValue ? { ckanAssessedValue: parcel.assessedValue } : {}),
        publicVisible: publishPublic,
        ...(publishPublic
          ? { publicTitle: name.trim(), publicSummary: publicSummary.trim(), publicNarrative: publicSummary.trim() }
          : {}),
        createdAt: now,
        updatedAt: serverTimestamp(),
      })

      setMessage(`Added ${name.trim()}${publishPublic ? ' — live on /properties.' : '.'}`)
      setName('')
      setAddress('')
      setHeroImageUrl('')
      setPublicSummary('')
      setParcel(null)
      setCoords({})
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add property.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50'

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">Quick add a property</p>
      <p className="mt-1 text-sm leading-6 text-white/56">The fast path: name, city, address, photo, publish.</p>

      <div className="mt-4 grid gap-3">
        <label className="block text-sm text-white/70">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required className={inputClass} />
        </label>

        <label className="block text-sm text-white/70">
          City
          <select value={regionId} onChange={(event) => setRegionId(event.target.value)} required className={inputClass}>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.label}, {city.state}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-white/70">
          Address
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={handleSelectPlace}
            placeholder="Start typing an address…"
            className={inputClass}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useStreetView}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/14 px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-white/[0.04]"
          >
            <Camera className="h-3.5 w-3.5 text-grounds-sand" />
            Use Street View photo
          </button>
          <button
            type="button"
            onClick={lookupParcel}
            disabled={isLookingUp}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/14 px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-white/[0.04] disabled:opacity-60"
          >
            <Search className="h-3.5 w-3.5 text-grounds-sand" />
            {isLookingUp ? 'Looking up…' : 'Look up parcel'}
          </button>
        </div>

        {heroImageUrl ? (
          <PropertyMedia source={{ heroImageUrl }} alt={name || 'preview'} className="h-40 w-full rounded-2xl" />
        ) : null}

        {parcel ? (
          <div className="rounded-2xl border border-white/10 bg-[#12211c] p-3 text-xs text-white/60">
            {[parcel.ownerName, parcel.zoning, parcel.parcelId, parcel.assessedValue].filter(Boolean).join(' · ') ||
              'Parcel attached.'}
          </div>
        ) : null}

        <label className="flex items-center gap-3 text-sm text-white/72">
          <input
            type="checkbox"
            checked={publishPublic}
            onChange={(event) => setPublishPublic(event.target.checked)}
            className="h-4 w-4 accent-grounds-sand"
          />
          Publish to public /properties
        </label>

        {publishPublic ? (
          <label className="block text-sm text-white/70">
            Public summary (optional)
            <textarea
              value={publicSummary}
              onChange={(event) => setPublicSummary(event.target.value)}
              rows={2}
              className={inputClass}
            />
          </label>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? 'Adding…' : 'Add property'}
      </button>
      {message ? <p className="mt-3 text-sm text-white/66">{message}</p> : null}
    </form>
  )
}
