import { NextResponse } from 'next/server'
import {
  getCity,
  type PipelineField,
  type PipelineProject,
  type CivicSourceType,
} from '@/lib/cities'

export const runtime = 'nodejs'

const PIPELINE_FIELD_CANDIDATES: Record<PipelineField, string[]> = {
  sourceId: ['permit_num', 'permit_id', 'permit_number', 'id', 'objectid', '_id', 'record_id', 'project_id'],
  projectName: ['permit_type', 'work_description', 'project_name', 'description', 'title', 'job_description', 'permit_subtype'],
  address: ['geo_address', 'address', 'street_address', 'full_address', 'location', 'site_address', 'situs_address'],
  parcelId: ['taxkey', 'parcel_id', 'pin', 'parcel', 'parcel_num'],
  status: ['status', 'permit_status', 'current_status', 'stage', 'phase', 'review_status'],
  estimatedTimeline: ['issue_date', 'issue_dttm', 'estimated_completion', 'permit_issue_date', 'application_date', 'date'],
  tradeScope: ['work_description', 'work_type', 'trade', 'category', 'scope', 'permit_type'],
  estimatedCost: ['estimated_cost', 'val_est', 'declared_valuation', 'total_cost', 'job_value', 'cost'],
  applicantName: ['applicant_name', 'contractor_name', 'owner_name_1', 'owner', 'applicant', 'contact_name'],
}

type PipelineFieldMap = Partial<Record<PipelineField, string>>

