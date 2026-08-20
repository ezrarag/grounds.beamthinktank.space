'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  Compass,
  Hammer,
  HardHat,
  Layers,
  Music,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'

export interface RoleOption {
  id: string
  title: string
  category: string
  pathwayDoor: 'learn' | 'earn' | 'teach' | 'own' | 'partner'
  description: string
  icon: typeof HardHat
  badgeColor: string
}

export const DISCOVERABLE_ROLES: RoleOption[] = [
  {
    id: 'demolition-framing',
    title: 'Demolition & Framing Cohort',
    category: 'Trade & Revitalization',
    pathwayDoor: 'earn',
    description: 'Envelope stabilization, interior tear-out, and heavy timber framing.',
    icon: Hammer,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'luthier-woodworking',
    title: 'Luthier & Fine Woodworker',
    category: 'Acoustics & Craftsmanship',
    pathwayDoor: 'learn',
    description: 'Acoustic instrument restoration, resonant woodcraft, and custom studio shelving.',
    icon: Sparkles,
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'site-steward',
    title: 'Civic Site Steward & Safety Warden',
    category: 'Property Management',
    pathwayDoor: 'partner',
    description: 'Site security, volunteer coordination, and daily property maintenance.',
    icon: ShieldCheck,
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'master-plumber',
    title: 'Master Plumber (Teach Pathway)',
    category: 'Skilled Trade Faculty',
    pathwayDoor: 'teach',
    description: 'Lead mechanical restoration and mentor junior cohort residents on pipefitting.',
    icon: Wrench,
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  {
    id: 'acoustic-studio-lead',
    title: 'Acoustic Studio Setup Lead',
    category: 'Sound Architecture',
    pathwayDoor: 'own',
    description: 'Soundproofing panel installation, audio wiring, and rehearsal room staging.',
    icon: Music,
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
]

export function RoleDiscoveryBoard() {
  const { user } = usePortalAccessState()
  const [expressedRoles, setExpressedRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Fetch current expressed roles from Firestore
  useEffect(() => {
    if (!user || !db) {
      setLoading(false)
      return
    }

    let isCancelled = false

    async function loadExpressed() {
      try {
        const snap = await getDoc(doc(db!, 'participantProfiles', user!.uid))
        if (snap.exists() && !isCancelled) {
          const data = snap.data()
          if (Array.isArray(data.expressedRoles)) {
            setExpressedRoles(data.expressedRoles)
          }
        }
      } catch (err) {
        console.warn('Unable to load expressedRoles:', err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void loadExpressed()
    return () => {
      isCancelled = true
    }
  }, [user])

  async function handleExpressInterest(role: RoleOption) {
    if (!user || !db) {
      setToast('Please sign in to express interest in roles.')
      setTimeout(() => setToast(null), 3000)
      return
    }

    setSavingId(role.id)
    const isAlreadyExpressed = expressedRoles.includes(role.title)

    try {
      const newExpressed = isAlreadyExpressed
        ? expressedRoles.filter((r) => r !== role.title)
        : [...expressedRoles, role.title]

      // Update Firestore participantProfiles/{uid}
      await setDoc(
        doc(db, 'participantProfiles', user.uid),
        {
          uid: user.uid,
          expressedRoles: newExpressed,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setExpressedRoles(newExpressed)
      setToast(
        isAlreadyExpressed
          ? `Removed interest in ${role.title}`
          : `Expressed interest in ${role.title}! Cohort Managers have been alerted.`,
      )
      setTimeout(() => setToast(null), 3500)
    } catch (err) {
      console.error('Express interest failed:', err)
      setToast('Failed to save to Firestore.')
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-slate-800" />
            <h2 className="text-lg font-bold text-[#0f172a]">
              Participant Role Discovery Board
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Discover available BEAM Grounds revitalization roles and express interest to flag your profile for Cohort Managers.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-slate-700">
          {expressedRoles.length} Roles Flagged
        </span>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {toast}
        </div>
      )}

      {/* Role Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DISCOVERABLE_ROLES.map((role) => {
          const Icon = role.icon
          const isExpressed = expressedRoles.includes(role.title)
          const isSaving = savingId === role.id

          return (
            <div
              key={role.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition ${
                isExpressed
                  ? 'border-[#1e293b] bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                      isExpressed
                        ? 'bg-slate-800 text-sky-300 border-slate-700'
                        : role.badgeColor
                    }`}
                  >
                    {role.pathwayDoor} pathway
                  </span>
                  <Icon className={`h-5 w-5 ${isExpressed ? 'text-sky-300' : 'text-slate-700'}`} />
                </div>

                <h3 className="mt-3 text-sm font-bold leading-tight">{role.title}</h3>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isExpressed ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {role.description}
                </p>
              </div>

              <div className="mt-4 border-t border-current/10 pt-3">
                <button
                  onClick={() => handleExpressInterest(role)}
                  disabled={isSaving}
                  type="button"
                  className={`w-full rounded-xl py-2 text-center text-xs font-semibold shadow-sm transition ${
                    isExpressed
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-[#1e293b] text-white hover:bg-slate-900'
                  }`}
                >
                  {isSaving ? (
                    <span className="inline-flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </span>
                  ) : isExpressed ? (
                    <span className="inline-flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Interest Expressed
                    </span>
                  ) : (
                    'Express Interest'
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
