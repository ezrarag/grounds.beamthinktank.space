'use client'

import { useState } from 'react'
import { X, User, MapPin, CheckCircle2, Save, ShieldCheck } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type UserTargetRegion = 'MKE' | 'ATL' | 'TPA'

interface EditProfileModalProps {
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  currentRegion: UserTargetRegion
  onClose: () => void
  onSaveProfile: (data: { displayName: string; handle: string; region: UserTargetRegion; bio: string }) => void
}

export function EditProfileModal({
  user,
  currentRegion,
  onClose,
  onSaveProfile,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user?.displayName || 'Ezra Haugabrooks')
  const [handle, setHandle] = useState(
    user?.email ? `@${user.email.split('@')[0]}` : '@ezra.haugabrooks'
  )
  const [region, setRegion] = useState<UserTargetRegion>(currentRegion)
  const [bio, setBio] = useState('Musician & civic space steward focused on residency and adaptive reuse.')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSaving(true)

    try {
      if (user?.uid && db) {
        await setDoc(
          doc(db, 'participantProfiles', user.uid),
          {
            displayName: displayName.trim(),
            handle: handle.trim(),
            preferredRegion: region,
            bio: bio.trim(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      }

      onSaveProfile({
        displayName: displayName.trim(),
        handle: handle.trim(),
        region,
        bio: bio.trim(),
      })

      setSavedSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update profile settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(237,243,234,0.18)] bg-[#0b1712] p-6 shadow-2xl text-[#edf3ea] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(237,243,234,0.12)] pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#c8b97a]" />
            <h3 className="font-serif text-lg font-medium">Participant Account Preferences</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1 text-[rgba(237,243,234,0.5)] hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="font-serif text-base text-[#edf3ea]">Profile Preferences Updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a] mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-2xl border border-[rgba(237,243,234,0.14)] bg-[#102119] px-4 py-2.5 text-xs text-[#edf3ea] focus:border-[#88aa8f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a] mb-1">
                Participant Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                className="w-full rounded-2xl border border-[rgba(237,243,234,0.14)] bg-[#102119] px-4 py-2.5 text-xs text-[#edf3ea] focus:border-[#88aa8f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a] mb-1">
                Primary Target Node Region
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'MKE', label: 'Milwaukee, WI' },
                  { id: 'ATL', label: 'Atlanta, GA' },
                  { id: 'TPA', label: 'Tampa, FL' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id as UserTargetRegion)}
                    type="button"
                    className={`rounded-2xl border p-2.5 text-center text-xs font-semibold transition ${
                      region === r.id
                        ? 'border-[#88aa8f] bg-[#88aa8f]/20 text-[#edf3ea]'
                        : 'border-[rgba(237,243,234,0.12)] bg-[#102119]/60 text-[rgba(237,243,234,0.6)] hover:bg-[#102119]'
                    }`}
                  >
                    <MapPin className="mx-auto h-3.5 w-3.5 mb-1 text-[#c8b97a]" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a] mb-1">
                Member Bio &amp; Stewardship Focus
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-[rgba(237,243,234,0.14)] bg-[#102119] px-4 py-2 text-xs text-[#edf3ea] focus:border-[#88aa8f] focus:outline-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/60">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(237,243,234,0.1)]">
              <button
                onClick={onClose}
                type="button"
                className="rounded-full border border-[rgba(237,243,234,0.16)] px-4 py-2 text-xs font-semibold text-[rgba(237,243,234,0.7)] hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#88aa8f] px-5 py-2 text-xs font-semibold text-[#07100c] hover:bg-[#77997e] transition disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
