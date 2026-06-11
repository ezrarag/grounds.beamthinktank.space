export interface NGOTrack {
  slug: string
  name: string
  summary: string
  focus: string
  outcomes: string[]
}

export type PathwayRole = 'learn' | 'earn' | 'teach' | 'partner' | 'own'

export interface ChapterContext {
  id: string
  label: string
}

export type PathwayMediaType = 'image' | 'video' | 'none'

export interface PathwayMedia {
  mediaType: PathwayMediaType
  mediaUrl: string
}

export interface Pathway {
  role: PathwayRole
  title: string
  icon: string
  description: Record<string, string>
  badges: string[]
  loopLine: string
  ctaLabel: string
  ctaHref: string
  mediaType?: PathwayMediaType
  mediaUrl?: string
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
  chapters: ChapterContext[]
  pathways: Pathway[]
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

const groundsChapters: ChapterContext[] = [
  { id: 'uwm', label: 'UWM chapter' },
  { id: 'mke', label: 'Milwaukee community' },
]

const groundsPathways: Pathway[] = [
  {
    role: 'learn',
    title: 'I need a place to live',
    icon: 'home',
    description: {
      uwm: 'BEAM participants live free in BEAM buildings. At-risk community members too.',
      mke: 'Tiered housing: free for participants and at-risk neighbors, cost-based for everyone else. No credit-score gatekeeping.',
    },
    badges: ['Free–cost-based', 'Tiered housing'],
    loopLine: 'Cost-based rents fund free units — residents fund residents.',
    ctaLabel: 'Find housing',
    ctaHref: '/login',
  },
  {
    role: 'earn',
    title: 'I want to build and earn',
    icon: 'hammer',
    description: {
      uwm: 'Architecture, engineering, and trades students: work on real acquisitions and renovations for credit, portfolio, or pay.',
      mke: 'Join a property-ops cohort. Sweat equity on real buildings becomes income, skills, and housing credit.',
    },
    badges: ['Paid cohort', 'Sweat equity'],
    loopLine: 'Sweat equity converts directly to wages and housing credit.',
    ctaLabel: 'Join a cohort',
    ctaHref: '/login',
  },
  {
    role: 'teach',
    title: 'I want to lead projects',
    icon: 'megaphone',
    description: {
      uwm: 'Faculty and credentialed professionals: advise cohorts, stamp drawings, direct renovations.',
      mke: 'Architects, planners, and tradespeople the institutions passed over — lead the work here.',
    },
    badges: ['Leadership', 'Compensated'],
    loopLine: 'Leadership goes first to those institutions overlooked.',
    ctaLabel: 'Lead a project',
    ctaHref: '/login',
  },
  {
    role: 'partner',
    title: 'We have a building / we need help',
    icon: 'handshake',
    description: {
      uwm: 'Departments and the Foundation: co-develop adaptive reuse with BEAM as operating partner.',
      mke: 'Churches, libraries, the County: BEAM brings the cohort workforce and operating model to your building.',
    },
    badges: ['Adaptive reuse', 'Partnership'],
    loopLine: 'Partner contracts fund participant wages and free housing units.',
    ctaLabel: 'Start a partnership',
    ctaHref: '/login',
  },
  {
    role: 'own',
    title: 'I want to own a piece of this',
    icon: 'scale',
    description: {
      uwm: 'Community land trust membership — students and neighbors hold the buildings together.',
      mke: 'Packers-style ownership: members hold the land trust so no one can flip the neighborhood.',
    },
    badges: ['Land trust', 'Membership'],
    loopLine: 'Trust ownership keeps buildings permanently community-held.',
    ctaLabel: 'Become a member',
    ctaHref: '/login',
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
  chapters: groundsChapters,
  pathways: groundsPathways,
}
