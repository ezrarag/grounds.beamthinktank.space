/**
 * Registry and data models for Aldermanic/Civic Representatives and CDC/Land Trust Partners.
 * Provides civic relationship tracking and land-trust legal guidance across target city nodes.
 */

export type CivicRelationshipStatus = 'supportive' | 'aware' | 'in_dialogue' | 'pending_outreach'

export interface CivicRepresentative {
  id: string
  name: string
  title: string
  cityId: string
  cityName: string
  contactEmail?: string
  contactPhone?: string
  officeAddress?: string
  relationshipStatus: CivicRelationshipStatus
  keyFocus: string
  notes?: string
}

export interface NonProfitPartner {
  id: string
  name: string
  type: 'cdc' | 'land_trust' | 'housing_nonprofit' | 'community_action'
  cityId: string
  cityName: string
  focusArea: string
  contactPerson?: string
  activeNeighborhoods: string[]
  resaleRestrictionModel: string
  website?: string
  legalGuidanceNote?: string
}

export const CIVIC_REPRESENTATIVES: CivicRepresentative[] = [
  // Milwaukee, WI
  {
    id: 'mke-rep-1',
    name: 'Alderwoman Milele A. Coggs',
    title: 'Alderperson — 6th District (Bronzeville & Harambee)',
    cityId: 'milwaukee-wi',
    cityName: 'Milwaukee',
    contactEmail: 'mcoggs@milwaukee.gov',
    contactPhone: '(414) 286-2994',
    officeAddress: '200 E Wells St, Room 205, Milwaukee, WI',
    relationshipStatus: 'supportive',
    keyFocus: 'Housing Rehabilitation, Commercial Corridors & Anti-Displacement',
    notes: 'Key advocate for Bronzeville Cultural & Entertainment District and housing stabilization grants.',
  },
  {
    id: 'mke-rep-2',
    name: 'Alderman Robert J. Bauman',
    title: 'Alderperson — 4th District (Near West Side & Downtown)',
    cityId: 'milwaukee-wi',
    cityName: 'Milwaukee',
    contactEmail: 'rbauma@milwaukee.gov',
    contactPhone: '(414) 286-2221',
    officeAddress: '200 E Wells St, Room 205, Milwaukee, WI',
    relationshipStatus: 'in_dialogue',
    keyFocus: 'Transit-Oriented Development, Adaptive Reuse & Zoning Reform',
    notes: 'Active in Near West Side Partners initiatives and historic preservation overlay districts.',
  },

  // Orlando, FL
  {
    id: 'orl-rep-1',
    name: 'Commissioner Bakari F. Burns',
    title: 'City Commissioner — District 6 (Parramore & Washington Park)',
    cityId: 'orlando-fl',
    cityName: 'Orlando',
    contactEmail: 'bakari.burns@orlando.gov',
    contactPhone: '(407) 246-2006',
    officeAddress: '400 S Orange Ave, Orlando, FL',
    relationshipStatus: 'in_dialogue',
    keyFocus: 'Affordable Housing, Healthcare Equity & Small Business Incubation',
    notes: 'Lead champion for Parramore Comprehensive Neighborhood Plan.',
  },

  // Chicago, IL
  {
    id: 'chi-rep-1',
    name: 'Alderman Desmon Yancy',
    title: 'Alderman — 5th Ward (South Shore & Hyde Park)',
    cityId: 'chicago-il',
    cityName: 'Chicago',
    contactEmail: 'ward05@cityofchicago.org',
    contactPhone: '(773) 324-5555',
    officeAddress: '7054 S Jeffery Blvd, Chicago, IL',
    relationshipStatus: 'aware',
    keyFocus: 'Tenant Protections, Community Land Trusts & Commercial Development',
    notes: 'Engaged in South Shore anti-displacement policy framework.',
  },

  // Atlanta, GA
  {
    id: 'atl-rep-1',
    name: 'Councilmember Amir Farokhi',
    title: 'City Council Member — District 2 (Auburn Ave & Old Fourth Ward)',
    cityId: 'atlanta-ga',
    cityName: 'Atlanta',
    contactEmail: 'arfarokhi@atlantaga.gov',
    contactPhone: '(404) 330-6039',
    officeAddress: '55 Trinity Ave SW, Suite 2900, Atlanta, GA',
    relationshipStatus: 'supportive',
    keyFocus: 'Zoning Modernization, Historic Preservation & Infill Housing',
    notes: 'Sponsor of Atlanta missing-middle housing legislation.',
  },

  // Zellwood, FL
  {
    id: 'zlw-rep-1',
    name: 'Commissioner Christine Moore',
    title: 'County Commissioner — District 2 (Orange County FL / Zellwood)',
    cityId: 'zellwood-fl',
    cityName: 'Zellwood (Orange County)',
    contactEmail: 'district2@ocfl.net',
    contactPhone: '(407) 836-7350',
    officeAddress: '201 S Rosalind Ave, Orlando, FL',
    relationshipStatus: 'aware',
    keyFocus: 'Agricultural Conservation, Rural Infrastructure & Microgrid Energy',
    notes: 'Oversees Northwest Orange County rural heritage and agricultural zoning overlays.',
  },
]

