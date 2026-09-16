import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface EnterpriseProjectSponsorship {
  id: string
  name: string
  address: string
  city: string
  state: string
  track: 'A' | 'B' | 'C' | 'D'
  acquisitionStage: string
  totalCapitalBudget: number
  sweatEquityOffset: number
  corporateCoInvestmentRequired: number
  sponsoringEnterpriseName?: string
  esgTaxCreditEligible: boolean
  activeSquadCount: number
}

export interface EnterprisePortfolioSyncResponse {
  syncTimestamp: string
  totalActiveGroundProjects: number
  totalCorporateCapitalNeeded: number
  projects: EnterpriseProjectSponsorship[]
}

const ENTERPRISE_PROJECTS: EnterpriseProjectSponsorship[] = [
  {
    id: 'boniface-sanctuary',
    name: 'Central Sanctuary & Recording Studio Residency',
    address: '639 N 25th St',
    city: 'Milwaukee',
    state: 'WI',
    track: 'C',
    acquisitionStage: 'STABILIZE',
    totalCapitalBudget: 185000,
    sweatEquityOffset: 45000,
    corporateCoInvestmentRequired: 140000,
    sponsoringEnterpriseName: 'BEAM Business Capital Partners / BTT Enterprise',
    esgTaxCreditEligible: true,
    activeSquadCount: 7,
  },
  {
    id: 'sweet-auburn-barn',
    name: 'Sweet Auburn Cultural & Acoustic Innovation Hub',
    address: '450 Auburn Ave NE',
    city: 'Atlanta',
    state: 'GA',
    track: 'C',
    acquisitionStage: 'CLAIM',
    totalCapitalBudget: 220000,
    sweatEquityOffset: 60000,
    corporateCoInvestmentRequired: 160000,
    esgTaxCreditEligible: true,
    activeSquadCount: 5,
  },
  {
    id: 'ybor-arts-lab',
    name: 'Ybor City Historic Production & Trade Lab',
    address: '1901 E 7th Ave',
    city: 'Tampa',
    state: 'FL',
    track: 'D',
    acquisitionStage: 'SIGNAL',
    totalCapitalBudget: 310000,
    sweatEquityOffset: 85000,
    corporateCoInvestmentRequired: 225000,
    esgTaxCreditEligible: true,
    activeSquadCount: 4,
  },
]

export async function GET() {
  const totalNeeded = ENTERPRISE_PROJECTS.reduce((sum, p) => sum + p.corporateCoInvestmentRequired, 0)

  const response: EnterprisePortfolioSyncResponse = {
    syncTimestamp: new Date().toISOString(),
    totalActiveGroundProjects: ENTERPRISE_PROJECTS.length,
    totalCorporateCapitalNeeded: totalNeeded,
    projects: ENTERPRISE_PROJECTS,
  }

  return NextResponse.json(response)
}
