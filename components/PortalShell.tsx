'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Lock, ShieldCheck } from 'lucide-react'
import { MemberDashboard } from '@/components/MemberDashboard'
import { signInWithGoogle } from '@/lib/firebase'
import { usePortalAccess } from '@/lib/usePortalAccess'
import type { NGOConfig } from '@/lib/ngoConfig'

export function PortalShell({
  config,
  title,
  description,
  children,
}: {
  config: NGOConfig
  title: string
  description: string
  children: ReactNode
}) {
  const access = usePortalAccess(config)
  const [directSignInError, setDirectSignInError] = useState<string | null>(null)
  const [isSigningInDirectly, setIsSigningInDirectly] = useState(false)

  async function handleDirectSignIn() {
    setDirectSignInError(null)
    setIsSigningInDirectly(true)

    try {
      await signInWithGoogle()
    } catch (error) {
      setDirectSignInError(error instanceof Error ? error.message : 'Unable to sign in with Google.')
    } finally {
      setIsSigningInDirectly(false)
    }
  }

  if (access.status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="surface-panel p-8 text-white/72">Checking your {config.name} portal session...</section>
      </div>
    )
  }

  if (access.status === 'signed-out' || !access.user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="surface-panel p-8 shadow-grounds">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-grounds-sand">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="eyebrow">Protected Route</p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-white/70">{description}</p>
              <div className="rounded-[1.5rem] border border-white/10 bg-[#12211c] p-5 text-sm text-white/68">
                <p className="font-medium text-white">Sign-in is routed through BEAM Home.</p>
                <p className="mt-2">
                  The handoff URL is generated from the NGO config contract and uses `NEXT_PUBLIC_SITE_URL` for the return destination.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDirectSignIn}
                  disabled={isSigningInDirectly}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {isSigningInDirectly ? 'Opening Google Sign-In...' : 'Sign In to Grounds'}
                </button>
                <Link
                  href={access.signInUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white/82 hover:bg-white/[0.04]"
                >
                  Sign In Through BEAM Home
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/about" className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white/82 hover:bg-white/[0.04]">
                  Learn about Grounds
                </Link>
              </div>
              {directSignInError ? (
                <p className="text-sm text-red-100">{directSignInError}</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.6fr]">
        <MemberDashboard config={config} user={access.user} role={access.role} currentPath={access.currentPath} />
        <section className="surface-panel p-8 shadow-grounds">
          <div className="flex items-center gap-3 text-grounds-sand">
            <ShieldCheck className="h-5 w-5" />
            <p className="eyebrow">Portal Surface</p>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </div>
  )
}
