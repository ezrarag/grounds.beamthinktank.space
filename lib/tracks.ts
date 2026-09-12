export type AcquisitionTrackId = 'A' | 'B' | 'C' | 'D'
export type ProductionLane = 'organic' | 'industrial'
export type HoldingEntity = 'nonprofit' | 'for-profit'

export interface TrackMeta {
  id: AcquisitionTrackId
  label: string
  shortDescription: string
  description: string
  holdingEntity: HoldingEntity
  capitalInstrument: string
  colorToken: string
  badgeClass: string
}

export const TRACK_META: Record<AcquisitionTrackId, TrackMeta> = {
  A: {
    id: 'A',
    label: 'Track A — Supportive Residential',
    shortDescription: 'HUD Section 202 / PRAC supportive housing with rent-free resident access.',
    description: 'Supportive residential facilities held by non-profit entities. Funded via HUD Section 202 / PRAC and civic subsidies. Residents live rent-free and do not accrue sweat equity unless opted in.',
    holdingEntity: 'nonprofit',
    capitalInstrument: 'HUD Section 202 / PRAC & Capital Grants',
    colorToken: 'teal',
    badgeClass: 'border-teal-400/40 bg-teal-500/10 text-teal-200',
  },
  B: {
    id: 'B',
    label: 'Track B — Civic & Cultural Adaptive Reuse',
    shortDescription: 'Grant-funded community hubs, assembly venues, and performance spaces.',
    description: 'Civic and cultural adaptive reuse projects held by non-profit entities. Multi-use assembly occupancies funded by philanthropic capital, historic tax credits, and municipal grants.',
    holdingEntity: 'nonprofit',
    capitalInstrument: 'Philanthropic Grants & Historic Tax Credits',
    colorToken: 'purple',
    badgeClass: 'border-purple-400/40 bg-purple-500/10 text-purple-200',
  },
  C: {
    id: 'C',
    label: 'Track C — Market-Rate Commercial & Residential',
    shortDescription: 'Conventional debt & equity mixed-use commercial and housing assets.',
    description: 'Market-rate commercial and residential developments held by for-profit entities or land trusts. Financed through conventional debt, investor equity, and community revenue sharing.',
    holdingEntity: 'for-profit',
    capitalInstrument: 'Conventional Debt & Investor Equity',
    colorToken: 'amber',
    badgeClass: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  },
  D: {
    id: 'D',
    label: 'Track D — Production Facilities',
    shortDescription: 'Organic (food/perishables) and industrial (apparel/electronics) manufacturing hubs.',
    description: 'Production and processing infrastructure with organic (food, cosmetics, perishables) and industrial (apparel, vehicle parts, electronics) lanes. Held by for-profit operating entities.',
    holdingEntity: 'for-profit',
    capitalInstrument: 'Equipment Financing & Industrial Bonds',
    colorToken: 'emerald',
    badgeClass: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  },
}

export function getTrackMeta(trackId?: AcquisitionTrackId): TrackMeta {
  return TRACK_META[trackId || 'C']
}
