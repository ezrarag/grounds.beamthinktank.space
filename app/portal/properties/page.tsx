import { MapPinned, Pin, Workflow } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { groundsConfig } from '@/lib/ngoConfig'

const acquisitionStages = ['Intake', 'Screening', 'Diligence', 'Capital planning']

export default function PortalPropertiesPage() {
  return (
    <PortalShell
      config={groundsConfig}
      title="Acquisition pipeline"
      description="Property sourcing and diligence surface for BEAM Grounds. This page includes a placeholder container for a future Mapbox-backed acquisition map."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-[#12211c] p-5 shadow-grounds">
          <div className="flex items-center gap-3">
            <MapPinned className="h-5 w-5 text-grounds-sand" />
            <div>
              <p className="text-sm font-medium text-white">Mapbox container placeholder</p>
              <p className="text-sm text-white/56">Swap this panel for the live acquisition map when the geospatial layer is ready.</p>
            </div>
          </div>
          <div
            data-map-provider="mapbox"
            className="mt-5 flex h-[360px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/14 bg-[linear-gradient(135deg,rgba(136,170,143,0.16),rgba(11,23,18,0.65))] text-center text-sm text-white/64"
          >
            Future Mapbox acquisition surface
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">Pipeline stages</p>
            <div className="mt-4 space-y-3">
              {acquisitionStages.map((stage) => (
                <div key={stage} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/72">
                  <Pin className="h-4 w-4 text-grounds-sand" />
                  {stage}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-white">
              <Workflow className="h-4 w-4 text-grounds-sand" />
              <p className="font-medium">Operator note</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">
              Acquisition and finance roles should land here from `/portal/dashboard` via `resolvePortalPath`.
            </p>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
