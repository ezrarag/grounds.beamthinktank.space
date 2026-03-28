'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Lock, Workflow } from 'lucide-react'
import { MemberDashboard } from '@/components/MemberDashboard'
import { usePortalAccess } from '@/lib/usePortalAccess'
import type { NGOConfig } from '@/lib/ngoConfig'

export function PortalDashboardRouter({ config }: { config: NGOConfig }) {
  const router = useRouter()
  const access = usePortalAccess(config)

  useEffect(() => {
    if (access.status === 'authenticated' && access.targetPath !== '/portal/dashboard') {
      router.replace(access.targetPath)
    }
  }, [access.status, access.targetPath, router])

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
                This route checks the authenticated role and forwards the user to the correct Grounds workspace.
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

  if (access.targetPath !== '/portal/dashboard') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="surface-panel flex items-center gap-4 p-8 text-white/72">
          <Workflow className="h-5 w-5 text-grounds-sand" />
          Routing your session to {access.targetPath}...
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.6fr]">
        <MemberDashboard config={config} user={access.user} role={access.role} currentPath="/portal/dashboard" />
        <section className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Operator Dashboard</p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Grounds delivery cockpit</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
            Admin and operator roles land here first. This surface can be extended into portfolio controls, reporting, and cross-track coordination without changing the NGO contract.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-white/48">Track load</p>
              <p className="mt-3 text-2xl font-semibold text-white">{config.tracks.length}</p>
              <p className="mt-2 text-sm text-white/64">Shared workstreams active across acquisition, financing, cohort, and anchor development.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-white/48">Entry channel</p>
              <p className="mt-3 text-lg font-semibold text-white">{config.entryChannel}</p>
              <p className="mt-2 text-sm text-white/64">Portal sessions inherit handoff context from the NGO config layer.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-white/48">Recommended next step</p>
              <p className="mt-3 text-lg font-semibold text-white">Open acquisition or cohort surfaces</p>
              <p className="mt-2 text-sm text-white/64">Use role-specific pages for map work and cohort execution.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
