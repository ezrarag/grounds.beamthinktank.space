import Link from 'next/link'
import { ArrowRight, Landmark, MapPinned, Users } from 'lucide-react'
import { PublicPortfolio } from '@/components/PublicPortfolio'
import { SuggestSiteForm } from '@/components/SuggestSiteForm'
import { SubscribeForm } from '@/components/SubscribeForm'
import { groundsConfig } from '@/lib/ngoConfig'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="eyebrow">BEAM Grounds Portfolio</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Candidate Sites for Community Acquisition
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
            A public view of places being considered for community-serving acquisition, civic anchor uses, cohort activity, and long-term trust relationships.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#portfolio"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712]"
              style={{ backgroundColor: groundsConfig.primaryColor }}
            >
              View candidate sites
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#suggest" className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white/84 hover:bg-white/[0.04]">
              Suggest a site
            </a>
            <Link href="/portal" className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white/64 hover:bg-white/[0.04] hover:text-white">
              Internal portal
            </Link>
          </div>
        </div>

        <aside className="surface-panel p-6 shadow-grounds">
          <p className="eyebrow">What Advocates Can See</p>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-grounds-sand" />
              <div>
                <p className="font-medium text-white">What sites are in play</p>
                <p className="mt-2 text-sm leading-6 text-white/64">Curated candidate properties, stages, and location context.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-grounds-sand" />
              <div>
                <p className="font-medium text-white">Who surfaced the opportunity</p>
                <p className="mt-2 text-sm leading-6 text-white/64">Suggested-by context from participants, cohorts, and partners.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-grounds-sand" />
              <div>
                <p className="font-medium text-white">How trust and finance connect</p>
                <p className="mt-2 text-sm leading-6 text-white/64">Public summaries of civic anchor uses, capital paths, and NGO relationships.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <div className="mt-10">
        <PublicPortfolio />
      </div>

      <section id="suggest" className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SuggestSiteForm />

        <div className="surface-panel p-6 shadow-grounds">
          <p className="eyebrow">Advocacy Brief</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">A simpler public front door for acquisition work.</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">
            The authenticated portal remains the operating room for imports, finance planning, and partner management. This front end is intentionally simpler:
            it lets community advocates understand the portfolio, see why each site matters, and offer new places for review.
          </p>
          <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
            <p className="font-medium text-white">Follow public updates from Grounds.</p>
            <p className="mt-2 text-sm leading-6 text-white/62">Receive acquisition briefs, financing architecture notes, and cohort milestones.</p>
            <div className="mt-4">
              <SubscribeForm config={groundsConfig} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
