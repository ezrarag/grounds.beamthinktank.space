'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Lock, Workflow } from 'lucide-react'
import { PathwayEntryInterstitial } from '@/components/PathwayEntryInterstitial'
import { usePortalAccess } from '@/lib/usePortalAccess'
import { PATHWAY_ONBOARDING_PATH } from '@/lib/resolvePortalPath'
import type { NGOConfig } from '@/lib/ngoConfig'

export function PortalDashboardRouter({ config }: { config: NGOConfig }) {
  const router = useRouter()
  const access = usePortalAccess(config)

  const needsOnboarding = access.targetPath === PATHWAY_ONBOARDING_PATH

  useEffect(() => {
    if (access.status === 'authenticated' && !needsOnboarding) {
      router.replace(access.targetPath)
    }
  }, [access.status, access.targetPath, needsOnboarding, router])

  if (access.status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="surface-panel p-8 text-white/72">Resolving your role-based portal destination...</section>
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
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Portal Dashboard Router</h1>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-white/70">
                This route checks the authenticated member and forwards them to the correct Grounds workspace.
              </p>
              <Link
                href={access.signInUrl}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712]"
                style={{ backgroundColor: config.primaryColor }}
              >
                Sign In Through BEAM Home
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Authenticated member with no resolvable pathway → choose-your-door interstitial.
  if (needsOnboarding) {
    return <PathwayEntryInterstitial user={access.user} />
  }

  // A destination resolved — the effect above is routing the session there.
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
      <section className="surface-panel flex items-center gap-4 p-8 text-white/72">
        <Workflow className="h-5 w-5 text-grounds-sand" />
        Routing your session to {access.targetPath}...
      </section>
    </div>
  )
}
