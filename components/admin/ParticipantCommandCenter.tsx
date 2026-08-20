'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Hammer,
  Home,
  Layers,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { collection, doc, getDocs, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { GroundsActiveAcquisition, GroundsProfile } from '@/lib/types/groundsProfile'
import { CITY_HOMESTEAD_SITES, type PropertySiteOption } from '@/components/profile/PropertyMatcherModal'

export interface ParticipantRecord {
  uid: string
  displayName: string
  handle: string
  email: string
  pathwayRole: string
  approvedHours: number
  sweatEquityUSD: number
  linkedPropertyAddress?: string
  linkedParcelId?: string
  expressedRoles?: string[]
}

export const SEEDED_PARTICIPANTS: ParticipantRecord[] = [
  {
    uid: 'ezra-001',
    displayName: 'Ezra Haugabrooks',
    handle: '@ezra.haugabrooks',
    email: 'ezra.haugabrooks@gmail.com',
    pathwayRole: 'own',
    approvedHours: 72,
    sweatEquityUSD: 2160,
    linkedPropertyAddress: '639 N 25th St, Milwaukee, WI',
    linkedParcelId: '388-1204-000',
    expressedRoles: ['Luthier & Fine Woodworker', 'Site Steward'],
  },
  {
    uid: 'participant-002',
    displayName: 'Marcus Vance',
    handle: '@marcus_vance',
    email: 'marcus.vance@example.com',
    pathwayRole: 'earn',
    approvedHours: 110,
    sweatEquityUSD: 3300,
    linkedPropertyAddress: '800 W Wells St, Milwaukee, WI',
    linkedParcelId: '392-0501-100',
    expressedRoles: ['Demolition & Framing Cohort'],
  },
  {
    uid: 'participant-003',
    displayName: 'Elena Rios',
    handle: '@elena_rios',
    email: 'elena.rios@example.com',
    pathwayRole: 'teach',
    approvedHours: 95,
    sweatEquityUSD: 2850,
    expressedRoles: ['Master Plumber (Teach Pathway)', 'Architectural Survey'],
  },
]

export function ParticipantCommandCenter() {
  const [participants, setParticipants] = useState<ParticipantRecord[]>(SEEDED_PARTICIPANTS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantRecord | null>(null)
  const [selectedSite, setSelectedSite] = useState<PropertySiteOption>(CITY_HOMESTEAD_SITES[0])
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Load live participants from Firestore participantProfiles
  useEffect(() => {
    if (!db) return
    let isCancelled = false

    async function loadLiveParticipants() {
      try {
        const snap = await getDocs(collection(db!, 'participantProfiles'))
        if (!snap.empty && !isCancelled) {
          const liveList: ParticipantRecord[] = []
          snap.forEach((docSnap) => {
            const data = docSnap.data()
            liveList.push({
              uid: docSnap.id,
              displayName: data.displayName || data.name || docSnap.id,
              handle: `@${(data.email ? data.email.split('@')[0] : docSnap.id).toLowerCase()}`,
              email: data.email || '',
              pathwayRole: data.pathwayRole || 'own',
              approvedHours: data.sweatEquityLedger?.approvedHours || 72,
              sweatEquityUSD: (data.sweatEquityLedger?.approvedHours || 72) * 30,
              linkedPropertyAddress: data.activeAcquisition?.address,
              linkedParcelId: data.activeAcquisition?.parcelId,
              expressedRoles: Array.isArray(data.expressedRoles) ? data.expressedRoles : [],
            })
          })
          if (liveList.length > 0) setParticipants(liveList)
        }
      } catch (err) {
        console.warn('Unable to load participantProfiles for admin:', err)
      }
    }

    void loadLiveParticipants()
    return () => {
      isCancelled = true
    }
  }, [])

  async function handleExecutePropertyLink() {
    if (!selectedParticipant || !db) return

    setSaving(true)
    setFeedback(null)

    const now = new Date()
    const deadline180 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)

    const acquisitionData: GroundsActiveAcquisition = {
      address: selectedSite.address,
      propertyAddress: selectedSite.address,
      propertyId: selectedSite.parcelId,
      parcelId: selectedSite.parcelId,
      closingDate: now.toISOString().split('T')[0],
      repairDeadline180Day: deadline180.toISOString().split('T')[0],
      essentialRepairsCost: selectedSite.essentialRepairsCost,
      deedCovenantExpiry: '2031-06-01',
      currentStatus: '180-Day Municipal Repair Window',
    }

    try {
      // Write to participantProfiles/{uid}
      await setDoc(
        doc(db, 'participantProfiles', selectedParticipant.uid),
        {
          uid: selectedParticipant.uid,
          activeAcquisition: acquisitionData,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      // Also sync to groundsProfile/{uid}
      await setDoc(
        doc(db, 'groundsProfile', selectedParticipant.uid),
        {
          uid: selectedParticipant.uid,
          activeAcquisition: acquisitionData,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      // Update local state list
      setParticipants((prev) =>
        prev.map((p) =>
          p.uid === selectedParticipant.uid
            ? {
                ...p,
                linkedPropertyAddress: selectedSite.address,
                linkedParcelId: selectedSite.parcelId,
              }
            : p,
        ),
      )

      setFeedback(`Linked ${selectedSite.name} to ${selectedParticipant.displayName}'s profile!`)
      setTimeout(() => {
        setLinkModalOpen(false)
        setFeedback(null)
      }, 1200)
    } catch (err) {
      console.error('Admin property link failed:', err)
      setFeedback('Failed to execute property link in Firestore.')
    } finally {
      setSaving(false)
    }
  }

  const filteredParticipants = participants.filter(
    (p) =>
      p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pathwayRole.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-800" />
            <h2 className="text-lg font-bold text-[#0f172a]">
              Cohort Manager &amp; Participant Command Center
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Route pathways, monitor sweat-equity balances, and link city homestead properties to participant Path-to-Deed trackers.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Participants Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 font-mono uppercase tracking-wider text-slate-500 text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3">Pathway Door</th>
              <th className="px-4 py-3">Sweat Equity</th>
              <th className="px-4 py-3">Active Linked Property</th>
              <th className="px-4 py-3">Expressed Roles</th>
              <th className="px-4 py-3 text-right">Cohort Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredParticipants.map((p) => (
              <tr key={p.uid} className="hover:bg-slate-50/80 transition">
                <td className="px-4 py-3.5">
                  <div className="font-bold text-[#0f172a]">{p.displayName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{p.handle}</div>
                </td>

                <td className="px-4 py-3.5">
                  <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 border border-slate-200">
                    {p.pathwayRole}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div className="font-extrabold text-[#0f172a]">{p.approvedHours} hrs</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    ${p.sweatEquityUSD.toLocaleString()} USD
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  {p.linkedPropertyAddress ? (
                    <div>
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {p.linkedPropertyAddress}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        TAXKEY {p.linkedParcelId}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No Property Linked</span>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  {p.expressedRoles && p.expressedRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.expressedRoles.map((role) => (
                        <span
                          key={role}
                          className="rounded bg-purple-50 text-purple-700 px-2 py-0.5 text-[9px] font-semibold border border-purple-200"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">None expressed</span>
                  )}
                </td>

                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => {
                      setSelectedParticipant(p)
                      setLinkModalOpen(true)
                    }}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-[#1e293b] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-900 shadow-sm transition"
                  >
                    <Plus className="h-3 w-3" />
                    {p.linkedPropertyAddress ? 'Swap Property' : 'Link Property'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Property Link Modal for Cohort Managers */}
      {linkModalOpen && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0f172a]">
                Link Property to {selectedParticipant.displayName}
              </h3>
              <button
                onClick={() => setLinkModalOpen(false)}
                type="button"
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                Select an available $1 dollar city homestead site to assign to{' '}
                <strong>{selectedParticipant.displayName}</strong>. This populates their Firestore{' '}
                <code>activeAcquisition</code> profile object and activates their Path-to-Deed 180-day countdown.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Target City Homestead Site
                </label>
                <select
                  value={selectedSite.id}
                  onChange={(e) => {
                    const matched = CITY_HOMESTEAD_SITES.find((s) => s.id === e.target.value)
                    if (matched) setSelectedSite(matched)
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
                >
                  {CITY_HOMESTEAD_SITES.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} — {site.address} (${site.essentialRepairsCost.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {feedback && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800">
                  {feedback}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setLinkModalOpen(false)}
                type="button"
                className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePropertyLink}
                disabled={saving}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1e293b] px-5 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-md transition disabled:opacity-50"
              >
                {saving ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                Confirm Property Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
