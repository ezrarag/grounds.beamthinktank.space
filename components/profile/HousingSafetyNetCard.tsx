'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  HeartHandshake,
  HelpCircle,
  Info,
  LifeBuoy,
  PhoneCall,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usePortalAccessState } from '@/components/PortalAccessProvider'

export interface HousingSafetyNetCardProps {
  className?: string
}

export function HousingSafetyNetCard({ className = '' }: HousingSafetyNetCardProps) {
  const { user } = usePortalAccessState()
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load emergency status from Firestore if signed in
  useEffect(() => {
    if (!user || !db) return

    let isCancelled = false

    async function loadStatus() {
      try {
        const snap = await getDoc(doc(db!, 'participantProfiles', user!.uid))
        if (snap.exists() && !isCancelled) {
          const data = snap.data()
          if (typeof data.emergencyIntakeStatus === 'boolean') {
            setEmergencyActive(data.emergencyIntakeStatus)
          }
        }
      } catch (err) {
        console.warn('Unable to load emergency status:', err)
      }
    }

    void loadStatus()

    return () => {
      isCancelled = true
    }
  }, [user])

  // Toggle emergency intake status and update Firestore
  const handleToggleEmergency = async (active: boolean) => {
    setEmergencyActive(active)
    if (!user || !db) return

    setSaving(true)
    try {
      await setDoc(
        doc(db, 'participantProfiles', user.uid),
        { emergencyIntakeStatus: active, updatedAt: serverTimestamp() },
        { merge: true },
      )
      await setDoc(
        doc(db, 'groundsProfile', user.uid),
        { emergencyIntakeStatus: active, updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (err) {
      console.error('Failed to sync emergency status:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`rounded-[2rem] border transition-all duration-300 ${
        emergencyActive
          ? 'border-amber-400/50 bg-[#1f160a] shadow-2xl'
          : 'border-white/10 bg-white/[0.02]'
      } p-6 shadow-grounds sm:p-8 ${className}`}
    >
      {/* Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
              emergencyActive
                ? 'border-amber-400/40 bg-amber-400/20 text-amber-200'
                : 'border-white/15 bg-white/5 text-white/70'
            }`}
          >
            {emergencyActive ? <ShieldAlert className="h-5 w-5 animate-pulse" /> : <LifeBuoy className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white sm:text-lg">Immediate Housing Safety Net & Triage</h3>
            <p className="text-xs text-white/60">
              Are you facing immediate housing loss, eviction notice, or homelessness?
            </p>
          </div>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={emergencyActive}
            onChange={(e) => handleToggleEmergency(e.target.checked)}
            disabled={saving}
            className="peer sr-only"
          />
          <div className="peer h-7 w-14 rounded-full border border-white/20 bg-black/40 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white/60 after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-7 peer-checked:after:bg-white peer-focus:outline-none" />
          <span className="ml-3 text-xs font-semibold text-white/80">
            {emergencyActive ? 'Urgent Need Flagged' : 'Off'}
          </span>
        </label>
      </div>

      {/* Expanded Urgent Support Panel */}
      {emergencyActive && (
        <div className="mt-6 space-y-6 border-t border-amber-500/20 pt-6">
          {/* Timeline Communication Notice */}
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div className="space-y-1 text-xs leading-6 text-amber-100">
                <p className="font-semibold text-amber-200">Important Timeline Note:</p>
                <p>
                  BEAM housing cohorts operate on a multi-week/month cohort redevelopment & rehab timeline and are{' '}
                  <strong>not a same-day emergency shelter provider</strong>.
                </p>
                <p>
                  If you need immediate tonight or same-week shelter, please connect directly with Milwaukee’s verified
                  coordinated entry safety nets below while we review your BEAM emergency triage status.
                </p>
              </div>
            </div>
          </div>

          {/* Verified Support Hotlines */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              Verified Milwaukee Safety Net Hotlines & Services
            </h4>

            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {/* IMPACT 2-1-1 */}
              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">IMPACT 2-1-1</span>
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">
                      Coordinated Entry
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    Central shelter intake, emergency housing, and crisis support for Milwaukee County.
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <a
                    href="tel:211"
                    className="flex items-center gap-2 text-sm font-bold text-amber-300 hover:underline"
                  >
                    <PhoneCall className="h-4 w-4" /> Dial 2-1-1 (or 1-866-211-3380)
                  </a>
                  <a
                    href="https://www.impactinc.org/impact-2-1-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/50 hover:text-white"
                  >
                    impactinc.org/impact-2-1-1 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Rental Housing Resource Center */}
              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Rental Housing Resource Center</span>
                    <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] text-blue-200">
                      Eviction Defense
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    Legal aid, rent assistance, and eviction prevention services for tenants.
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <a
                    href="tel:414-895-7368"
                    className="flex items-center gap-2 text-sm font-bold text-blue-300 hover:underline"
                  >
                    <PhoneCall className="h-4 w-4" /> 414-895-RENT (7368)
                  </a>
                  <a
                    href="https://www.renthelpmke.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/50 hover:text-white"
                  >
                    renthelpmke.org <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Sojourner Family Peace Center */}
              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Sojourner Family Peace Center</span>
                    <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2 py-0.5 text-[10px] text-purple-200">
                      Domestic Violence Shelter
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    24/7 hotline and confidential emergency shelter for safety & domestic peace.
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <a
                    href="tel:414-933-2722"
                    className="flex items-center gap-2 text-sm font-bold text-purple-300 hover:underline"
                  >
                    <PhoneCall className="h-4 w-4" /> 414-933-2722
                  </a>
                  <a
                    href="https://www.familypeacecenter.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/50 hover:text-white"
                  >
                    familypeacecenter.org <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* BEAM Priority Triage Status Confirmation */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-100">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <span className="font-semibold text-amber-200">BEAM Triage Priority Flag Active: </span>
              Your participant profile is flagged for expedited review as housing units & cohort openings become available in Grounds buildings.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
