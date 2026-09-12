export type ResidencyType = 'supportive' | 'market' | 'transitional'

export interface Resident {
  id: string
  displayName: string
  assetId: string
  unitId?: string
  residencyType: ResidencyType
  movedInAt?: string
  isAlsoParticipant: boolean
  participantProfileId?: string
  monthlyRentFeeUSD?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}
