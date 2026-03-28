export interface NGOTrack {
  slug: string
  name: string
  summary: string
  focus: string
  outcomes: string[]
}

export interface NGOConfig {
  id: string
  name: string
  subdomain: string
  siteUrl: string
  tagline: string
  description: string
  primaryColor: string
  tracks: NGOTrack[]
  cohortId: string
  organizationId: string
  entryChannel: string
  beamHomeUrl: string
  handoffReturnPath: string
}

const groundsTracks: NGOTrack[] = [
  {
    slug: 'acquisition-pipeline',
    name: 'Acquisition Pipeline',
    summary: 'Source, evaluate, and sequence properties that can anchor neighborhood-scale regeneration.',
    focus: 'Opportunity screening, parcel intelligence, and purchase readiness.',
    outcomes: ['Deal screens', 'Target property queue', 'Acquisition readiness memos'],
  },
  {
    slug: 'financing-architecture',
    name: 'Financing Architecture',
    summary: 'Design layered capital stacks that can move civic and mixed-use projects into execution.',
    focus: 'Debt, grants, mission capital, and community-aligned funding structures.',
    outcomes: ['Capital stack drafts', 'Funding pathway maps', 'Partner diligence checklists'],
  },
  {
    slug: 'redevelopment-cohort',
    name: 'Redevelopment Cohort',
    summary: 'Coordinate students, residents, operators, and technical partners around live redevelopment work.',
    focus: 'Cohort learning, project cadence, and implementation support.',
    outcomes: ['Working groups', 'Redevelopment sprints', 'Cohort briefings'],
  },
  {
    slug: 'civic-anchor-development',
    name: 'Civic Anchor Development',
    summary: 'Translate strategic sites into durable civic anchors for education, commerce, and neighborhood services.',
    focus: 'Place strategy, activation planning, and long-horizon stewardship.',
    outcomes: ['Anchor concepts', 'Activation plans', 'Community use frameworks'],
  },
]

export const groundsConfig: NGOConfig = {
  id: 'beam-grounds',
  name: 'BEAM Grounds',
  subdomain: 'grounds',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || '',
  tagline: 'Real estate, civic infrastructure, and neighborhood development inside the BEAM network.',
  description:
    'BEAM Grounds is the place-based development arm of the BEAM ecosystem, coordinating acquisition, financing, redevelopment, and civic anchor strategy for community-serving real estate.',
  primaryColor: '#88aa8f',
  tracks: groundsTracks,
  cohortId: process.env.NEXT_PUBLIC_GROUNDS_COHORT_ID?.trim() || 'cohort_beam_grounds_launch',
  organizationId: process.env.NEXT_PUBLIC_GROUNDS_ORGANIZATION_ID?.trim() || 'org_beam_grounds',
  entryChannel: process.env.NEXT_PUBLIC_GROUNDS_ENTRY_CHANNEL?.trim() || 'grounds.beamthinktank.space',
  beamHomeUrl: process.env.NEXT_PUBLIC_BEAM_HOME_URL?.trim() || 'https://home.beamthinktank.space',
  handoffReturnPath: '/portal/dashboard',
}
