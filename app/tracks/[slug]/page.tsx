import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { groundsConfig } from '@/lib/ngoConfig'

type TrackPageProps = {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return groundsConfig.tracks.map((track) => ({ slug: track.slug }))
}

export default function TrackPage({ params }: TrackPageProps) {
  const track = groundsConfig.tracks.find((entry) => entry.slug === params.slug)

  if (!track) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
      <section className="surface-panel p-8 shadow-grounds sm:p-10">
        <p className="eyebrow">Track Brief</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">{track.name}</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/70">{track.summary}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/66">{track.focus}</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Expected Outputs</p>
          <div className="mt-6 space-y-4">
            {track.outcomes.map((outcome) => (
              <div key={outcome} className="flex items-start gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-grounds-sand" />
                <p className="text-sm leading-7 text-white/72">{outcome}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel p-8 shadow-grounds">
          <p className="eyebrow">Portal Connection</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Authenticated work lives in the portal.</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">
            Track briefs stay public. Active property work, cohort execution, and operator routing move into role-protected routes.
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/portal" className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/78 hover:text-white">
              Open portal landing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/portal/cohort" className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/78 hover:text-white">
              Cohort workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
