'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, User, MapPin, CheckCircle2, Save, Compass, MessageSquareCode, History, Search } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type UserTargetRegion = 'MKE' | 'ATL' | 'TPA'
export type ConsoleViewMode = 'search' | 'squads' | 'homestead'

export interface SearchHistoryItem {
  id: string
  query: string
  address?: string
  taxkey?: string
  lat?: number
  lng?: number
  uploadedPhoto?: string
  mode: 'address' | 'map' | 'photo'
  timestamp: string
}

interface EditProfileModalProps {
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  currentRegion: UserTargetRegion
  developerFeedbackEnabled: boolean
  searchHistory?: SearchHistoryItem[]
  onClose: () => void
  onSaveProfile: (data: { displayName: string; handle: string; region: UserTargetRegion; bio: string; developerFeedbackEnabled: boolean }) => void
  onNavigateView?: (view: ConsoleViewMode) => void
  onReinspectParcel?: (query: string) => void
}

export function EditProfileModal({
  user,
  currentRegion,
  developerFeedbackEnabled,
  searchHistory = [],
  onClose,
  onSaveProfile,
  onNavigateView,
  onReinspectParcel,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user?.displayName || 'Ezra Haugabrooks')
  const [handle, setHandle] = useState(
    user?.email ? `@${user.email.split('@')[0]}` : '@ezra.haugabrooks'
  )
  const [region, setRegion] = useState<UserTargetRegion>(currentRegion)
  const [bio, setBio] = useState('Musician & civic space steward focused on residency and adaptive reuse.')
  const [devMode, setDevMode] = useState<boolean>(developerFeedbackEnabled)
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
            developerFeedbackEnabled: devMode,
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
        developerFeedbackEnabled: devMode,
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
            <h3 className="font-serif text-lg font-medium">Participant Preferences &amp; Options</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-1 text-[rgba(237,243,234,0.5)] hover:bg-white/10 hover:text-[#edf3ea] transition"
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
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
            {/* Quick Navigation: Change My Pathway */}
            <div className="rounded-2xl border border-[#88aa8f]/30 bg-[#88aa8f]/10 p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a]">
                  Portal Pathway Switcher
                </span>
                <p className="text-xs text-[rgba(237,243,234,0.8)] font-medium">Return to BEAM Dashboard</p>
              </div>
              <Link
                href="/portal/dashboard"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#88aa8f] px-4 py-2 text-xs font-semibold text-[#07100c] hover:bg-[#77997e] transition shadow-md"
              >
                <Compass className="h-3.5 w-3.5" />
                Change my pathway →
              </Link>
            </div>

            {/* Recent Search History & Saved Parcels */}
            <div className="rounded-2xl border border-[rgba(237,243,234,0.14)] bg-[#102119]/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#c8b97a]" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a]">
                    Search History &amp; Saved Parcels
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[rgba(237,243,234,0.5)]">
                  {searchHistory.length} Recorded
                </span>
              </div>

              {searchHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] p-2.5 text-xs border border-[rgba(237,243,234,0.08)] hover:bg-white/[0.08] transition"
                    >
                      <div className="truncate">
                        <span className="font-medium text-[#edf3ea]">{item.query}</span>
                        <span className="block text-[10px] text-[rgba(237,243,234,0.5)] font-mono">
                          Mode: {item.mode} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {onReinspectParcel && (
                        <button
                          type="button"
                          onClick={() => {
                            onReinspectParcel(item.query)
                            onClose()
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-[#88aa8f]/20 border border-[#88aa8f]/40 px-2.5 py-1 text-[10px] font-semibold text-[#88aa8f] hover:bg-[#88aa8f]/30 transition shrink-0"
                        >
                          <Search className="h-3 w-3" /> Re-inspect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[rgba(237,243,234,0.5)] py-1">
                  No recent searches recorded yet. Search addresses or click pins to build your profile history.
                </p>
              )}
            </div>

            {/* Quick Workspace Navigation Options Drawer */}
            {onNavigateView && (
              <div className="rounded-2xl border border-[rgba(237,243,234,0.14)] bg-[#102119]/80 p-4 space-y-2.5">
                <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#c8b97a]">
                  Workspace Console Views
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateView('squads')
                      onClose()
                    }}
                    className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-left text-xs font-semibold text-[#edf3ea] hover:bg-amber-500/20 hover:border-amber-400 transition"
                  >
                    <span className="text-base">⚡</span>
                    <div>
                      <div className="font-bold text-amber-300">Live Opportunities</div>
                      <div className="text-[10px] text-[rgba(237,243,234,0.6)]">Active squad cohorts &amp; tasks</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateView('homestead')
                      onClose()
                    }}
                    className="flex items-center gap-2.5 rounded-xl border border-[#88aa8f]/30 bg-[#88aa8f]/10 p-2.5 text-left text-xs font-semibold text-[#edf3ea] hover:bg-[#88aa8f]/20 hover:border-[#88aa8f] transition"
                  >
                    <span className="text-base">📍</span>
                    <div>
                      <div className="font-bold text-[#88aa8f]">Claim $1 Homestead</div>
                      <div className="text-[10px] text-[rgba(237,243,234,0.6)]">Municipal homestead inventory</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateView('search')
                      onClose()
                    }}
                    className="sm:col-span-2 flex items-center justify-between rounded-xl border border-[rgba(237,243,234,0.12)] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[rgba(237,243,234,0.85)] hover:bg-white/[0.08] hover:text-[#edf3ea] transition"
                  >
                    <span className="flex items-center gap-2">
                      🔍 <span>Parcel &amp; Site Search Engine</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#c8b97a]">Switch View →</span>
                  </button>
                </div>
              </div>
            )}

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

              {/* Developer Feedback & Forge Echo Toggle Option */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareCode className="h-4 w-4 text-amber-400" />
                    <span className="font-mono text-xs font-bold text-amber-300">Developer Feedback &amp; Forge Echo</span>
                  </div>
                  <input
                    type="checkbox"
                    id="devModeToggle"
                    checked={devMode}
                    onChange={(e) => setDevMode(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-400 text-[#88aa8f] focus:ring-0"
                  />
                </div>
                <p className="text-[11px] text-[rgba(237,243,234,0.7)] leading-relaxed">
                  Enable developer feedback mode to submit comments and screenshots directly to <code className="text-amber-200">forge.beamthinktank.space</code> for issue resolution across BEAM divisions.
                </p>
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
          </div>
        )}
      </div>
    </div>
  )
}
