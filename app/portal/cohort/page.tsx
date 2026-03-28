import { Building2, CalendarDays, Users } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'

const cohortMoments = [
  'Site brief and neighborhood context review',
  'Capital stack working session',
  'Redevelopment sprint planning',
  'Civic anchor activation review',
]

export default function PortalCohortPage() {
  return (
    <PortalShell
      config={groundsConfig}
      title="Redevelopment cohort"
      description="Cohort workspace for cross-functional delivery, civic anchor planning, and shared redevelopment checkpoints."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 text-white">
            <Users className="h-5 w-5 text-grounds-sand" />
            <p className="font-medium">Working cadence</p>
          </div>
          <div className="mt-5 space-y-3">
            {cohortMoments.map((moment) => (
              <div key={moment} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/72">
                {moment}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#12211c] p-5">
            <CalendarDays className="h-5 w-5 text-grounds-sand" />
            <p className="mt-4 font-medium text-white">Current cohort</p>
            <p className="mt-2 text-sm leading-7 text-white/66">{groundsConfig.cohortId}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <Building2 className="h-5 w-5 text-grounds-sand" />
            <p className="mt-4 font-medium text-white">Anchor focus</p>
            <p className="mt-2 text-sm leading-7 text-white/66">
              Use this space for partnership alignment, public-facing milestone planning, and site-specific activation decisions.
            </p>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
