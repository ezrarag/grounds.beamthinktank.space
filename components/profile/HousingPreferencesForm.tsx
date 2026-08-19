'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Layers,
  MapPin,
  Music,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  Volume2,
} from 'lucide-react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import { HousingSafetyNetCard } from '@/components/profile/HousingSafetyNetCard'
import type {
  GroundsProfile,
  GroundsSpaceRequirements,
  GroundsTargetLocation,
  PreferredHousingType,
} from '@/lib/types/groundsProfile'

export const BEAM_NODES = [
  { city: 'Milwaukee', state: 'WI', label: 'Milwaukee, WI (Central Anchor)' },
  { city: 'Atlanta', state: 'GA', label: 'Atlanta, GA (Southern Hub)' },
  { city: 'Tampa', state: 'FL', label: 'Tampa, FL (Gulf Region)' },
  { city: 'Orlando', state: 'FL', label: 'Orlando, FL (Central Florida)' },
  { city: 'Concord', state: 'NC', label: 'Concord, NC (Carolina Region)' },
]

export const PREFERRED_TYPES: Array<{ value: PreferredHousingType; label: string }> = [
  { value: 'residency', label: 'Standard Residency' },
  { value: 'live_work', label: 'Live / Work Studio' },
  { value: 'sweat_equity_path_to_own', label: 'Sweat-Equity Path-to-Own' },
  { value: 'emergency', label: 'Emergency Stabilization Intake' },
]