export const NON_PROFIT_PARTNERS: NonProfitPartner[] = [
  // Milwaukee, WI
  {
    id: 'mke-cdc-1',
    name: 'Milwaukee Community Land Trust (MCLT)',
    type: 'land_trust',
    cityId: 'milwaukee-wi',
    cityName: 'Milwaukee',
    focusArea: 'Permanent Affordable Homesteading & Sweat-Equity Deeds',
    contactPerson: 'Executive Director, MCLT',
    activeNeighborhoods: ['Near West Side', 'Harambee', 'Lindsay Heights'],
    resaleRestrictionModel: '99-Year Renewable Ground Lease with Shared-Equity Formula',
    website: 'https://mkeclt.org',
    legalGuidanceNote:
      'MCLT provides standard ground lease covenants that solve sweat-equity tax valuation questions by retaining land title in trust while granting participants 100% home equity value.',
  },
  {
    id: 'mke-cdc-2',
    name: 'Northwest Side Community Development Corp (NWSCDC)',
    type: 'cdc',
    cityId: 'milwaukee-wi',
    cityName: 'Milwaukee',
    focusArea: 'Commercial Corridor Financing & Green Infrastructure',
    contactPerson: 'Planning Director, NWSCDC',
    activeNeighborhoods: ['Near West Side', 'Century City', 'Sherman Park'],
    resaleRestrictionModel: 'Commercial Sub-Lease with Community Benefit Agreement (CBA)',
    website: 'https://nwscdc.org',
    legalGuidanceNote: 'Partners on SBA 504 and EDA infrastructure grant co-applications.',
  },

  // Orlando, FL
  {
    id: 'orl-cdc-1',
    name: 'Central Florida Community Land Trust (CFCLT)',
    type: 'land_trust',
    cityId: 'orlando-fl',
    cityName: 'Orlando',
    focusArea: 'Parramore & West Orlando Affordable Housing Preservation',
    contactPerson: 'Program Officer, CFCLT',
    activeNeighborhoods: ['Parramore', 'Holden Heights', 'Washington Park'],
    resaleRestrictionModel: '99-Year Ground Lease with Fixed-Equity Cap',
    website: 'https://cfclt.org',
    legalGuidanceNote: 'Operates in partnership with City of Orlando Housing & Community Development Department.',
  },

  // Chicago, IL
  {
    id: 'chi-cdc-1',
    name: 'Chicago Community Land Trust (CCLT)',
    type: 'land_trust',
    cityId: 'chicago-il',
    cityName: 'Chicago',
    focusArea: 'Citywide Permanent Affordability & Deed-Restricted Units',
    contactPerson: 'Department of Housing Representative',
    activeNeighborhoods: ['South Shore', 'Woodlawn', 'Garfield Park'],
    resaleRestrictionModel: '30-Year to 99-Year Deed-Restricted Affordability Covenant',
    website: 'https://chicago.gov/cclt',
    legalGuidanceNote: 'Administered by City of Chicago DOH; provides property tax abatement alignment.',
  },

  // Atlanta, GA
  {
    id: 'atl-cdc-1',
    name: 'Atlanta Land Trust (ALT)',
    type: 'land_trust',
    cityId: 'atlanta-ga',
    cityName: 'Atlanta',
    focusArea: 'BeltLine & Historic Westside Permanent Housing',
    contactPerson: 'Stewardship Coordinator, ALT',
    activeNeighborhoods: ['Auburn Ave', 'Historic West End', 'English Avenue'],
    resaleRestrictionModel: '99-Year Ground Lease Model',
    website: 'https://atlantalandtrust.org',
    legalGuidanceNote: 'Integrates HUD Section 3 workforce requirements with community equity deeds.',
  },

  // Zellwood, FL
  {
    id: 'zlw-cdc-1',
    name: 'Florida Community Land Trust Institute & Orange County Extension',
    type: 'community_action',
    cityId: 'zellwood-fl',
    cityName: 'Zellwood (Orange County)',
    focusArea: 'Agri-Tech Cooperative Land Ownership & Rural Resilience',
    contactPerson: 'Regional Advisor',
    activeNeighborhoods: ['Zellwood', 'Apopka', 'Northwest Orange County'],
    resaleRestrictionModel: 'Agricultural Co-op Trust & Ground Lease Covenant',
    website: 'https://flhousing.org/clt',
    legalGuidanceNote: 'Specializes in rural housing trust models and USDA rural development grants.',
  },
]

export function getCivicRepresentatives(cityId?: string): CivicRepresentative[] {
  if (!cityId) return CIVIC_REPRESENTATIVES
  return CIVIC_REPRESENTATIVES.filter((rep) => rep.cityId === cityId)
}

export function getNonProfitPartners(cityId?: string): NonProfitPartner[] {
  if (!cityId) return NON_PROFIT_PARTNERS
  return NON_PROFIT_PARTNERS.filter((partner) => partner.cityId === cityId)
}
