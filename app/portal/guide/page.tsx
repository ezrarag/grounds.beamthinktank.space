import Link from 'next/link'
import { Building2, Coins, HeartHandshake, KeyRound, MapPin, ScanLine } from 'lucide-react'

const SECTIONS = [
  {
    icon: KeyRound,
    title: 'Logins & roles',
    body: 'There are three ways in, all via Google sign-in from the BEAM menu on the landing page. Admin (the owner account) can edit and delete anything. Participants can add cities and publish new sites. Neighbors can pledge support and browse sites.',
  },
  {
    icon: MapPin,
    title: 'Add a city',
    body: 'Open the City registry, enter the city name + state, pick the source type (Socrata for most US cities, CKAN for Milwaukee-style portals), and paste the portal base URL and dataset id. Save — it appears in the dropdowns, scans, and public filters immediately. No code or redeploy.',
  },
  {
    icon: ScanLine,
    title: 'Scan civic records',
    body: 'In Scan civic records, pick a city and Scan to pull property records from its open-data portal. Select the records you want, tick Publish, and Add. Selected records are saved to the backend and (when published) appear on the public Properties page.',
  },
  {
    icon: Building2,
    title: 'Add & publish a site',
    body: 'Use Add property to enter a single site: pick its city, fill in the details, optionally add a hero image, and toggle "Publish to public /properties" to surface it. Admins can manage a full media gallery and edit public fields per site.',
  },
  {
    icon: Coins,
    title: 'Media',
    body: 'Each property has a hero image plus a gallery (image or video, by URL or upload). The admin media manager shows a live front-end preview, so what you see is what visitors get. Hero images also drive the full-screen landing showcase.',
  },
  {
    icon: HeartHandshake,
    title: 'Donations',
    body: 'Neighbors pledge toward a site activation, a cohort, or an individual participant from the Neighborhood dashboard. Pledges are recorded for follow-up today; online payment processing is a planned next step.',
  },
]

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="space-y-3">
        <p className="eyebrow">Guide</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">How BEAM Grounds works</h1>
        <p className="max-w-2xl text-sm leading-7 text-white/70">
          A quick reference to the core workflows. For the full city-source checklist see{' '}
          <span className="font-mono text-xs text-grounds-sand">docs/ADDING_CITIES.md</span> in the repo.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-grounds-sand">
              <Icon className="h-5 w-5" />
              <h2 className="text-base font-semibold text-white">{title}</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/70">{body}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/portal/participant"
          className="rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712]"
        >
          Go to participant dashboard
        </Link>
        <Link
          href="/portal/neighborhood"
          className="rounded-full border border-white/14 px-5 py-3 text-sm font-medium text-white/82 hover:bg-white/[0.04]"
        >
          Neighborhood dashboard
        </Link>
      </div>
    </div>
  )
}
