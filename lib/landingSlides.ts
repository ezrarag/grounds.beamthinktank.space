export interface SlideBranchOption {
  id: string
  label: string
  title: string
  description: string
  metric?: string
  href?: string
}

export interface DeckSlide {
  badge: string
  title: string
  headlineStat?: string
  statLabel?: string
  body: string
  bullets?: string[]
  cta?: {
    label: string
    href?: string
    action?: 'briefing' | 'agenda' | 'link'
  }
}

export interface LandingSlide {
  id: string
  stepNumber: string
  eyebrow: string
  shortTitle: string
  shortSummary: string
  fullHeadline: string
  fullNarrative: string
  keyMetrics: Array<{ label: string; value: string }>
  bulletPoints: string[]
  badges: string[]
  primaryCta: {
    label: string
    action: 'escalate' | 'link'
    href?: string
  }
  secondaryCta?: {
    label: string
    href: string
  }
  branchOptions?: SlideBranchOption[]
  deckSlides?: DeckSlide[]
  videoPlaceholderUrl?: string
  fallbackImageUrl: string
  backgroundImages?: string[]
}

export interface OperatingLoopChapter {
  id: string
  time: string
  title: string
  text: string
  videoUrl?: string
}

export const defaultOperatingLoopChapters: OperatingLoopChapter[] = [
  {
    id: 'ch-1',
    time: '0:00',
    title: '01. The Hook: 14 Days vs. 18 Months',
    text: 'Traditional real estate takes 18 months and millions in predatory bank debt. Here is how BEAM acquires and activates community property in 14 days.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2F90sec%2FBEAM_Grounds_changes_real_estate_20260924185930.mp4?alt=media&token=2decee57-c8ed-4e0d-8426-c05dc87b65b4',
  },
  {
    id: 'ch-2',
    time: '0:20',
    title: '02. The Method: Nominal Deeds & Pre-Law',
    text: 'We use nominal title transfers, abandonment clauses, and standardized pre-law memos to step into tax-delinquent properties instantly, turning closed liabilities back into active civic assets.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2F90sec%2FAcquiring_tax-delinquent_municip%E2%80%A6_20260924191310.mp4?alt=media&token=6d1bd48e-476c-48bb-8d41-f64d1e5ae94c',
  },
  {
    id: 'ch-3',
    time: '0:45',
    title: '03. The Engine: BFCU Labor Collateral',
    text: 'Local trade and music cohorts fix the space to earn accredited sweat-equity tokens, sheltered under our non-profit umbrella and backed by BEAM Federal Credit Union for rehab capital.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2F90sec%2FCrews_renovating_building_for_ca%E2%80%A6_20260924194914.mp4?alt=media&token=4742b0b6-ebfa-4b5c-a61d-d9d91e19b333',
  },
  {
    id: 'ch-4',
    time: '1:10',
    title: '04. The Shield: 99-Year Community Trust',
    text: 'Underlying land is deeded to a permanent Community Land Trust so no one can flip the neighborhood. Participants live free or cost-based with zero credit score gatekeeping.',
    videoUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2F90sec%2FCommunity_land_trust_membership_UI_20260924200304.mp4?alt=media&token=3da3b90e-3f9c-464b-9a83-8abcd52148b5',
  },
]