export function HousingPreferencesForm() {
  const { user } = usePortalAccessState()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Housing target locations state
  const [locations, setLocations] = useState<GroundsTargetLocation[]>([
    {
      city: 'Milwaukee',
      state: 'WI',
      priority: 1,
      targetDate: '2026-09',
      preferredType: 'residency',
    },
  ])

  // Space specifications state
  const [spaceSpecs, setSpaceSpecs] = useState({
    soloRoom: true,
    sharedCohortLiving: false,
    liveWorkStudio: true,
    soundproofingRehearsal: true,
  })

  // Extended space requirements
  const [spaceReqs, setSpaceReqs] = useState<GroundsSpaceRequirements>({
    acousticNeeds: true,
    instrumentStorage: true,
    accessibilityNeeds: 'Ground floor or elevator access preferred',
    familySize: 1,
  })

  // Load existing profile from Firestore
  useEffect(() => {
    if (!user || !db) {
      setLoading(false)
      return
    }

    let isCancelled = false

    async function loadProfile() {
      try {
        const ref = doc(db!, 'participantProfiles', user!.uid)
        const snap = await getDoc(ref)
        if (snap.exists() && !isCancelled) {
          const data = snap.data() as Partial<GroundsProfile> & Record<string, any>

          if (Array.isArray(data.targetLocations) && data.targetLocations.length > 0) {
            setLocations(data.targetLocations)
          }

          if (data.spaceRequirements) {
            setSpaceReqs((prev) => ({ ...prev, ...data.spaceRequirements }))
          }

          if (data.spaceSpecs) {
            setSpaceSpecs((prev) => ({ ...prev, ...data.spaceSpecs }))
          }
        }
      } catch (err) {
        console.warn('Unable to load participantProfile:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      isCancelled = true
    }
  }, [user])

  // Helper: Toast auto-clear
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Add new location target node
  const handleAddLocation = () => {
    const available = BEAM_NODES.find((node) => !locations.some((l) => l.city === node.city)) || BEAM_NODES[0]
    setLocations((prev) => [
      ...prev,
      {
        city: available.city,
        state: available.state,
        priority: prev.length + 1,
        targetDate: '2026-10',
        preferredType: 'live_work',
      },
    ])
  }

  // Remove location target
  const handleRemoveLocation = (index: number) => {
    setLocations((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, idx) => ({ ...item, priority: idx + 1 }))
    })
  }

  // Update location target field
  const handleLocationChange = (index: number, field: keyof GroundsTargetLocation, value: any) => {
    setLocations((prev) => {
      const updated = [...prev]
      if (field === 'city') {
        const matchedNode = BEAM_NODES.find((n) => n.city === value)
        updated[index] = {
          ...updated[index],
          city: value,
          state: matchedNode ? matchedNode.state : 'WI',
        }
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }

  // Save to Firestore with Optimistic UI & Toast Feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      showToast('You must be signed in to save preferences.', 'error')
      return
    }

    setSaving(true)
    showToast('Saving preferences...', 'success')

    try {
      if (db) {
        const profileRef = doc(db, 'participantProfiles', user.uid)
        await setDoc(
          profileRef,
          {
            uid: user.uid,
            email: user.email ?? null,
            displayName: user.displayName ?? null,
            targetLocations: locations,
            spaceRequirements: spaceReqs,
            spaceSpecs,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        // Also sync groundsProfile collection
        const groundsRef = doc(db, 'groundsProfile', user.uid)
        await setDoc(
          groundsRef,
          {
            uid: user.uid,
            targetLocations: locations,
            spaceRequirements: spaceReqs,
            spaceSpecs,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      }

      showToast('Housing preferences saved to BEAM Grounds network!', 'success')
    } catch (err) {
      console.error('Save failed:', err)
      showToast('Failed to save to Firestore. Check your connection.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="surface-panel p-8 text-center text-white/60 shadow-grounds">
        <Clock className="mx-auto h-6 w-6 animate-spin text-grounds-sand" />
        <p className="mt-3 text-sm">Loading your housing preferences...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel relative p-6 shadow-grounds sm:p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'border-emerald-400/40 bg-[#0c2419]/90 text-emerald-200'
              : 'border-red-400/40 bg-[#290c0c]/90 text-red-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-grounds-sand" />
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Residency & Housing</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-grounds-sand/30 bg-grounds-sand/10 px-2.5 py-0.5 text-xs text-grounds-sand">
              <Sparkles className="h-3 w-3" /> BEAM Node Network
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Housing Preferences</h2>
          <p className="mt-1 text-sm text-white/64">
            Select active BEAM nodes, target dates, and space specifications for housing placement.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full border border-grounds-sand bg-grounds-sand px-5 py-2.5 text-sm font-semibold text-[#0b1712] transition hover:bg-grounds-sand/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Safety Net & Triage Component */}
      <HousingSafetyNetCard className="mt-6" />

      {/* Section 1: Multi-City Node Selector */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <MapPin className="h-5 w-5 text-grounds-sand" /> Target BEAM Nodes & Locations
          </h3>
          <button
            type="button"
            onClick={handleAddLocation}
            disabled={locations.length >= BEAM_NODES.length}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add Location
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {locations.map((loc, idx) => (
            <div
              key={`loc-${idx}`}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-12 sm:items-center"
            >
              <div className="flex items-center gap-2 sm:col-span-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/20 text-xs font-semibold text-grounds-sand">
                  #{loc.priority}
                </span>
              </div>

              {/* City selector */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-white/50">BEAM Node</label>
                <select
                  value={loc.city}
                  onChange={(e) => handleLocationChange(idx, 'city', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/12 bg-[#12211c] px-3 py-2 text-sm text-white outline-none focus:border-grounds-sand"
                >
                  {BEAM_NODES.map((node) => (
                    <option key={node.city} value={node.city}>
                      {node.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred type */}
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-white/50">Preferred Arrangement</label>
                <select
                  value={loc.preferredType}
                  onChange={(e) => handleLocationChange(idx, 'preferredType', e.target.value as PreferredHousingType)}
                  className="mt-1 w-full rounded-xl border border-white/12 bg-[#12211c] px-3 py-2 text-sm text-white outline-none focus:border-grounds-sand"
                >
                  {PREFERRED_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target date */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-white/50">Target Date</label>
                <input
                  type="month"
                  value={loc.targetDate}
                  onChange={(e) => handleLocationChange(idx, 'targetDate', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/12 bg-[#12211c] px-3 py-2 text-sm text-white outline-none focus:border-grounds-sand"
                />
              </div>

              {/* Remove button */}
              <div className="flex justify-end sm:col-span-1">
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(idx)}
                    className="p-1.5 text-white/40 transition hover:text-red-400"
                    title="Remove location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Space Specifications & Toggles */}
      <section className="mt-8 border-t border-white/10 pt-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Building2 className="h-5 w-5 text-grounds-sand" /> Space Specifications & Toggles
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Solo Room */}
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <Home className="h-4 w-4 text-grounds-sand" />
              <div>
                <p className="text-sm font-medium text-white">Solo Room</p>
                <p className="text-xs text-white/50">Private bedroom space in building</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={spaceSpecs.soloRoom}
              onChange={(e) => setSpaceSpecs((prev) => ({ ...prev, soloRoom: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-[#12211c] text-grounds-sand focus:ring-grounds-sand"
            />
          </label>

          {/* Shared Cohort Living */}
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-grounds-sand" />
              <div>
                <p className="text-sm font-medium text-white">Shared Cohort Living</p>
                <p className="text-xs text-white/50">Communal kitchen and workshop spaces</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={spaceSpecs.sharedCohortLiving}
              onChange={(e) => setSpaceSpecs((prev) => ({ ...prev, sharedCohortLiving: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-[#12211c] text-grounds-sand focus:ring-grounds-sand"
            />
          </label>

          {/* Live / Work Studio */}
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-grounds-sand" />
              <div>
                <p className="text-sm font-medium text-white">Live / Work Studio</p>
                <p className="text-xs text-white/50">Integrated fabrication or work area</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={spaceSpecs.liveWorkStudio}
              onChange={(e) => setSpaceSpecs((prev) => ({ ...prev, liveWorkStudio: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-[#12211c] text-grounds-sand focus:ring-grounds-sand"
            />
          </label>

          {/* Soundproofing / Rehearsal Space */}
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-grounds-sand" />
              <div>
                <p className="text-sm font-medium text-white">Soundproofing / Rehearsal</p>
                <p className="text-xs text-white/50">Acoustic isolation for music or audio</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={spaceSpecs.soundproofingRehearsal}
              onChange={(e) => setSpaceSpecs((prev) => ({ ...prev, soundproofingRehearsal: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-[#12211c] text-grounds-sand focus:ring-grounds-sand"
            />
          </label>
        </div>
      </section>

      {/* Section 3: Specialized Space Requirements */}
      <section className="mt-8 border-t border-white/10 pt-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Music className="h-5 w-5 text-grounds-sand" /> Specialized Space Requirements
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-white/70">Accessibility Needs</label>
            <input
              type="text"
              value={spaceReqs.accessibilityNeeds}
              onChange={(e) => setSpaceReqs((prev) => ({ ...prev, accessibilityNeeds: e.target.value }))}
              placeholder="e.g. Ground floor access, ramp, wide doorframes..."
              className="mt-1 w-full rounded-2xl border border-white/12 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70">Family / Household Size</label>
            <input
              type="number"
              min={1}
              max={10}
              value={spaceReqs.familySize}
              onChange={(e) => setSpaceReqs((prev) => ({ ...prev, familySize: parseInt(e.target.value) || 1 }))}
              className="mt-1 w-full rounded-2xl border border-white/12 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand"
            />
          </div>
        </div>
      </section>

      {/* Submit Action */}
      <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full border border-grounds-sand bg-grounds-sand px-6 py-3 text-sm font-semibold text-[#0b1712] transition hover:bg-grounds-sand/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving Preferences...' : 'Save Housing Preferences'}
        </button>
      </div>
    </form>
  )
}
