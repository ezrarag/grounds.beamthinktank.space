'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Building2,
  Compass,
  Image as ImageIcon,
  MapPinned,
  PlusCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  LogOut,
  LogIn,
  Home,
  Loader2,
} from 'lucide-react'
import { useIsAdmin } from '@/lib/useIsAdmin'
import { signOutUser } from '@/lib/firebase'
import { BeamGroundsNav } from '@/components/BeamGroundsNav'

const CARDS = [
  {
    href: '/admin',
    icon: Building2,
    title: 'Redevelopment Pipeline Board',
    body: 'Portfolio-level status board tracking active projects, phase milestones, open equity slots, and financing notes.',
    primary: true,
  },
  {
    href: '/portal/acquisition',
    icon: Zap,
    title: 'Participant & Property Dispatch Console',
    body: 'Live Mapbox proximity dispatch, Cohort Manager command center, and property maturation.',
  },
  {
    href: '/portal/admin/landing',
    icon: ImageIcon,
    title: 'Landing Showcase & 90s Loop',
    body: 'Upload and modify background artwork for the 3 landing slides, and configure videos for the 90-second executive briefing.',
  },
  {
    href: '/portal/admin/add',
    icon: PlusCircle,
    title: 'Add a property',
    body: 'Quick add: name, city, address, photo, publish. The fastest way to get a site on the public page.',
  },
  {
    href: '/portal/admin/add#scan',
    icon: ScanLine,
    title: 'Scan a city',
    body: "Pull property records from a city's civic database and publish the ones you pick.",
  },
  {
    href: '/portal/admin/add#city',
    icon: MapPinned,
    title: 'Add a city',
    body: 'Register a new city/state with its open-data source so you can add sites there.',
  },
  {
    href: '/portal/admin/pathways',
    icon: ImageIcon,
    title: 'Pathway card media',
    body: 'Manage the media shown behind each pathway card on the public landing page.',
  },
  {
    href: '/portal/guide',
    icon: Sparkles,
    title: 'Guide',
    body: 'How logins, cities, scans, publishing, media, and donations fit together.',
  },
]

export default function AdminHomePage() {
  const { isAdmin, ready, email } = useIsAdmin()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOutUser()
      router.push('/login')
    } catch (err) {
      console.error('Sign out error:', err)
      setIsSigningOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <BeamGroundsNav />
          <div className="hidden sm:block h-6 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-grounds-sand">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Admin Console</p>
              <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">What do you want to do?</h1>
              {email ? (
                <p className="mt-1 text-xs text-white/50 font-mono">
                  Signed in as: <span className="text-white/80">{email}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Global Exit & Auth Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <Home className="h-3.5 w-3.5" />
            Public Home
          </Link>

          <Link
            href="/login?next=/portal/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <LogIn className="h-3.5 w-3.5" />
            Switch Account
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 font-mono text-xs text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
          >
            {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Sign Out
          </button>
        </div>
      </header>

      {!ready ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/60">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-emerald-400" />
          <p className="mt-2 font-mono text-xs">Verifying authorization...</p>
        </div>
      ) : !isAdmin ? (
        <div className="mt-8 rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 text-sm text-white/80 space-y-4">
          <div className="flex items-center gap-3 text-amber-300">
            <ShieldCheck className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Admin Account Required</h2>
          </div>
          <p className="leading-relaxed text-white/70 max-w-2xl">
            You are currently signed in as <span className="font-mono text-white">{email || 'unauthorized'}</span>, which does not have administrative permissions for BEAM Grounds.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/login?next=/portal/admin"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-xs font-semibold text-[#07100c] hover:bg-emerald-300 transition"
            >
              <LogIn className="h-4 w-4" />
              Sign In with Authorized Admin Account
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-mono text-white hover:bg-white/15 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-mono text-white hover:bg-white/15 transition"
            >
              <Home className="h-4 w-4" />
              Return to Public Site
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CARDS.map(({ href, icon: Icon, title, body, primary }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col rounded-[1.5rem] border p-6 transition ${
                primary
                  ? 'border-grounds-sand/45 bg-grounds-sand/[0.08] hover:bg-grounds-sand/[0.14]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-6 w-6 ${primary ? 'text-grounds-sand' : 'text-white/70'}`} />
                <ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-white/66">{body}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
