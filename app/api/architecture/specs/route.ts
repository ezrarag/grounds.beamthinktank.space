import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface ArchitecturalSpecsResult {
  parcelId: string
  found: boolean
  architectureRequired: boolean
  buildingType?: string
  structuralConditionRating?: 'A - Move-in Ready' | 'B - Moderate Rehab' | 'C - Major Structural Rehab' | 'D - Shell / Gut Rehab'
  acousticCeilingHeightFt?: number
  hasCadBimModel?: boolean
  cadModelUrl?: string
  elevationDrawings?: string[]
  floorPlanPreviews?: string[]
  recommendedSqftScope?: {
    minSqft: number
    maxSqft: number
    suggestedLayouts: string[]
  }
}

// Known architectural specs seed database for BEAM key properties
const ARCH_DATABASE: Record<string, ArchitecturalSpecsResult> = {
  '388-1204-000': {
    parcelId: '388-1204-000',
    found: true,
    architectureRequired: false,
    buildingType: 'Historic Sanctuary / Adaptive Reuse Hub',
    structuralConditionRating: 'B - Moderate Rehab',
    acousticCeilingHeightFt: 28,
    hasCadBimModel: true,
    cadModelUrl: '/docs/models/388-1204-sanctuary.ifc',
    elevationDrawings: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    ],
    floorPlanPreviews: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    ],
    recommendedSqftScope: {
      minSqft: 8000,
      maxSqft: 14500,
      suggestedLayouts: ['Recording Studio + Live Chamber', 'Community Hall & Acoustic Gallery', 'Shared Workspace'],
    },
  },
  '392-0501-100': {
    parcelId: '392-0501-100',
    found: true,
    architectureRequired: false,
    buildingType: 'Commercial Center / Innovation Anchor',
    structuralConditionRating: 'A - Move-in Ready',
    acousticCeilingHeightFt: 18,
    hasCadBimModel: true,
    cadModelUrl: '/docs/models/392-0501-civic.ifc',
    elevationDrawings: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    ],
    floorPlanPreviews: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80',
    ],
    recommendedSqftScope: {
      minSqft: 35000,
      maxSqft: 85000,
      suggestedLayouts: ['Multi-Tenant Commercial Hub', 'Trade Lab & Workshop', 'Civic Auditorium'],
    },
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parcelId = searchParams.get('parcelId')?.trim() || searchParams.get('taxKey')?.trim()

  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId or taxKey parameter is required.' }, { status: 400 })
  }

  // Check known seed database
  const matchKey = Object.keys(ARCH_DATABASE).find((k) => parcelId.toLowerCase().includes(k.toLowerCase()))
  if (matchKey) {
    return NextResponse.json(ARCH_DATABASE[matchKey])
  }

  // Default response for searched parcels requiring architectural scoping
  const fallbackResult: ArchitecturalSpecsResult = {
    parcelId,
    found: true,
    architectureRequired: true,
    buildingType: 'Mixed-Use Revitalization Candidate',
    structuralConditionRating: 'C - Major Structural Rehab',
    acousticCeilingHeightFt: 14,
    hasCadBimModel: false,
    recommendedSqftScope: {
      minSqft: 2400,
      maxSqft: 6500,
      suggestedLayouts: [
        'Ground-Floor Retail / Production Space',
        'Upper Level Cohort Housing',
        'Acoustic Rehearsal Room',
      ],
    },
  }

  return NextResponse.json(fallbackResult)
}
