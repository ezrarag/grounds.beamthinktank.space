'use client'

import { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock,
  Hammer,
  HardHat,
  Home,
  Layers,
  Music,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wrench,
  X,
} from 'lucide-react'
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import type { GroundsWorkRosterAttachment } from '@/lib/types/groundsProfile'
import { CITY_HOMESTEAD_SITES, type PropertySiteOption } from '@/components/profile/PropertyMatcherModal'

export interface PropertyWorkRosterModalProps {
  isOpen: boolean
  onClose: () => void
  onAttached?: (attachment: GroundsWorkRosterAttachment) => void
  targetProperty?: PropertySiteOption | null
}

export const SKILLED_CAPACITIES = [
  {
    id: 'material-movement',
    label: 'Material Movement & Logistics',
    description: 'Moving equipment, clearing debris, staging site materials.',
    icon: Truck,
  },
  {
    id: 'trade-carpentry',
    label: 'Trade & Carpentry / Restoration',
    description: 'Framing, drywall, finish carpentry, luthier adjustments, plumbing/electrical assistance.',
    icon: Hammer,
  },
  {
    id: 'acoustic-setup',
    label: 'Acoustic & Studio Setup',
    description: 'Soundproofing panel installation, recording gear wiring, performance space staging.',
    icon: Music,
  },
  {
    id: 'planning-survey',
    label: 'Planning & Architectural Survey',
    description: 'Civic records research, spatial measurement, permit documentation.',
    icon: Layers,
  },
  {
    id: 'site-stewardship',
    label: 'Site Stewardship & Volunteer Labor',
    description: 'General site maintenance, security watch, volunteer sweat-equity labor shifts.',
    icon: HardHat,
  },
]

export function PropertyWorkRosterModal({
  isOpen,
  onClose,
  onAttached,
  targetProperty,
}: PropertyWorkRosterModalProps) {
  const { user } = usePortalAccessState()
  const [selectedSite, setSelectedSite] = useState<PropertySiteOption>(
    targetProperty || CITY_HOMESTEAD_SITES[0],
  )
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([
    'Material Movement & Logistics',
    'Site Stewardship & Volunteer Labor',
  ])
  const [notifyWork, setNotifyWork] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!isOpen) return null

  function toggleCapacity(label: string) {
    setSelectedCapacities((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label],
    )
  }

  async function handleAttachToRoster() {
    if (!user || !db) {
      setFeedback('Please sign in to attach your profile to a property work roster.')
      return
    }

    if (selectedCapacities.length === 0) {
      setFeedback('Please select at least one skilled capacity or labor role.')
      return
    }

    setSaving(true)
    setFeedback(null)

    const attachment: GroundsWorkRosterAttachment = {
      assetId: selectedSite.id,
      propertyName: selectedSite.name,
      address: selectedSite.address,
      city: selectedSite.city,
      skillsOrRoles: selectedCapacities,
      notifyOnWorkAvailable: notifyWork,
      attachedAt: new Date().toISOString(),
    }

    try {
      // Save attachment to participantProfiles/{uid}
      const profileRef = doc(db, 'participantProfiles', user.uid)
      await setDoc(
        profileRef,
        {
          uid: user.uid,
          workRosterSites: arrayUnion(attachment),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      // Also update groundsProfile/{uid}
      const groundsRef = doc(db, 'groundsProfile', user.uid)
      await setDoc(
        groundsRef,
        {
          uid: user.uid,
          workRosterSites: arrayUnion(attachment),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      // Also register participant on property doc beamAssets/{assetId} roster
      const assetRef = doc(db, 'beamAssets', selectedSite.id)
      await setDoc(
        assetRef,
        {
          workRosterSubscribers: arrayUnion({
            uid: user.uid,
            displayName: user.displayName || 'Participant',
            email: user.email || '',
            roles: selectedCapacities,
            notifyOnWorkAvailable: notifyWork,
            attachedAt: new Date().toISOString(),
          }),
        },
        { merge: true },
      ).catch(() => undefined)

      setFeedback('Your profile is now attached to this site work roster!')
      if (onAttached) onAttached(attachment)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Failed to attach to work roster:', err)
      setFeedback('Failed to update Firestore profile.')
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
            <HardHat className="h-5 w-5 text-slate-800" />
            <h2 className="text-lg font-bold text-[#0f172a]">
              Attach Profile to Site Work &amp; Revitalization Roster
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
            BEAM Grounds procures and revitalizes civic, trade, and commercial properties. Attach your profile to any site to offer skilled labor or material movement assistance, and receive alerts when work shifts are scheduled.
          </p>

          {/* Select Property */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Property Site
            </label>
            <select
              value={selectedSite.id}
              onChange={(e) => {
                const matched = CITY_HOMESTEAD_SITES.find((s) => s.id === e.target.value)
                if (matched) setSelectedSite(matched)
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
            >
              {CITY_HOMESTEAD_SITES.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} — {site.address} ({site.city})
                </option>
              ))}
            </select>
          </div>

          {/* Skilled Capacities Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Your Work Capacities &amp; Roles for This Site
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
              {SKILLED_CAPACITIES.map((cap) => {
                const Icon = cap.icon
                const isSelected = selectedCapacities.includes(cap.label)
                return (
                  <button
                    key={cap.id}
                    onClick={() => toggleCapacity(cap.label)}
                    type="button"
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-[#1e293b] bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        isSelected ? 'text-sky-300' : 'text-slate-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{cap.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {cap.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Work Alert Preference */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-slate-700" />
              <div>
                <span className="text-xs font-bold text-[#0f172a]">Work Availability Notifications</span>
                <p className="text-[11px] text-slate-500">
                  Receive email/portal alerts when site work or labor shifts open at this property.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyWork}
              onChange={(e) => setNotifyWork(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#1e293b] focus:ring-[#1e293b]"
            />
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
            onClick={handleAttachToRoster}
            disabled={saving}
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#1e293b] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-900 shadow-md transition disabled:opacity-50"
          >
            {saving ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
            Attach Profile to Site Work Roster
          </button>
        </div>
      </div>
    </div>
  )
}
