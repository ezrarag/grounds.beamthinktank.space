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
}

export const landingSlides: LandingSlide[] = [
  {
    id: 'capital-engine',
    stepNumber: '01',
    eyebrow: 'Capital & Revenue Engine',
    shortTitle: 'How Grounds Generates Wealth',
    shortSummary:
      'We replace 18-month speculative debt with 14-day nominal acquisitions and convert community labor into bankable capital.',
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
    // High-resolution architectural / urban infrastructure imagery with dark grading
    fallbackImageUrl:
      'https://firebasestorage.googleapis.com/v0/b/beam-home.firebasestorage.app/o/Home%20Landing%2FCards%2FPeople_working_on_real_estate_20260924164840.jpg?alt=media&token=50dc18ca-de33-43ae-b3fd-be58bc389500',
  },
  {
    id: 'stakeholder-briefing',
    stepNumber: '02',
    eyebrow: 'Leadership & Weekly Deal Room',
    shortTitle: 'What Stakeholders Meet to Decide',
    shortSummary:
      'A 90-second executive briefing loop and direct line for Denail, DeTania, Rick, and Ezra to shape this week’s agenda.',
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
  },
  {
    id: 'community-shield',
    stepNumber: '03',
    eyebrow: 'Civic Permanence & Housing',
    shortTitle: 'The Community & Participant Shield',
    shortSummary:
      'Packers-style Community Land Trust ownership ensures no one can flip the neighborhood, while residents live free or cost-based.',
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
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2000&q=85',
    videoPlaceholderUrl: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-walking-in-a-city-neighborhood-42935-large.mp4',
  },
]
