'use client'

import Link from 'next/link'
import { type User } from 'firebase/auth'
import { ArrowRight, Building2, LayoutDashboard, MapPinned, Users } from 'lucide-react'
import { resolvePortalPath } from '@/lib/resolvePortalPath'
import type { NGOConfig } from '@/lib/ngoConfig'
import { cn } from '@/lib/utils'

const portalLinks = [
  { href: '/portal/dashboard', label: 'Role Router', icon: LayoutDashboard },
  { href: '/portal/properties', label: 'Acquisition Map', icon: MapPinned },
  { href: '/portal/cohort', label: 'Cohort Hub', icon: Users },
]

export function MemberDashboard({
  config,
  user,
  role,
  currentPath,
  className,
}: {
  config: NGOConfig
  user: User
  role: string
  currentPath: string
  className?: string
}) {
  const recommendedPath = resolvePortalPath(role)
  const displayName = user.displayName || user.email || 'BEAM participant'

  return (
    <section className={cn('surface-panel p-6 shadow-grounds', className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="eyebrow">Authenticated Member</p>
          <div>
            <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
            <p className="mt-2 text-sm text-white/68">
              Signed into {config.name} with the <span className="text-white">{role}</span> role context.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-white/48">Organization</p>
              <p className="mt-2 font-medium text-white">{config.organizationId}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-white/48">Cohort</p>
              <p className="mt-2 font-medium text-white">{config.cohortId}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-[#12211c] p-5 lg:max-w-sm">
          <div className="flex items-center gap-3 text-white">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-white/56">Recommended route</p>
              <p className="font-medium">{recommendedPath}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/66">
            Grounds uses a shared NGO portal contract. The role resolver keeps cohort, acquisition, and operator traffic on the correct surface.
          </p>
          <a href={config.beamHomeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-grounds-sand">
            Return to BEAM Home
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {portalLinks.map(({ href, label, icon: Icon }) => {
          const isActive = currentPath === href

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-[1.4rem] border px-4 py-4 text-sm transition',
                isActive ? 'border-white/20 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.03] text-white/72 hover:text-white',
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