function pickPipelineField(
  raw: Record<string, unknown>,
  field: PipelineField,
  fieldMap?: PipelineFieldMap
): string {
  const lower: Record<string, unknown> = {}
  for (const key of Object.keys(raw)) lower[key.toLowerCase()] = raw[key]

  const mapped = fieldMap?.[field]
  const keys = mapped ? [mapped.toLowerCase(), ...PIPELINE_FIELD_CANDIDATES[field]] : PIPELINE_FIELD_CANDIDATES[field]

  for (const key of keys) {
    const value = lower[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function normalizePipelineProject(
  raw: Record<string, unknown>,
  cityId: string,
  cityName: string,
  fieldMap: PipelineFieldMap | undefined,
  index: number
): PipelineProject {
  const sourceId = pickPipelineField(raw, 'sourceId', fieldMap) || `perm-${cityId}-${index + 1}`
  const rawCost = pickPipelineField(raw, 'estimatedCost', fieldMap)
  const formattedCost = rawCost
    ? isNaN(Number(rawCost))
      ? rawCost
      : `$${Number(rawCost).toLocaleString()}`
    : undefined

  return {
    sourceId,
    projectName: pickPipelineField(raw, 'projectName', fieldMap) || 'Municipal CIP / Permit Project',
    address: pickPipelineField(raw, 'address', fieldMap) || 'Citywide Target Parcel',
    parcelId: pickPipelineField(raw, 'parcelId', fieldMap) || '',
    status: pickPipelineField(raw, 'status', fieldMap) || 'Under Plan Review',
    estimatedTimeline: pickPipelineField(raw, 'estimatedTimeline', fieldMap) || 'Q3 2026 Target Start',
    tradeScope: pickPipelineField(raw, 'tradeScope', fieldMap) || 'Adaptive Reuse / Building Rehabilitation',
    estimatedCost: formattedCost,
    applicantName: pickPipelineField(raw, 'applicantName', fieldMap) || undefined,
    cityId,
    cityName,
    isPipeline: true,
  }
}

async function fetchCkanPipeline(base: string, resourceId: string, q: string, limit: number) {
  const url = new URL(`${base.replace(/\/$/, '')}/api/3/action/datastore_search`)
  url.searchParams.set('resource_id', resourceId)
  url.searchParams.set('limit', String(limit))
  if (q) url.searchParams.set('q', q)

  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`CKAN pipeline request failed (${response.status})`)
  const json = (await response.json()) as { result?: { records?: Record<string, unknown>[] } }
  return json.result?.records ?? []
}

async function fetchSocrataPipeline(base: string, datasetId: string, q: string, limit: number, appToken?: string) {
  const url = new URL(`${base.replace(/\/$/, '')}/resource/${datasetId}.json`)
  url.searchParams.set('$limit', String(limit))
  if (q) url.searchParams.set('$q', q)

  const response = await fetch(url, {
    headers: appToken ? { accept: 'application/json', 'X-App-Token': appToken } : { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Socrata pipeline request failed (${response.status})`)
  return (await response.json()) as Record<string, unknown>[]
}

// Built-in fallback sample pipeline projects for registered nodes when live API keys are pending
const SAMPLE_PIPELINE_DATA: Record<string, Partial<PipelineProject>[]> = {
  'milwaukee-wi': [
    {
      sourceId: 'MKE-PERM-2026-081',
      projectName: 'Near West Side Commercial Re-Development',
      address: '2430 W Kilbourn Ave, Milwaukee, WI',
      parcelId: '388-1204-000',
      status: 'Approved — Plan Review Complete',
      estimatedTimeline: 'Q3 2026 Start',
      tradeScope: 'Mixed-Use Commercial Rehab & Solar Microgrid Installation',
      estimatedCost: '$450,000',
      applicantName: 'BEAM Civic Infrastructure LLC',
    },
    {
      sourceId: 'MKE-CIP-2026-104',
      projectName: 'Bronzeville Heritage Corridor Public Plaza',
      address: '1918 N Martin Luther King Jr Dr, Milwaukee, WI',
      parcelId: '353-0912-110',
      status: 'In Design & Community Scoping',
      estimatedTimeline: 'Q4 2026 Procurement',
      tradeScope: 'Civic Plaza, Public Acoustic Stage & Stormwater Retention',
      estimatedCost: '$820,000',
      applicantName: 'City of Milwaukee DPW / BEAM Land Trust',
    },
  ],
  'orlando-fl': [
    {
      sourceId: 'ORL-PERM-2026-442',
      projectName: 'Parramore Community Workforce Innovation Hub',
      address: '614 W Church St, Orlando, FL',
      parcelId: '26-22-29-5100-01-040',
      status: 'Permit Application Submitted',
      estimatedTimeline: 'Q4 2026 Break Ground',
      tradeScope: 'Structural Retrofit, HVAC Modernization, Digital Craft Workshop',
      estimatedCost: '$620,000',
      applicantName: 'Orlando Housing Authority & Community Partners',
    },
  ],
  'chicago-il': [
    {
      sourceId: 'CHI-PERM-2026-991',
      projectName: 'South Shore Transit-Oriented Homestead Hub',
      address: '7130 S Jeffrey Blvd, Chicago, IL',
      parcelId: '20-24-315-012-0000',
      status: 'Zoning Board Approval Granted',
      estimatedTimeline: 'Q3 2026 Construction Phase 1',
      tradeScope: 'Exterior Masonry Repair, Plumbing Upgrade, Solar Roofing',
      estimatedCost: '$1,100,000',
      applicantName: 'Chicago Department of Planning & Development',
    },
  ],
  'atlanta-ga': [
    {
      sourceId: 'ATL-CIP-2026-302',
      projectName: 'Auburn Avenue Historic Resilience Center',
      address: '450 Auburn Ave NE, Atlanta, GA',
      parcelId: '14-0052-0004-019',
      status: 'Environmental Review Active',
      estimatedTimeline: 'Q1 2027 Activation',
      tradeScope: 'Historic Façade Preservation & Community Kitchen Installation',
      estimatedCost: '$750,000',
      applicantName: 'Fulton County Development Authority',
    },
  ],
  'zellwood-fl': [
    {
      sourceId: 'ZLW-PERM-2026-118',
      projectName: 'Zellwood Agricultural Enterprise & Solar Canopy',
      address: '3105 Laughlin Rd, Zellwood, FL',
      parcelId: '28-20-17-0000-00-015',
      status: 'County Site Plan Approved',
      estimatedTimeline: 'Q4 2026 Site Prep',
      tradeScope: 'Agri-Tech Infrastructure, Solar Array & Cold Storage Facility',
      estimatedCost: '$530,000',
      applicantName: 'Orange County FL Agricultural Extension',
    },
  ],
}

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => null)) ?? {}) as {
    cityId?: string
    q?: string
    limit?: number
  }

  const cityId = body.cityId ?? 'milwaukee-wi'
  const q = (body.q ?? '').trim().toLowerCase()
  const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100)

  const city = getCity(cityId)
  if (!city) {
    return NextResponse.json({ error: `Unknown city: ${cityId}` }, { status: 400 })
  }

  const ps = city.pipelineSource
  if (!ps || ps.type === 'none') {
    return NextResponse.json({
      city: cityId,
      cityLabel: city.label,
      count: 0,
      projects: [],
      hasPipelineSource: false,
      message: `No active pipeline source configured for ${city.label}.`,
    })
  }

  const resourceId = ps.resourceId ?? (ps.resourceEnv ? process.env[ps.resourceEnv] : undefined)

  // If live dataset id is provided, attempt live fetch from CKAN or Socrata
  if (resourceId && ps.baseUrl) {
    try {
      const raw =
        ps.type === 'ckan'
          ? await fetchCkanPipeline(ps.baseUrl, resourceId, q, limit)
          : await fetchSocrataPipeline(
              ps.baseUrl,
              resourceId,
              q,
              limit,
              ps.appTokenEnv ? process.env[ps.appTokenEnv] : undefined
            )

      let projects = raw.map((item, index) =>
        normalizePipelineProject(item, city.id, city.label, ps.fieldMap as PipelineFieldMap, index)
      )

      if (q) {
        projects = projects.filter(
          (p) =>
            p.projectName.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q) ||
            p.tradeScope.toLowerCase().includes(q) ||
            p.status.toLowerCase().includes(q)
        )
      }

      return NextResponse.json({
        city: city.id,
        cityLabel: city.label,
        count: projects.length,
        hasPipelineSource: true,
        isLive: true,
        projects,
      })
    } catch (err) {
      console.warn(`[Pipeline API] Live fetch failed for ${city.id}, falling back to curated records:`, err)
    }
  }

  // Curated pipeline fallback records for configured cities
  const rawSamples = SAMPLE_PIPELINE_DATA[city.id] ?? [
    {
      sourceId: `PERM-${city.id.toUpperCase()}-001`,
      projectName: `${city.label} Adaptive Infrastructure Corridor`,
      address: `100 Main St, ${city.label}, ${city.state}`,
      parcelId: 'GEN-PARCEL-001',
      status: 'Municipal Plan Review',
      estimatedTimeline: 'Q4 2026 Target',
      tradeScope: 'Building Renovation, Energy Upgrade & Public Accessibility',
      estimatedCost: '$350,000',
      applicantName: `${city.label} Civic Works`,
    },
  ]

  let projects: PipelineProject[] = rawSamples.map((s) => ({
    sourceId: s.sourceId || `PERM-${city.id.toUpperCase()}-001`,
    projectName: s.projectName || 'Future Civic Development Project',
    address: s.address || `Central Ave, ${city.label}`,
    parcelId: s.parcelId || '',
    status: s.status || 'Under Review',
    estimatedTimeline: s.estimatedTimeline || 'Q4 2026',
    tradeScope: s.tradeScope || 'Adaptive Reuse',
    estimatedCost: s.estimatedCost || '$400,000',
    applicantName: s.applicantName || 'Civic Infrastructure Authority',
    cityId: city.id,
    cityName: city.label,
    isPipeline: true,
  }))

  if (q) {
    projects = projects.filter(
      (p) =>
        p.projectName.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.tradeScope.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({
    city: city.id,
    cityLabel: city.label,
    count: projects.length,
    hasPipelineSource: true,
    isLive: false,
    projects,
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get('cityId') || 'milwaukee-wi'
  const q = searchParams.get('q') || ''
  const limit = Number(searchParams.get('limit')) || 25

  return POST(
    new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cityId, q, limit }),
    })
  )
}
