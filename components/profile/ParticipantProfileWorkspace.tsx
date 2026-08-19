'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Hammer,
  Home,
  LifeBuoy,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import { HousingPreferencesForm } from '@/components/profile/HousingPreferencesForm'
import { PathToDeedTracker } from '@/components/profile/PathToDeedTracker'
import { HousingSafetyNetCard } from '@/components/profile/HousingSafetyNetCard'

type ActiveDrawerTab = 'goals' | 'deed' | 'safety' | null

export function ParticipantProfileWorkspace() {
  const { user } = usePortalAccessState()
  const [activeDrawerTab, setActiveDrawerTab] = useState<ActiveDrawerTab>(null)

  const displayName = user?.displayName || 'ezra haugabrooks'
  const handle = `@${(user?.email ? user.email.split('@')[0] : 'ezra.haugabrooks').toLowerCase()}`
  const title = 'Violinist • MYSO Alumni • Cohort Resident'
  const bio = 'Musician & civic space steward focused on residency.'

  // Avatar URL with fallback
  const avatarUrl =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#0f172a] font-sans selection:bg-slate-200">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider text-[#0f172a] uppercase text-sm sm:text-base">
              BEAM
            </span>
            <span className="text-slate-300 font-light">·</span>
            <span className="font-normal tracking-widest text-slate-600 uppercase text-sm sm:text-base">
              GROUNDS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition"
            >
              Portal Navigation
            </Link>
            <span className="text-slate-300">·</span>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-slate-50 px-3.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Profile Info Header Section */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar with Verified Badge Overlay */}
          <div className="relative h-32 w-32 shrink-0">
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-32 w-32 rounded-full object-cover border-2 border-white shadow-md"
            />
            {/* Verified Badge Icon */}
            <div className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b] text-white ring-4 ring-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-sky-300" />
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
              {displayName}
            </h1>
            <p className="text-sm text-slate-500 font-normal">{handle}</p>
            <p className="pt-1 text-sm font-medium text-slate-700">{title}</p>
            <p className="pt-2 text-sm text-slate-600 leading-relaxed max-w-xl">{bio}</p>
          </div>
        </section>

        {/* Three Horizontal Metric Cards */}
        <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* CARD 1: SWEAT EQUITY */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition hover:shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              SWEAT EQUITY
            </h2>

            <div className="relative my-6 flex items-center justify-center">
              {/* Donut Progress Circle */}
              <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 36 36">
                {/* Background Track */}
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Dark Navy Progress Arc (70%) */}
                <path
                  className="text-[#1e293b]"
                  strokeDasharray="72, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Number inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-[#0f172a]">72</span>
                <span className="text-xs font-normal text-slate-500">hrs</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">$30/hr HUD match equivalent</p>
          </div>

          {/* CARD 2: PURCHASING POWER */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition hover:shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              PURCHASING POWER
            </h2>

            <div className="my-6 flex h-36 items-center justify-center">
              {/* Payment Card Graphic */}
              <div className="relative h-20 w-32 rounded-xl border-2 border-[#1e293b] bg-slate-50 p-2 shadow-sm">
                <div className="h-4 w-full rounded bg-[#1e293b]" />
                <div className="mt-4 flex items-center justify-between px-1">
                  <div className="h-2 w-8 rounded bg-slate-300" />
                  <div className="flex gap-1">
                    <span className="h-3.5 w-3.5 rounded-full bg-rose-400 opacity-90" />
                    <span className="h-3.5 w-3.5 -ml-2 rounded-full bg-amber-400 opacity-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <span className="text-3xl font-extrabold text-[#0f172a]">$2,160</span>
              <p className="mt-1 text-[11px] text-slate-400">BEAM proof-of-funds</p>
            </div>
          </div>

          {/* CARD 3: TARGET NODES */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition hover:shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              TARGET NODES
            </h2>

            <div className="my-6 flex h-36 w-full items-center justify-center">
              {/* Stylized Map Graphic */}
              <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#eef2f6]">
                {/* SVG Vector Map Outline */}
                <svg className="h-full w-full opacity-40" viewBox="0 0 200 120" fill="none">
                  <path
                    d="M10 20 C 40 10, 80 30, 120 15 C 160 0, 190 25, 195 60 C 200 95, 160 110, 110 105 C 60 100, 20 85, 10 20 Z"
                    fill="#cbd5e1"
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <path
                    d="M70 40 Q 90 60 140 85"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </svg>

                {/* Pin 1: MKE (Milwaukee) */}
                <div className="absolute left-[38%] top-[25%] flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-md bg-[#e11d48] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    <MapPin className="h-2.5 w-2.5" /> MKE
                  </div>
                </div>

                {/* Pin 2: ATL (Atlanta) */}
                <div className="absolute right-[24%] bottom-[20%] flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-md bg-[#0d9488] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    <MapPin className="h-2.5 w-2.5" /> ATL
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <span className="text-2xl font-extrabold text-[#0f172a]">2 Cities</span>
              <p className="mt-1 text-[11px] text-slate-400">Milwaukee • Atlanta</p>
            </div>
          </div>
        </section>

        {/* Collapsible Section for Functional Profile Tools */}
        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Participant Workspace Modules
              </h3>
              <p className="text-xs text-slate-500">
                Manage your location goals, municipal compliance ledger, and emergency safety net intake.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setActiveDrawerTab((prev) => (prev === 'goals' ? null : 'goals'))
                }
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeDrawerTab === 'goals'
                    ? 'border-[#1e293b] bg-[#1e293b] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                Housing Preferences
                {activeDrawerTab === 'goals' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={() => setActiveDrawerTab((prev) => (prev === 'deed' ? null : 'deed'))}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeDrawerTab === 'deed'
                    ? 'border-[#1e293b] bg-[#1e293b] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Hammer className="h-3.5 w-3.5" />
                Path to Deed (180-Day)
                {activeDrawerTab === 'deed' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={() =>
                  setActiveDrawerTab((prev) => (prev === 'safety' ? null : 'safety'))
                }
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  activeDrawerTab === 'safety'
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <LifeBuoy className="h-3.5 w-3.5 text-amber-700" />
                Emergency Safety Net
                {activeDrawerTab === 'safety' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          {activeDrawerTab ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {activeDrawerTab === 'goals' && <HousingPreferencesForm />}
              {activeDrawerTab === 'deed' && <PathToDeedTracker />}
              {activeDrawerTab === 'safety' && <HousingSafetyNetCard />}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
