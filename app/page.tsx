import Link from 'next/link'
import { ArrowRight, Blocks, Building2, Landmark, MapPinned } from 'lucide-react'
import { SubscribeForm } from '@/components/SubscribeForm'
import { groundsConfig } from '@/lib/ngoConfig'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
        <div className="surface-panel overflow-hidden p-8 shadow-grounds sm:p-10">
          <p className="eyebrow">Shared NGO Scaffold</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {groundsConfig.name} organizes place-based development work across acquisition, capital, and civic anchor strategy.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/70 sm:text-lg">
            This greenfield build establishes the reusable BEAM NGO contract: config-driven site identity, config-driven BEAM handoff, and role-resolved portal routing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712]"
              style={{ backgroundColor: groundsConfig.primaryColor }}
            >
              Enter Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/about" className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white/84 hover:bg-white/[0.04]">
              About Grounds
            </Link>
          </div>
        </div>

        <aside className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Operating Thesis</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-grounds-sand" />
                <p className="font-medium text-white">Property intelligence</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/66">Map and sequence opportunities that can unlock community-serving land and buildings.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-grounds-sand" />
                <p className="font-medium text-white">Capital orchestration</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/66">Blend grants, debt, and mission capital into executable redevelopment pathways.</p>
            </div>
          </div>
        </aside>
      </section>

      <section id="tracks" className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Tracks</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Four coordinated workstreams</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/66">
            Each track is carried inside `groundsConfig.tracks`, so future BEAM NGO sites can reuse the same abstraction pattern with different content.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {groundsConfig.tracks.map((track) => (
            <Link key={track.slug} href={`/tracks/${track.slug}`} className="surface-panel group p-6 shadow-grounds transition hover:border-white/20 hover:bg-white/[0.06]">
              <div className="flex items-center gap-3 text-grounds-sand">
                <Blocks className="h-5 w-5" />
                <p className="eyebrow">{track.name}</p>
              </div>
              <p className="mt-4 text-lg font-semibold text-white">{track.summary}</p>
              <p className="mt-3 text-sm leading-7 text-white/66">{track.focus}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white">
                Open track brief
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Portal Surfaces</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Authenticated routes are separated by job-to-be-done, not by a one-off page tree.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
              <Building2 className="h-5 w-5 text-grounds-sand" />
              <p className="mt-4 font-medium text-white">`/portal`</p>
              <p className="mt-2 text-sm leading-7 text-white/66">Authenticated landing page with role-aware navigation and member context.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
              <MapPinned className="h-5 w-5 text-grounds-sand" />
              <p className="mt-4 font-medium text-white">`/portal/properties`</p>
              <p className="mt-2 text-sm leading-7 text-white/66">Acquisition pipeline surface with a placeholder Mapbox container for property workflows.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
              <Landmark className="h-5 w-5 text-grounds-sand" />
              <p className="mt-4 font-medium text-white">`/portal/cohort`</p>
              <p className="mt-2 text-sm leading-7 text-white/66">Redevelopment cohort workspace for coordination, deliverables, and civic anchor planning.</p>
            </div>
          </div>
        </div>

        <div className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Subscribe</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Follow public updates from Grounds.</h2>
          <p className="mt-3 text-sm leading-7 text-white/66">Subscribe to acquisition briefs, financing architecture notes, and cohort milestones.</p>
          <div className="mt-6">
            <SubscribeForm config={groundsConfig} />
          </div>
        </div>
      </section>
    </div>
  )
}
