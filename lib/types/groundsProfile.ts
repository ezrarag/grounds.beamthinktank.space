export type PreferredHousingType =
  | 'residency'
  | 'live_work'
  | 'sweat_equity_path_to_own'
  | 'emergency'

export interface GroundsTargetLocation {
  city: string
  state: string
  priority: number
  targetDate?: string
  preferredType?: PreferredHousingType
}

export interface GroundsSpaceRequirements {
  acousticNeeds?: boolean
  instrumentStorage?: boolean
  accessibilityNeeds?: string
  familySize?: number
}

export interface GroundsSweatEquityLedger {
  totalHoursLogged: number
  approvedHours: number
  estimatedValueUSD?: number
}

export interface GroundsActiveAcquisition {
  address?: string
  propertyAddress?: string
  propertyId?: string
  parcelId?: string
  closingDate?: string
  repairDeadline180Day?: string
  essentialRepairsCost?: number
  deedCovenantExpiry?: string
  currentStatus?: string
}

export interface GroundsProfile {
  uid?: string
  targetLocations?: GroundsTargetLocation[]
  spaceRequirements?: GroundsSpaceRequirements
  spaceSpecs?: {
    soloRoom?: boolean
    sharedCohortLiving?: boolean
    liveWorkStudio?: boolean
    soundproofingRehearsal?: boolean
  }
  sweatEquityLedger?: GroundsSweatEquityLedger
  activeAcquisition?: GroundsActiveAcquisition
  updatedAt?: any
}
