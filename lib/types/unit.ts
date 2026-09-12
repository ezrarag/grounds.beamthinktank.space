export type OccupancyStatus = 'vacant' | 'occupied' | 'offline'

export interface Unit {
  id: string
  assetId: string
  label: string
  beds: number
  baths: number
  hasKitchenette: boolean
  hasLaundry: boolean
  squareFeet?: number
  occupancyStatus: OccupancyStatus
  residentId?: string
  createdAt?: string
  updatedAt?: string
}
