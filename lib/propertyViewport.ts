// Property viewport model.
//
// The landing page treats a single property as a "viewport" — one card that
// shows everything a visitor needs to understand a site at a glance. Properties
// can be seeded from an external source (e.g. Ready Aim Go) or generated
// internally by Grounds. Later, the viewer will be able to cycle between
// prioritized properties, so the data is modeled as an ordered list.

export type PropertySource = 'external' | 'internal'

export interface PropertyContributor {
  /** Full name, used to derive initials for the stacked avatars. */
  name: string
  role?: string
}

export interface PropertyNGORelation {
  name: string
  href?: string
}

export interface PropertyEarnTrack {
  /** Potential area to earn (the kind of work available). */
  area: string
  /** Which cohort of participants is needed. */
  cohort: string
  /** How often the work happens. */
  frequency: string
  /** Expected time commitment. */
  commitment: string
}

export interface PropertyViewport {
  id: string
  name: string
  address: string
  detailHref?: string

  /** Where this property came from. External = seeded by a partner feed. */
  source: PropertySource
  /** Human label for the source, e.g. "Ready Aim Go". */
  sourceLabel: string
  sourceHref?: string

  /** Short stage/priority label, e.g. "Signal · Priority site". */
  status: string
  /** Small category eyebrow, mirrors the reference card's category line. */
  category: string
  /** Small secondary metadata line, mirrors the reference card's date line. */
  dateLabel: string

  /** One-sentence summary of the opportunity. */
  subtitle: string

  /** People who have worked on the project — drives the status/collaborator chip. */
  contributors: PropertyContributor[]
  contributorsHref?: string

  /** Concise potential uses for the building. */
  potentialUses: string[]
  /** Where a visitor can submit a new idea for the building. */
  suggestHref?: string

  /** Other NGOs / trusts involved or in relation to this site. */
  ngoRelations: PropertyNGORelation[]

  /** Ways to earn, the cohort needed, and the cadence/commitment. */
  earnTracks: PropertyEarnTrack[]

  /**
   * Optional 3D model (glTF/GLB). When set, the card renders an interactive,
   * auto-rotating <model-viewer> the visitor can spin and zoom. Falls back to
   * `imageUrl`, then to a gradient, when absent or it fails to load.
   */
  modelUrl?: string

  /**
   * Background visual used when there is no 3D model. A gradient fallback
   * renders if the image itself fails to load.
   */
  imageUrl?: string
}

export const propertyViewports: PropertyViewport[] = [
  {
    id: 'central-united-methodist-church',
    name: 'Central United Methodist Church',
    address: '639 N 25th St · Milwaukee, WI',
    detailHref: '/properties/central-united-methodist-church',
    source: 'external',
    sourceLabel: 'Ready Aim Go',
    sourceHref: '#',
    status: 'Signal · Priority site',
    category: 'Civic Anchor · Milwaukee',
    dateLabel: 'Seeded Jun 2026',
    subtitle:
      'A historic sanctuary being evaluated as a shared civic anchor — housing, workforce training, and neighborhood services under one roof.',
    contributors: [
      { name: 'Andre Ellis', role: 'Lead' },
      { name: 'Maya Okafor', role: 'Architecture' },
      { name: 'Devon Park', role: 'Finance' },
      { name: 'Lucia Romero', role: 'Community' },
      { name: 'Sam Whitfield', role: 'Trades' },
      { name: 'Priya Nair', role: 'Operations' },
      { name: 'Theo Brandt', role: 'Civic' },
      { name: 'Nia Coleman', role: 'Resident' },
      { name: 'Jonas Reed', role: 'Trust' },
      { name: 'Hana Suzuki', role: 'Research' },
      { name: 'Marcus Lee', role: 'Trades' },
      { name: ' Imani Diallo', role: 'Outreach' },
    ],
    contributorsHref: '#',
    potentialUses: [
      'Affordable housing',
      'Trade-skills workshop',
      'Community kitchen',
      'Performance hall',
    ],
    suggestHref: '#',
    ngoRelations: [
      { name: 'BEAM Trust', href: '#' },
      { name: 'Milwaukee Community Land Trust', href: '#' },
    ],
    earnTracks: [
      {
        area: 'Adaptive reuse renovation',
        cohort: 'Architecture & trades students',
        frequency: '2 build sprints / week',
        commitment: '6–10 hrs / week',
      },
      {
        area: 'Site operations & activation',
        cohort: 'Resident operators',
        frequency: 'Weekly',
        commitment: '4 hrs / week',
      },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1600&q=80',
  },
]
