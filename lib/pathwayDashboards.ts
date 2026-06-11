import type { PathwayRole } from '@/lib/ngoConfig'

export interface DashboardTile {
  id: string
  title: string
  description: string
  icon: string
  href?: string
  status: 'live' | 'stub'
  primary?: boolean
}

export interface PathwayDashboard {
  pathwayRole: PathwayRole
  heading: string
  subheading: string
  tiles: DashboardTile[]
}

/**
 * Structural metadata for each pathway: where its workspace lives, how it is
 * labelled in nav, and which icon represents it. Kept separate from the tile
 * registry so route wiring stays out of the swappable content layer — other
 * NGO repos lift {@link PATHWAY_DASHBOARDS} unchanged while keeping their own routes.
 */
export const PATHWAY_META: Record<PathwayRole, { route: string; navLabel: string; icon: string }> = {
  learn: { route: '/portal/residence', navLabel: 'Your housing', icon: 'home' },
  earn: { route: '/portal/cohort', navLabel: 'Your cohort', icon: 'hammer' },
  teach: { route: '/portal/lead', navLabel: 'Your projects', icon: 'megaphone' },
  partner: { route: '/portal/financing', navLabel: 'Your pipeline', icon: 'handshake' },
  own: { route: '/portal/trust', navLabel: 'Your trust', icon: 'scale' },
}

export const PATHWAY_ROUTES: Record<PathwayRole, string> = {
  learn: PATHWAY_META.learn.route,
  earn: PATHWAY_META.earn.route,
  teach: PATHWAY_META.teach.route,
  partner: PATHWAY_META.partner.route,
  own: PATHWAY_META.own.route,
}

/**
 * Config-driven tile registry. A tile is `status: 'live'` ONLY when a real page
 * or data source already exists in this repo; everything else renders the
 * shared "coming online" stub state. No Firestore collections are implied here.
 */
