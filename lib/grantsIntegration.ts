export interface GroundsGrantSyncPayload {
  id: string
  programName: string
  agency: string
  grantType: string
  allocatedAmount: number
  hourlyStipendMatch?: number
  description: string
  targetSubjectId?: string
}

const DEFAULT_BEAM_HOME_URL = process.env.NEXT_PUBLIC_BEAM_HOME_URL || 'https://beamthinktank.space'

function getHomeApiUrl(path: string) {
  const base = DEFAULT_BEAM_HOME_URL.replace(/\/+$/, '')
  return `${base}${path}`
}

export async function fetchCentralGrantsCatalog() {
  try {
    const url = getHomeApiUrl('/api/admin/grants/sync')
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('[BEAM Grounds] Failed to fetch central admin grants catalog:', err)
    return null
  }
}

export async function syncGroundsGrantToAdmin(grant: GroundsGrantSyncPayload) {
  try {
    const url = getHomeApiUrl('/api/admin/grants/sync')
    const opportunityPayload = {
      id: `grant-${grant.id}`,
      externalSource: 'manual' as const,
      sourceId: grant.id,
      opportunityNumber: grant.id.toUpperCase(),
      title: grant.programName,
      agencyCode: grant.agency.split(' ')[0] || 'GROUNDS',
      agencyName: grant.agency,
      description: grant.description,
      applicantTypes: ['Public Land Trust', 'Community Redevelopment Entity'],
      fundingCategories: ['Redevelopment', 'Workforce Development'],
      awardFloor: 10000,
      awardCeiling: grant.allocatedAmount,
      estimatedFunding: grant.allocatedAmount,
      costSharing: false,
      postedDate: new Date().toISOString().slice(0, 10),
      closeDate: 'Rolling Intake',
      sourceUrl: 'https://grounds.beamthinktank.space',
      opportunityContextSources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasActivePursuit: true,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_opportunity',
        opportunity: opportunityPayload,
      }),
    })

    if (!res.ok) throw new Error(`Sync failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn('[BEAM Grounds] Failed to sync grant to admin:', err)
    return null
  }
}
