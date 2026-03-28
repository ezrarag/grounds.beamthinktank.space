import Link from 'next/link'
import { ArrowRight, Building2, HandCoins, School, Trees } from 'lucide-react'
import { groundsConfig } from '@/lib/ngoConfig'

const pillars = [
  {
    title: 'Acquisition discipline',
    description: 'Grounds builds a property pipeline before projects become urgent, allowing strategy, diligence, and community alignment to happen early.',
    icon: Building2,
  },
  {
    title: 'Capital stack design',
    description: 'The financing architecture track translates site opportunities into executable combinations of grants, mission capital, and conventional financing.',
    icon: HandCoins,
  },
  {
    title: 'Cohort-based execution',
    description: 'Students, residents, and operators work through live redevelopment questions instead of abstract exercises.',
    icon: School,
  },
  {
    title: 'Civic anchor stewardship',
    description: 'Every site is evaluated for long-horizon civic value, not just transaction feasibility.',
    icon: Trees,
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
      <section className="surface-panel p-8 shadow-grounds sm:p-10">
        <p className="eyebrow">About Grounds</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          {groundsConfig.name} is the BEAM real estate and civic development scaffold for neighborhood-scale project work.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/70">{groundsConfig.description}</p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map(({ title, description, icon: Icon }) => (
          <article key={title} className="surface-panel p-6 shadow-grounds">
            <Icon className="h-5 w-5 text-grounds-sand" />
            <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Shared Abstraction</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">The site is driven by NGO config, not site-specific constants scattered through components.</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">
            `groundsConfig` carries the organization identity, handoff metadata, track catalog, and return path contract. Future BEAM NGO sites can reuse the same component layer by swapping config and content, not rewriting auth or routing logic.
          </p>
        </article>

        <article className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Next Step</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Move from public orientation into the portal.</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">
            The portal protects acquisition, cohort, and internal operating views while continuing to route sign-in through BEAM Home.
          </p>
          <Link
            href="/portal"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712]"
            style={{ backgroundColor: groundsConfig.primaryColor }}
          >
            Open Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>
    </div>
  )
}
