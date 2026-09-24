'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
import { BeamGroundsNav } from '@/components/BeamGroundsNav'
import { subscribeToAuth, signOutUser } from '@/lib/firebase'
import type { NGOConfig } from '@/lib/ngoConfig'
import type { User } from 'firebase/auth'
import { cn } from '@/lib/utils'

const groundsNavItems = [
  { href: '/', label: 'Overview' },
  { href: '/properties', label: 'Properties' },
  { href: '/testimony', label: 'Testimony' },
  { href: '/about', label: 'About' },
  { href: '/#tracks', label: 'Tracks' },
]

export function AppHeader({ config: _config, className }: { config: NGOConfig; className?: string }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setCurrentUser(u))
    return () => unsub?.()
  }, [])

  async function handleSignOut() {
    await signOutUser()
    router.push('/login')
  }

  return (
    <header className={cn('sticky top-0 z-50 bg-[#07100c]/82 backdrop-blur-xl border-b border-white/8', className)}>
      <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <BeamGroundsNav groundsLinks={groundsNavItems} />

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-white/60">
                <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="max-w-[140px] truncate">{currentUser.email || currentUser.displayName}</span>
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white/80 hover:bg-white/15 hover:text-white transition"
              >
                <LogOut className="h-3 w-3 text-rose-400" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/80 hover:bg-white/15 hover:text-white transition"
            >
              <LogIn className="h-3 w-3 text-emerald-400" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
