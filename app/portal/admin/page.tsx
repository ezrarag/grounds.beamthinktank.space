'use client'

import Link from 'next/link'
import { ArrowUpRight, Building2, Image as ImageIcon, MapPinned, PlusCircle, ScanLine, ShieldCheck, Sparkles } from 'lucide-react'
import { useIsAdmin } from '@/lib/useIsAdmin'

const CARDS = [
  {
    href: '/portal/admin/add',
    icon: PlusCircle,
    title: 'Add a property',
    body: 'Quick add: name, city, address, photo, publish. The fastest way to get a site on the public page.',
    primary: true,
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
    title: 'Landing media',
    body: 'Manage the media shown behind each pathway card on the public landing page.',
  },
  {
    href: '/portal/acquisition',
    icon: Building2,
    title: 'Advanced console',
    body: 'Full acquisition view: map, scoring, finance projections, NGO links, publishing.',
  },
  {
    href: '/portal/guide',
    icon: Sparkles,
    title: 'Guide',
    body: 'How logins, cities, scans, publishing, media, and donations fit together.',
  },
]

export default function AdminHomePage() {
  const { isAdmin, ready } = useIsAdmin()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-grounds-sand">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">What do you want to do?</h1>
        </div>
      </header>

      {!ready ? null : !isAdmin ? (
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/60">
          This area is for BEAM Grounds admins. Sign in with an authorized admin account to manage properties.
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
