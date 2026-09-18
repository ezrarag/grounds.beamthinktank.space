'use client'

import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileText,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { CITIES } from '@/lib/cities'
import {
  getCivicRepresentatives,
  getNonProfitPartners,
  type CivicRelationshipStatus,
  type CivicRepresentative,
  type NonProfitPartner,
} from '@/lib/civicPartners'

interface CivicPartnerLayerProps {
  initialCityId?: string
}

const statusBadges: Record<CivicRelationshipStatus, { label: string; className: string }> = {
  supportive: {
    label: 'Active Champion / Supportive',
    className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  },
  in_dialogue: {
    label: 'In Formal Dialogue',
    className: 'border-blue-400/40 bg-blue-400/10 text-blue-300',
  },
  aware: {
    label: 'Aware of BEAM Initiative',
    className: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  },
  pending_outreach: {
    label: 'Pending Initial Outreach',
    className: 'border-white/20 bg-white/5 text-white/60',
  },
}

export function CivicPartnerLayer({ initialCityId = 'milwaukee-wi' }: CivicPartnerLayerProps) {
  const [selectedCityId, setSelectedCityId] = useState<string>(initialCityId)

  const representatives = getCivicRepresentatives(selectedCityId)
  const nonProfitPartners = getNonProfitPartners(selectedCityId)
  const cityObj = CITIES.find((c) => c.id === selectedCityId)

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="surface-panel p-5 shadow-grounds">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-blue-400/40 bg-blue-400/10 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                CIVIC & LAND TRUST LAYER
              </span>
              <span className="text-xs text-white/50">Aldermanic & CDC Partnership Infrastructure</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">Civic Contacts, CDCs & Land Trust Partners</h2>
            <p className="mt-1 text-sm text-white/60">
              Direct municipal aldermanic relationships, active Community Development Corporations (CDCs), and Community Land Trusts providing 99-year ground lease legal mechanisms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/60">Target Node:</span>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#12211c] px-3 py-2 text-xs font-semibold text-white shadow-sm focus:border-grounds-sand focus:outline-none"
            >
              {CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label} ({city.state})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legal & Ground-Lease Advisory Callout */}
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4 text-xs leading-6 text-emerald-200">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <strong className="font-semibold text-emerald-100">Legal & Sweat-Equity Framework:</strong> Local Community Land Trusts (CLTs) provide pre-standardized 99-year ground leases. By holding underlying land in trust while deeding property improvements to participants, CLTs resolve sweat-equity wage and tax valuation questions without requiring custom attorney overhead.
          </div>
        </div>
      </div>

      {/* Grid Section 1: Aldermanic & Civic Representatives */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-white">
          <Landmark className="h-4 w-4 text-grounds-sand" />
          <h3 className="font-serif text-base font-semibold">Aldermanic & Municipal Representatives ({representatives.length})</h3>
        </div>

        {representatives.length === 0 ? (
          <div className="surface-panel p-6 text-center text-xs text-white/50">
            No specific aldermanic representative registered for {cityObj?.label} yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {representatives.map((rep) => (
              <div key={rep.id} className="surface-panel p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-white">{rep.name}</h4>
                    <p className="text-xs text-grounds-sand font-medium mt-0.5">{rep.title}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusBadges[rep.relationshipStatus].className}`}>
                    {statusBadges[rep.relationshipStatus].label}
                  </span>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-white/80 space-y-1.5">
                  <div className="font-semibold text-white/90">Key Focus & Priorities:</div>
                  <p className="text-white/70 leading-relaxed">{rep.keyFocus}</p>
                </div>

                {rep.notes && (
                  <p className="text-xs text-white/60 italic border-l-2 border-grounds-sand/40 pl-2.5">
                    &quot;{rep.notes}&quot;
                  </p>
                )}

                <div className="pt-2 border-t border-white/10 text-[11px] text-white/60 space-y-1">
                  {rep.contactEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-white/40" />
                      <span>{rep.contactEmail}</span>
                    </div>
                  )}
                  {rep.officeAddress && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-white/40" />
                      <span className="truncate">{rep.officeAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Section 2: Non-Profit CDCs & Land Trusts */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-white">
          <Users className="h-4 w-4 text-emerald-400" />
          <h3 className="font-serif text-base font-semibold">Non-Profit CDCs & Community Land Trusts ({nonProfitPartners.length})</h3>
        </div>

        {nonProfitPartners.length === 0 ? (
          <div className="surface-panel p-6 text-center text-xs text-white/50">
            No registered CDC or Land Trust partner logged for {cityObj?.label} yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {nonProfitPartners.map((partner) => (
              <div key={partner.id} className="surface-panel p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                      {partner.type === 'land_trust'
                        ? 'Community Land Trust'
                        : partner.type === 'cdc'
                        ? 'Community Development Corp (CDC)'
                        : 'Community Action Organization'}
                    </span>
                    <span className="text-[10px] text-white/40">{partner.cityName}</span>
                  </div>

                  <h4 className="mt-2.5 text-base font-bold text-white">{partner.name}</h4>
                  <p className="mt-1 text-xs text-white/70">{partner.focusArea}</p>

                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-grounds-sand flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Resale Restriction & Lease Model</span>
                    </div>
                    <p className="text-white/80 font-mono text-[11px]">{partner.resaleRestrictionModel}</p>
                  </div>

                  {partner.legalGuidanceNote && (
                    <div className="mt-3 rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-[11px] leading-relaxed text-blue-200">
                      <strong>Ground Lease Legal Guidance:</strong> {partner.legalGuidanceNote}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-white/50 truncate">
                    Active: {partner.activeNeighborhoods.join(', ')}
                  </span>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-grounds-sand hover:underline font-medium"
                    >
                      Website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
