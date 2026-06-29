'use client'

import { useMemo, useState } from 'react'
import { PropertyGalleryFilters } from '@/components/PropertyGalleryFilters'
import { PropertyTeaserCard } from '@/components/PropertyTeaserCard'
import { usePublicAcquisitionSites, type BeamAsset } from '@/lib/useAcquisitionSites'

const emptyScores = { capacity: 0, impact: 0, stability: 0, revenue: 0, partner: 0 }

// Static fallback so the page is never blank for anonymous visitors or before
// any public beamAssets exist. Live Firestore data takes precedence when present.
const SEED_PROPERTIES: BeamAsset[] = [
  {
    id: 'seed-cumc',
    name: 'Central United Methodist Church',
    publicTitle: 'Central United Methodist Church',
    publicSummary:
      'A historic sanctuary being evaluated as a shared civic anchor — housing, workforce training, and neighborhood services under one roof.',
    address: '',
    regionId: 'Milwaukee',
    publicVisible: true,
    ownerName: 'United Methodist Church of Wisconsin',
    acquisitionStage: 'SIGNAL',
    condition: 'unknown',
    operatorNarrative: '',
    locationType: 'civic-anchor',
    stewardshipStatus: 'observed',
    primaryUseCases: ['Affordable housing', 'Trade-skills workshop', 'Community kitchen', 'Performance hall'],
    ngoLinks: [
      {
        ngoId: 'architecture',
        ngoName: 'BEAM Architecture',
        ngoSubdomain: 'architecture.beamthinktank.space',
        relationshipType: 'cohort-project',
        linkedAt: '2026-06-01T00:00:00Z',
      },
      {
        ngoId: 'forge',
        ngoName: 'BEAM Forge',
        ngoSubdomain: 'forge.beamthinktank.space',
        relationshipType: 'cohort-project',
        linkedAt: '2026-06-01T00:00:00Z',
      },
      {
        ngoId: 'law',
        ngoName: 'BEAM Law',
        ngoSubdomain: 'law.beamthinktank.space',
        relationshipType: 'service-site',
        linkedAt: '2026-06-01T00:00:00Z',
      },
      {
        ngoId: 'choir',
        ngoName: 'BEAM Choir',
        ngoSubdomain: 'choir.beamthinktank.space',
        relationshipType: 'anchor-site',
        linkedAt: '2026-06-01T00:00:00Z',
      },
    ],
    cohortPool: 'acquisition',
    tenants: [
      {
        name: 'Central United Methodist Church',
        category: 'religious',
        status: 'current',
        websiteUrl: 'https://centralumcmilwaukee.org',
        notes: '',
      },
      {
        name: 'Momdani Campaign Office',
        category: 'political',
        status: 'current',
        websiteUrl: '',
        notes: 'Occupying portion of building during campaign season',
      },
    ],
    ckanOwnerName: 'United Methodist Church of Wisconsin',
    ckanZoning: 'RT4',
    ckanTaxStatus: 'exempt',
    ckanAssessedValue: 0,
    heroImageUrl:
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1200&q=80',
    scores: emptyScores,
    stageHistory: [],
    linkedProjectIds: [],
    linkedActionIds: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'seed-mpm',
    name: 'Former Milwaukee Public Museum',
    publicTitle: 'Former Milwaukee Public Museum',
    publicSummary:
      '417,000 sq ft civic institution closing January 2027. Milwaukee County RFP expected mid-2026. BEAM is positioning for a joint adaptive reuse submission with UWM and MATC.',
    address: '',
    regionId: 'Milwaukee',
    publicVisible: true,
    ownerName: 'Milwaukee County',
    acquisitionStage: 'CLAIM',
    condition: 'unknown',
    operatorNarrative: '',
    locationType: 'civic-anchor',
    stewardshipStatus: 'unmonitored',
    primaryUseCases: ['24-hr research library', 'Fabrication lab', 'Performance venue', 'Affordable housing'],
    ngoLinks: [
      {
        ngoId: 'grounds',
        ngoName: 'BEAM Grounds',
        ngoSubdomain: 'grounds.beamthinktank.space',
        relationshipType: 'anchor-site',
        linkedAt: '2026-06-01T00:00:00Z',
      },
      {
        ngoId: 'architecture',
        ngoName: 'BEAM Architecture',
        ngoSubdomain: 'architecture.beamthinktank.space',
        relationshipType: 'cohort-project',
        linkedAt: '2026-06-01T00:00:00Z',
      },
      {
        ngoId: 'finance',
        ngoName: 'BEAM Finance',
        ngoSubdomain: 'finance.beamthinktank.space',
        relationshipType: 'service-site',
        linkedAt: '2026-06-01T00:00:00Z',
      },
    ],
    cohortPool: 'acquisition',
    tenants: [
      {
        name: 'Milwaukee Public Museum',
        category: 'educational',
        status: 'current',
        websiteUrl: 'https://mpm.edu',
        notes: 'Relocating to new facility. Building vacates January 3 2027.',
      },
    ],
    ckanOwnerName: 'Milwaukee County',
    ckanZoning: 'C9A',
    ckanTaxStatus: 'exempt',
    ckanAssessedValue: 0,
    heroImageUrl:
      'https://images.unsplash.com/photo-1565060169187-5284a3f7af8e?auto=format&fit=crop&w=1200&q=80',
    scores: emptyScores,
    stageHistory: [],
    linkedProjectIds: [],
    linkedActionIds: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'seed-mpl',
    name: 'Milwaukee Public Library — Central Branch Model',
    publicTitle: 'Milwaukee Public Library — Central Branch Model',
    publicSummary:
      "MPL's bond-financed civic anchor precedent: library and affordable housing in a single mixed-use structure. The financing model BEAM is replicating across acquisition targets.",
    address: '',
    regionId: 'Milwaukee',
    publicVisible: true,
    ownerName: 'City of Milwaukee',
    acquisitionStage: 'ACTIVATE',
    condition: 'unknown',
    operatorNarrative: '',
    locationType: 'civic-anchor',
    stewardshipStatus: 'activated',
    primaryUseCases: ['Library branch', 'Affordable housing', 'Community meeting space'],
    ngoLinks: [
      {
        ngoId: 'finance',
        ngoName: 'BEAM Finance',
        ngoSubdomain: 'finance.beamthinktank.space',
        relationshipType: 'service-site',
        linkedAt: '2026-06-01T00:00:00Z',
      },
      {
        ngoId: 'grounds',
        ngoName: 'BEAM Grounds',
        ngoSubdomain: 'grounds.beamthinktank.space',
        relationshipType: 'anchor-site',
        linkedAt: '2026-06-01T00:00:00Z',
      },
    ],
    cohortPool: 'financing',
    tenants: [
      {
        name: 'Milwaukee Public Library',
        category: 'civic',
        status: 'current',
        websiteUrl: 'https://mpl.org',
        notes: 'Bond-financed mixed-use completed. Model for BEAM replication.',
      },
    ],
    ckanOwnerName: 'City of Milwaukee',
    ckanZoning: 'C9A',
    ckanTaxStatus: 'exempt',
    ckanAssessedValue: 0,
    heroImageUrl:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
    scores: emptyScores,
    stageHistory: [],
    linkedProjectIds: [],
    linkedActionIds: [],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
]

export default function PropertiesPage() {
  const { sites: liveProperties, loading } = usePublicAcquisitionSites()
  const [activeNode, setActiveNode] = useState('all')
  const [activeClass, setActiveClass] = useState('all')

  // Live data wins; otherwise fall back to seed so the page is never blank.
  const displayProperties = liveProperties.length > 0 ? liveProperties : SEED_PROPERTIES

  const nodes = useMemo(
    () => Array.from(new Set(displayProperties.map((site) => site.regionId).filter(Boolean))),
    [displayProperties],
  )
  const classes = useMemo(
    () => Array.from(new Set(displayProperties.map((site) => site.locationType || 'civic-anchor'))),
    [displayProperties],
  )

  const filtered = useMemo(
    () =>
      displayProperties.filter((site) => {
        const nodeOk = activeNode === 'all' || site.regionId === activeNode
        const classOk = activeClass === 'all' || (site.locationType || 'civic-anchor') === activeClass
        return nodeOk && classOk
      }),
    [displayProperties, activeNode, activeClass],
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <PropertyGalleryFilters
        nodes={nodes}
        classes={classes}
        activeNode={activeNode}
        activeClass={activeClass}
        onNodeChange={setActiveNode}
        onClassChange={setActiveClass}
      />

      {loading && liveProperties.length === 0 ? (
        <div className="mt-4 flex min-h-72 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.03] font-dm text-sm text-white/55">
          Loading sites…
        </div>
      ) : filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          {filtered.map((site) => (
            <PropertyTeaserCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-dashed border-white/14 bg-white/[0.03] p-8 font-dm text-sm leading-7 text-white/60">
          No public sites match these filters yet.
        </div>
      )}
    </div>
  )
}
