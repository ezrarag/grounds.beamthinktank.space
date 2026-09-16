import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface WorkforceGrantMatch {
  id: string
  programName: string
  agency: string
  grantType: 'federal-hud' | 'state-wioa' | 'municipal-cdbg' | 'epa-brownfield' | 'workforce-stipend'
  allocatedAmount: number
  hourlyStipendMatch?: number
  eligibilityRequirements: string[]
  applicationStatus: 'Open Intake' | 'Matching Active' | 'Rolling Application'
  description: string
}

export interface GrantMatchResponse {
  parcelId?: string
  locationContext?: string
  totalGrantAllocation: number
  matchedGrants: WorkforceGrantMatch[]
}

const GRANT_CATALOG: WorkforceGrantMatch[] = [
  {
    id: 'hud-sec3-youthbuild',
    programName: 'HUD Section 3 YouthBuild Earn-and-Learn Grant',
    agency: 'U.S. Dept of Housing & Urban Development (HUD)',
    grantType: 'federal-hud',
    allocatedAmount: 120000,
    hourlyStipendMatch: 30.0,
    eligibilityRequirements: [
      'Low-to-moderate income participant enrollment',
      'Hands-on site remediation & deconstruction labor',
      'Minimum 12 logged hours per quarter',
    ],
    applicationStatus: 'Matching Active',
    description:
      'Federal workforce development grant paying $30/hr HUD equivalent matches for participant labor on public land trust sites.',
  },
  {
    id: 'wioa-pre-apprentice',
    programName: 'WIOA Pre-Apprenticeship Trades Stipend',
    agency: 'State Workforce Development Board',
    grantType: 'state-wioa',
    allocatedAmount: 45000,
    hourlyStipendMatch: 25.0,
    eligibilityRequirements: [
      'Enrolled in BEAM Grounds site stewardship cohort',
      'Licensed trade mentor supervision (electrical, carpentry, plumbing)',
    ],
    applicationStatus: 'Open Intake',
    description:
      'State workforce development stipend providing direct wage subsidies for registered pre-apprenticeship restoration work.',
  },
  {
    id: 'cdbg-rehab-fund',
    programName: 'Municipal CDBG Emergency Structural Rehab Fund',
    agency: 'City Department of Neighborhood Services',
    grantType: 'municipal-cdbg',
    allocatedAmount: 35000,
    eligibilityRequirements: [
      'Property located in designated municipal revitalization target node',
      'Addresses urgent roof, masonry, or structural safety violations',
    ],
    applicationStatus: 'Rolling Application',
    description:
      'Community Development Block Grant allocation dedicated to structural stabilization and weatherization of tax-foreclosed properties.',
  },
  {
    id: 'epa-brownfield-assess',
    programName: 'EPA Brownfield Phase I/II Environmental Assessment Grant',
    agency: 'Environmental Protection Agency (EPA)',
    grantType: 'epa-brownfield',
    allocatedAmount: 75000,
    eligibilityRequirements: [
      'Adaptive reuse or commercial production site candidate',
      'Environmental testing & soil remediation required',
    ],
    applicationStatus: 'Matching Active',
    description:
      'Environmental assessment grant covering 100% of Phase I & II site testing and soil abatement for historic commercial properties.',
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parcelId = searchParams.get('parcelId')?.trim()
  const zipCode = searchParams.get('zipCode')?.trim()
  const city = searchParams.get('city')?.trim()

  const totalGrantAllocation = GRANT_CATALOG.reduce((sum, g) => sum + g.allocatedAmount, 0)

  const response: GrantMatchResponse = {
    parcelId: parcelId || 'General Site Match',
    locationContext: city ? `${city} Target Node` : zipCode ? `Zip Code ${zipCode}` : 'Nationwide Civic Target Nodes',
    totalGrantAllocation,
    matchedGrants: GRANT_CATALOG,
  }

  return NextResponse.json(response)
}
