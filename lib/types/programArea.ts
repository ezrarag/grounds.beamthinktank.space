import type { AcquisitionTrackId, ProductionLane } from '@/lib/tracks'

export type ProgramAreaStage = 'planned' | 'permitted' | 'fitting-out' | 'operating'

export interface ProgramArea {
  id: string
  assetId: string
  label: string
  operatingTrack: AcquisitionTrackId
  productionLane?: ProductionLane
  squareFeet?: number
  regulator?: string
  stage: ProgramAreaStage
  notes?: string
  createdAt?: string
  updatedAt?: string
}