export const PATHWAY_DASHBOARDS: Record<PathwayRole, PathwayDashboard> = {
  learn: {
    pathwayRole: 'learn',
    heading: 'Your housing',
    subheading: 'Residency workspace for occupancy requests, leases, and subsidy status.',
    tiles: [
      {
        id: 'occupancy-request',
        title: 'Submit occupancy request',
        description: 'Start a request for a free or cost-based unit in a BEAM building.',
        icon: 'file-plus',
        status: 'stub',
        primary: true,
      },
      {
        id: 'application-status',
        title: 'Housing application status',
        description: 'Track where your occupancy request sits in review.',
        icon: 'clipboard-list',
        status: 'stub',
      },
      {
        id: 'lease-agreements',
        title: 'Lease & occupancy agreements',
        description: 'Review and sign the agreements tied to your residency.',
        icon: 'file-text',
        status: 'stub',
      },
      {
        id: 'rent-ledger',
        title: 'Rent ledger & subsidy status',
        description: 'See what is owed, what is subsidized, and how the tier is applied.',
        icon: 'receipt',
        status: 'stub',
      },
      {
        id: 'resident-guidelines',
        title: 'Resident guidelines',
        description: 'House standards, participation expectations, and community norms.',
        icon: 'book-open',
        status: 'stub',
      },
    ],
  },
  earn: {
    pathwayRole: 'earn',
    heading: 'Your cohort',
    subheading: 'Build-and-earn workspace for shifts, sweat-equity, and portfolio credit.',
    tiles: [
      {
        id: 'clock-in',
        title: 'Clock into cohort shift',
        description: 'Start or end a shift on an active acquisition or renovation.',
        icon: 'timer',
        status: 'stub',
        primary: true,
      },
      {
        id: 'assignments',
        title: 'Active cohort assignments',
        description: 'Your current property-ops assignments and crew.',
        icon: 'list-checks',
        status: 'stub',
      },
      {
        id: 'sweat-ledger',
        title: 'Sweat-equity ledger',
        description: 'Hours logged and how they convert to wages and housing credit.',
        icon: 'hammer',
        status: 'stub',
      },
      {
        id: 'portfolio-credit',
        title: 'Portfolio credit tracker',
        description: 'Credit, skills, and portfolio artifacts earned across projects.',
        icon: 'graduation-cap',
        status: 'stub',
      },
      {
        id: 'property-specs',
        title: 'View property specs',
        description: 'Open the live acquisition map and site specs for your projects.',
        icon: 'map-pinned',
        href: '/portal/properties',
        status: 'live',
      },
    ],
  },
  teach: {
    pathwayRole: 'teach',
    heading: 'Your projects',
    subheading: 'Leadership workspace for cohort oversight, sign-offs, and curriculum.',
    tiles: [
      {
        id: 'approve-hours',
        title: 'Approve cohort hours',
        description: 'Review and approve logged hours for the crews you lead.',
        icon: 'check-circle',
        status: 'stub',
        primary: true,
      },
      {
        id: 'cohort-roster',
        title: 'Cohort roster',
        description: 'Members, roles, and assignments across your active cohorts.',
        icon: 'users',
        status: 'stub',
      },
      {
        id: 'drawing-signoffs',
        title: 'Drawing sign-offs & stamped uploads',
        description: 'Upload stamped drawings and record professional sign-offs.',
        icon: 'pen-tool',
        status: 'stub',
      },
      {
        id: 'curriculum-guides',
        title: 'Curriculum guides',
        description: 'Teaching materials and competency guides for cohorts.',
        icon: 'book-open',
        status: 'stub',
      },
      {
        id: 'partner-reporting',
        title: 'Partner reporting',
        description: 'Progress reports back to partners and the Foundation.',
        icon: 'bar-chart',
        status: 'stub',
      },
    ],
  },
  partner: {
    pathwayRole: 'partner',
    heading: 'Your pipeline',
    subheading: 'Co-development workspace for adaptive reuse, agreements, and impact.',
    tiles: [
      {
        id: 'adaptive-reuse-pipeline',
        title: 'Adaptive reuse pipeline',
        description: 'Open the live acquisition site views for co-developed buildings.',
        icon: 'workflow',
        href: '/portal/properties',
        status: 'live',
        primary: true,
      },
      {
        id: 'operating-agreements',
        title: 'Operating agreements',
        description: 'BEAM-as-operator agreements tied to your buildings.',
        icon: 'file-text',
        status: 'stub',
      },
      {
        id: 'asset-assessment',
        title: 'Asset assessment',
        description: 'Condition, capacity, and readiness assessments for your sites.',
        icon: 'clipboard-list',
        status: 'stub',
      },
      {
        id: 'impact-metrics',
        title: 'Impact metrics',
        description: 'Wages funded, units delivered, and community outcomes.',
        icon: 'bar-chart',
        status: 'stub',
      },
    ],
  },
  own: {
    pathwayRole: 'own',
    heading: 'Your trust',
    subheading: 'Ownership workspace for governance, membership, and equity.',
    tiles: [
      {
        id: 'governance-voting',
        title: 'Land trust governance & voting',
        description: 'Active measures, proposals, and member voting.',
        icon: 'vote',
        status: 'stub',
        primary: true,
      },
      {
        id: 'membership-status',
        title: 'Membership status',
        description: 'Your standing and rights in the community land trust.',
        icon: 'badge-check',
        status: 'stub',
      },
      {
        id: 'equity-dividends',
        title: 'Equity & dividend tracking',
        description: 'Your trust equity position and any dividend distributions.',
        icon: 'coins',
        status: 'stub',
      },
      {
        id: 'cooperative-bylaws',
        title: 'Cooperative bylaws',
        description: 'The bylaws that keep buildings permanently community-held.',
        icon: 'scroll',
        status: 'stub',
      },
    ],
  },
}

export function getPathwayDashboard(pathwayRole: PathwayRole): PathwayDashboard {
  return PATHWAY_DASHBOARDS[pathwayRole]
}
