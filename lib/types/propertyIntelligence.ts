import type { ParcelResult, AppraisalHistoryItem } from '@/app/api/parcel/route'

export interface PropertyDetails {
  sqftStructure: number
  sqftLot: number
  zoningCode: string
  zoningDescription: string
  ownerName: string
}

export interface PropertyAssessment {
  assessedTotal: number
  assessedTotalFormatted: string
  landValue: number
  improvementValue: number
  estimatedRehabCost: number
  sweatEquityCredit: number
  netCashRequired: number
  appraisalHistory: AppraisalHistoryItem[]
}

export interface MunicipalStatus {
  taxLienStatus: 'Clean / Current' | 'Notice of Delinquency' | 'Eligible for In-Rem Foreclosure' | 'Tax Certificate Sale'
  delinquentTaxAmount: number
  source: 'regrid' | 'civic-fallback' | 'seed'
}

export interface PropertyIntelligence {
  found: boolean
  apn: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  geometry?: any
  details: PropertyDetails
  assessment: PropertyAssessment
  municipalStatus: MunicipalStatus
  rawParcel: ParcelResult
}

export function parseCurrencyNumber(val?: string | number): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  if (!val) return 0
  const cleaned = String(val).replace(/[^0-9.-]+/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || !Number.isFinite(amount)) {
    return '$0'
  }
  return `$${Math.round(amount).toLocaleString('en-US')}`
}

export function normalizeParcelResult(parcel: ParcelResult | null | undefined): PropertyIntelligence | null {
  if (!parcel) return null

  const assessedNum = parseCurrencyNumber(parcel.assessedValue) || 245000
  const sqftStructure = parcel.sqft_structure ?? 4200
  const sqftLot = parcel.sqft_lot ?? 8500
  const rehabCost = sqftStructure * 35
  const sweatCredit = 72 * 30 // $2,160
  const netCash = Math.max(0, rehabCost - sweatCredit)

  const history = Array.isArray(parcel.appraisal_history) && parcel.appraisal_history.length > 0
    ? parcel.appraisal_history
    : [
        {
          year: 2025,
          assessedValue: assessedNum,
          landValue: Math.round(assessedNum * 0.25),
          improvementValue: Math.round(assessedNum * 0.75),
          event: 'Municipal Assessment',
        },
      ]

  const firstHistory = history[0]

  return {
    found: Boolean(parcel.found),
    apn: parcel.parcelId || 'UNASSIGNED-PARCEL',
    address: parcel.address || 'Unassigned Address',
    coordinates: {
      lat: parcel.lat ?? 43.0396,
      lng: parcel.lng ?? -87.945,
    },
    geometry: parcel.geometry ?? null,
    details: {
      sqftStructure,
      sqftLot,
      zoningCode: parcel.zoning_code || 'RT4',
      zoningDescription: parcel.zoning_description || parcel.zoning || 'Two-Family Residential',
      ownerName: parcel.ownerName || 'City / Public Owner',
    },
    assessment: {
      assessedTotal: assessedNum,
      assessedTotalFormatted: formatCurrency(assessedNum),
      landValue: firstHistory.landValue ?? Math.round(assessedNum * 0.25),
      improvementValue: firstHistory.improvementValue ?? Math.round(assessedNum * 0.75),
      estimatedRehabCost: rehabCost,
      sweatEquityCredit: sweatCredit,
      netCashRequired: netCash,
      appraisalHistory: history,
    },
    municipalStatus: {
      taxLienStatus: parcel.tax_lien_status || 'Clean / Current',
      delinquentTaxAmount: parcel.delinquent_tax_amount ?? 0,
      source: parcel.source || 'civic-fallback',
    },
    rawParcel: parcel,
  }
}
