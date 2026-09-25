export interface SlideBranchOption {
  id: string
  label: string
  title: string
  description: string
  metric?: string
  href?: string
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
  },
  {
    id: 'ch-4',
    time: '1:10',
    title: '04. The Shield: 99-Year Community Trust',
    text: 'Underlying land is deeded to a permanent Community Land Trust so no one can flip the neighborhood. Participants live free or cost-based with zero credit score gatekeeping.',
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
    fallbackImageUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FPeople_entering_housing_facility_20260924182706.jpg?alt=media&token=c8d7b544-14ad-4f21-ba62-b9da168c2707',
    backgroundImages: [
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FPeople_entering_housing_facility_20260924182706.jpg?alt=media&token=c8d7b544-14ad-4f21-ba62-b9da168c2707',
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FSimplify_people_and_perspective_20260924183718.jpg?alt=media&token=4d0655a8-ed8a-4b55-9de0-49772fc373a2',
    ],
  },
]
