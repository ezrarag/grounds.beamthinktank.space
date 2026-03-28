import { ArrowRight, Building2, MapPinned, Users } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'

export default function PortalPage() {
  return (
    <PortalShell
      config={groundsConfig}
      title="Grounds portal"
      description="Authenticated portal for acquisition mapping, role-based routing, and redevelopment cohort coordination."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
          <Building2 className="h-5 w-5 text-grounds-sand" />
          <p className="mt-4 font-medium text-white">Role router</p>
          <p className="mt-2 text-sm leading-7 text-white/66">
            `/portal/dashboard` forwards operators, acquisition roles, and cohort members to the correct surface.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
          <MapPinned className="h-5 w-5 text-grounds-sand" />
          <p className="mt-4 font-medium text-white">Acquisition map</p>
          <p className="mt-2 text-sm leading-7 text-white/66">Use the property workspace for site sourcing, shortlist reviews, and map-driven diligence.</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
          <Users className="h-5 w-5 text-grounds-sand" />
          <p className="mt-4 font-medium text-white">Cohort hub</p>
          <p className="mt-2 text-sm leading-7 text-white/66">Coordinate stakeholders, deliverables, and anchor development activity inside one cohort surface.</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[#12211c] p-5">
        <p className="text-sm font-medium text-white">Grounds scaffold standard</p>
        <p className="mt-3 text-sm leading-7 text-white/68">
          The public site, auth handoff, and portal routes are all parameterized through the NGO config so future BEAM sites can follow the same abstraction.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-grounds-sand">
          Continue into a role-specific route
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </PortalShell>
  )
}