export const landingSlides: LandingSlide[] = [
  {
    id: 'capital-engine',
    stepNumber: '01',
    eyebrow: 'Capital & Revenue Engine',
    shortTitle: 'Capital',
    shortSummary: 'Replacing debt with nominal acquisitions and community equity.',
    fullHeadline: '14-Day Title Control Meets Labor-Backed Capital Stacks',
    fullNarrative:
      'Traditional developers borrow millions at high interest rates and spend two years in bureaucracy. BEAM Grounds utilizes statutory abandonment clauses, nominal municipal transfers, and standardized pre-law memos to assume title control in 14 days. We then partner with BEAM Federal Credit Union (BFCU) to convert rehearsal hours and sweat-equity labor into hard rehabilitation collateral.',
    keyMetrics: [
      { label: 'Title Control Window', value: '14 Days' },
      { label: 'Interest Debt Incurred', value: '$0' },
      { label: 'Labor Conversion', value: 'BFCU Equity' },
    ],
    bulletPoints: [
      'Nominal property acquisitions from delinquent municipal tax rolls at negligible entry cost.',
      'BFCU underwriting transforms accredited labor hours into institutional rehabilitation loans.',
      'Commercial tenant leases and cost-based rents fund ongoing operations and free participant units.',
      'Pre-law quiet title actions remove legacy encumbrances without protracted courtroom drag.',
    ],
    badges: ['Zero Speculative Debt', '14-Day Acquisition', 'BFCU Labor Collateral', 'Self-Sustaining Yield'],
    primaryCta: {
      label: 'Inspect Capital Mechanics',
      action: 'escalate',
    },
    secondaryCta: {
      label: 'Explore Active Parcels',
      href: '/properties',
    },
    branchOptions: [
      {
        id: 'nominal-title',
        label: '14-Day Title Acquisition',
        title: 'Nominal Municipal Transfers & Pre-Law Memos',
        description: 'How pre-law memos and municipal abandonment petitions secure physical and legal site custody in 2 weeks.',
        metric: '14 Days to Deed',
        href: '/about',
      },
      {
        id: 'bfcu-model',
        label: 'BFCU Labor-to-Capital',
        title: 'Converting Rehearsal & Trade Hours into Collateral',
        description: 'How sweat equity and performance rehearsal hours are banked and borrowed against for physical renovation.',
        metric: '$1:1 Labor Valuation',
        href: '/portal/financing',
      },
      {
        id: 'tenant-revenue',
        label: 'Commercial & Mixed-Use Cash Flow',
        title: 'Commercial Tenancy Funding Free Community Units',
        description: 'Ground floor retail, recording studios, and light industrial tenants generate operating profits that subsidize free housing.',
        metric: 'Tiered Rent Stack',
        href: '/properties',
      },
    ],
    deckSlides: [
      {
        badge: '01 // VELOCITY & SPEED',
        title: '14-Day Title Control',
        headlineStat: '14 Days',
        statLabel: 'TITLE CONTROL WINDOW',
        body: 'We replace 18-month speculative debt with statutory abandonment petitions and nominal municipal transfers.',
        bullets: [
          '$0 speculative interest debt incurred',
          'Immediate physical & legal custody without two years of courtroom drag',
        ],
      },
      {
        badge: '02 // THE COLLATERAL ENGINE',
        title: 'Labor-Backed Capital Stacks',
        headlineStat: 'BFCU Equity',
        statLabel: 'LABOR-TO-CAPITAL VALUATION',
        body: 'BEAM Federal Credit Union (BFCU) underwrites trade craftsmanship and music rehearsal hours directly into bankable renovation collateral.',
        bullets: [
          'Accredited sweat-equity token conversion at $30/hr HUD standard',
          'Community craftsmanship replaces high-interest bank bridge loans',
        ],
      },
      {
        badge: '03 // MUNICIPAL INTAKE',
        title: 'Nominal Deeds & Pre-Law Memos',
        headlineStat: '$0 Debt',
        statLabel: 'ENTRY ACQUISITION COST',
        body: 'Standardized pre-law quiet title memos dissolve legacy encumbrances and back taxes, absorbing delinquent parcels into the civic trust.',
        bullets: [
          'Pre-cleared legal memos protect against contractor liabilities',
          'Tax-delinquent municipal rolls turned back into active community anchors',
        ],
      },
      {
        badge: '04 // SUSTAINABLE YIELD',
        title: 'Self-Sustaining Commercial Yield',
        headlineStat: '100% Local',
        statLabel: 'NEIGHBORHOOD RECIRCULATION',
        body: 'Ground-floor commercial leases and creative studios generate operating yields that cross-subsidize free and cost-based housing.',
        bullets: [
          'Commercial tenants cover utilities and master lease costs',
          'Surplus cash flows reinvested directly into adjacent neighborhood parcels',
        ],
        cta: {
          label: 'Explore Active Parcels →',
          href: '/properties',
          action: 'link',
        },
      },
    ],
    fallbackImageUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FPeople_working_on_real_estate_20260924164840.jpg?alt=media&token=50dc18ca-de33-43ae-b3fd-be58bc389500',
    backgroundImages: [
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FPeople_working_on_real_estate_20260924164840.jpg?alt=media&token=50dc18ca-de33-43ae-b3fd-be58bc389500',
    ],
  },
  {
    id: 'stakeholder-briefing',
    stepNumber: '02',
    eyebrow: 'Labor & Site Operations',
    shortTitle: 'Labor',
    shortSummary: 'Mobilizing local crews to execute on-site work directly.',
    fullHeadline: 'The Weekly Decision Engine for BEAM Leadership',
    fullNarrative:
      'Every week, leadership convenes to approve property pipeline clearances, capital allocations, and cohort staffing. Instead of passive reports, stakeholders review 90-second decision briefings and submit specific queries or agenda items directly into the weekly queue.',
    keyMetrics: [
      { label: 'Executive Briefing', value: '90 Sec' },
      { label: 'Agenda Queue', value: 'Live Sync' },
      { label: 'Weekly Cadence', value: 'Action First' },
    ],
    bulletPoints: [
      'Interactive video briefings break down complex deal structures in under two minutes.',
      'Live question-and-concern intake instantly updates the upcoming meeting docket.',
      'Pre-vetted pre-law memos provide board-ready diligence before commitments are made.',
      'Transparent tracking of cohort safety, financial health, and property milestones.',
    ],
    badges: ['90-Sec Executive Loop', 'Live Agenda Queue', 'Pre-Law Diligence', 'Weekly Decision Room'],
    primaryCta: {
      label: 'Open Executive Briefing & Agenda',
      action: 'escalate',
    },
    secondaryCta: {
      label: 'Institutional Portal',
      href: '/portal/suggest-site',
    },
    branchOptions: [
      {
        id: 'agenda-input',
        label: 'Submit Agenda Topic',
        title: 'Add a Priority Item to Next Meeting',
        description: 'Directly send a question or topic to Denail, DeTania, Rick, and Ezra’s weekly meeting agenda queue.',
        metric: 'Instant Queue',
      },
      {
        id: 'play-briefing',
        label: 'Watch 90-Sec Briefing',
        title: 'The Grounds Operating Thesis in 90 Seconds',
        description: 'Fast-paced video overview explaining the speed, legal mechanisms, and economic loop of BEAM Grounds.',
        metric: '90s Run Time',
      },
      {
        id: 'review-docket',
        label: 'Pre-Law Docket',
        title: 'Legal Clearance & Risk Shields',
        description: 'Examine standardized contracts, liability firewalls, and municipal partnership frameworks.',
        metric: '100% Pre-Vetted',
        href: '/about',
      },
    ],
    deckSlides: [
      {
        badge: '01 // WORKFORCE DEPLOYMENT',
        title: 'Direct Cohort Mobilization',
        headlineStat: '5 Trades',
        statLabel: 'ACTIVE WORKFORCE DISCIPLINES',
        body: 'Carpentry, electrical, acoustics, demolition, and site stewardship crews deployed directly to clear municipal violations.',
        bullets: [
          'Accredited work shifts supervised by master tradespeople',
          'Zero predatory general-contractor markups on rehabilitation',
        ],
      },
      {
        badge: '02 // EXECUTIVE CADENCE',
        title: 'Weekly Leadership Deal Room',
        headlineStat: 'Every Tuesday',
        statLabel: 'EXECUTIVE DOCKET',
        body: 'Denail, DeTania, Rick, brother, and Ezra convene weekly to clear pipeline gates, allocate capital, and approve site rosters.',
        bullets: [
          '90-second video briefings replace dense 50-page bureaucratic reports',
          'Live stakeholder intake queue updates the upcoming meeting docket',
        ],
      },
      {
        badge: '03 // FIELD INTELLIGENCE',
        title: 'Proximity Dispatch & Real-Time Tracking',
        headlineStat: 'Live Map',
        statLabel: 'MAPBOX PROXIMITY GRID',
        body: 'Participant beacons link verified crew members directly to municipal parcels, tracking hours and supply drops live.',
        bullets: [
          'Transparent on-site material logs and safety protocols',
          'Approved shifts immediately credited to the participant equity ledger',
        ],
      },
      {
        badge: '04 // ACTION FIRST',
        title: 'Shape This Week’s Agenda',
        headlineStat: '90 Sec',
        statLabel: 'BRIEFING RUN TIME',
        body: 'Watch the complete 90-second operating loop or submit a priority question directly into the leadership docket.',
        bullets: [
          'Review 4-chapter interactive video thesis',
          'Direct channel to executive leadership',
        ],
        cta: {
          label: 'Watch 90s Operating Loop ▶',
          action: 'briefing',
        },
      },
    ],
    fallbackImageUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FFullscreen_no_laptop_shown_20260924164948.jpg?alt=media&token=359610f3-ee9c-40ac-93ca-8a76ddf7f17f',
    backgroundImages: [
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FFullscreen_no_laptop_shown_20260924164948.jpg?alt=media&token=359610f3-ee9c-40ac-93ca-8a76ddf7f17f',
    ],
  },
  {
    id: 'community-shield',
    stepNumber: '03',
    eyebrow: 'Commons & Community Returns',
    shortTitle: 'Equity',
    shortSummary: 'Returning long-term parcel appreciation directly to the neighborhood.',
    fullHeadline: 'Permanent Community Land Trust & Sweat-Equity Housing',
    fullNarrative:
      'Neighborhoods are frequently revitalized only for original residents to be priced out. BEAM Grounds legally severs land ownership from building improvements: the land is held in perpetuity by a community land trust governed like the Green Bay Packers. Meanwhile, participants in our trade, acoustics, and engineering cohorts convert their sweat equity into home equity and tiered housing with zero credit score discrimination.',
    keyMetrics: [
      { label: 'Land Trust Covenant', value: '99 Years' },
      { label: 'Credit Gatekeeping', value: 'None ($0)' },
      { label: 'Homestead Claim', value: '$1 Deed' },
    ],
    bulletPoints: [
      '99-year CLT ground lease covenants eliminate speculative resale and lock in permanent affordability.',
      'Tiered housing model: cost-based rents from commercial tenants cross-subsidize free participant units.',
      'Path-to-Deed engine lets youth and trade cohorts earn real legal equity via accredited site shifts.',
      'Neighborhood civic anchors (libraries, community centers, arts facilities) preserved under local control.',
    ],
    badges: ['99-Year Land Trust', 'Anti-Gentrification Shield', 'No Credit Gatekeeping', 'Tiered Free Housing'],
    primaryCta: {
      label: 'Explore Community Structure',
      action: 'escalate',
    },
    secondaryCta: {
      label: 'Participant Portal',
      href: '/portal/participant',
    },
    branchOptions: [
      {
        id: 'clt-model',
        label: 'Land Trust Structure',
        title: 'Packers-Style Collective Land Ownership',
        description: 'How the Community Land Trust locks in permanent affordability and prevents predatory land flips.',
        metric: '99-Yr Covenants',
        href: '/about',
      },
      {
        id: 'participant-housing',
        label: 'Participant Housing',
        title: 'Tiered Living: From Free to Cost-Based',
        description: 'No credit scores, no arbitrary security deposits. Participants exchange accredited cohort labor for housing.',
        metric: '100% Dignity',
        href: '/portal/participant',
      },
      {
        id: 'path-to-deed',
        label: 'Path-to-Deed $1 Homesteads',
        title: 'Earning Municipal Deeds via Sweat Equity',
        description: 'Youth, artists, and tradespeople log sweat-equity hours to acquire $1 city-owned homesteads with clear title.',
        metric: '$1 Municipal Deeds',
        href: '/portal/participant',
      },
    ],
    deckSlides: [
      {
        badge: '01 // CIVIC PERMANENCE',
        title: '99-Year Community Land Trust',
        headlineStat: '99 Years',
        statLabel: 'LAND TRUST COVENANT',
        body: 'We sever underlying land from building improvements. The ground is deeded to a permanent trust governed like the Green Bay Packers.',
        bullets: [
          'Permanent ground covenants prevent predatory speculative resale',
          'Neighborhood land can never be flipped by outside private equity',
        ],
      },
      {
        badge: '02 // CIVIC DIGNITY',
        title: 'Zero Credit Score Gatekeeping',
        headlineStat: '$0 Credit',
        statLabel: 'DIGNITY-FIRST HOUSING',
        body: 'No credit checks, no predatory deposits. Cohort members exchange accredited sweat equity for secure, tiered participant residency.',
        bullets: [
          'Tiered housing model: from completely free to cost-based rent',
          'Commercial tenant revenues guarantee building solvency',
        ],
      },
      {
        badge: '03 // WEALTH CREATION',
        title: 'The $1 Homestead Deed Transfer',
        headlineStat: '$1 Deed',
        statLabel: 'PATH-TO-DEED CONVEYANCE',
        body: 'Participants who log approved renovation hours step into physical building ownership through nominal city homestead deeds.',
        bullets: [
          'Sweat equity converts directly into personal home equity',
          'Pre-law title guarantee delivers unencumbered deed ownership',
        ],
      },
      {
        badge: '04 // PERMANENT VALUE',
        title: 'Reclaiming the Neighborhood',
        headlineStat: '100% Local',
        statLabel: 'COMMUNITY WEALTH RETAINED',
        body: 'Parcel appreciation stays in the community. Enter the participant portal to explore active homesteads and register your skills.',
        bullets: [
          'Browse public homestead parcels across active cities',
          'Begin tracking accredited sweat-equity hours today',
        ],
        cta: {
          label: 'Enter Participant Portal ↗',
          href: '/portal/participant',
          action: 'link',
        },
      },
    ],
    fallbackImageUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FPeople_entering_housing_facility_20260924182706.jpg?alt=media&token=c8d7b544-14ad-4f21-ba62-b9da168c2707',
    backgroundImages: [
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FPeople_entering_housing_facility_20260924182706.jpg?alt=media&token=c8d7b544-14ad-4f21-ba62-b9da168c2707',
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FSimplify_people_and_perspective_20260924183718.jpg?alt=media&token=4d0655a8-ed8a-4b55-9de0-49772fc373a2',
    ],
  },
]
