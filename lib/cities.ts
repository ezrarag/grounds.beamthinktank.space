// Multi-city registry. Each city carries a civic open-data source config used by
// the /api/civic scan endpoint. Add a city by appending to CITIES — the admin
// city pickers and /properties filters read from this list automatically.

export type CivicSourceType = 'ckan' | 'socrata' | 'none'

/** Normalized property fields we try to extract from a civic record. */
export type CivicField =
  | 'sourceId'
  | 'name'
  | 'address'
  | 'ownerName'
  | 'zoning'
  | 'taxStatus'
  | 'parcelId'
  | 'assessedValue'

/** Normalized fields extracted from future development / permit / CIP records. */
export type PipelineField =
  | 'sourceId'
  | 'projectName'
  | 'address'
  | 'parcelId'
  | 'status'
  | 'estimatedTimeline'
  | 'tradeScope'
  | 'estimatedCost'
  | 'applicantName'

export interface CivicDataSource {
  type: CivicSourceType
  /** Portal base URL, e.g. https://data.milwaukee.gov (CKAN) or a Socrata domain. */
  baseUrl?: string
  /**
   * Inline dataset/resource id. Used by admin-managed (Firestore) cities, where
   * the id is entered in the UI rather than kept in env. Public, not secret.
   */
  resourceId?: string
  /**
   * Server-side env var holding the dataset/resource id — used by the built-in
   * cities so committed code carries no real ids.
   */
  resourceEnv?: string
  /** Server-side env var holding an app token (Socrata) if required. */
  appTokenEnv?: string
  /** Optional explicit mapping from a normalized field to the raw record key. */
  fieldMap?: Partial<Record<CivicField | PipelineField, string>>
}

export interface CityConfig {
  /** Stored as beamAsset.regionId. */
  id: string
  label: string
  state: string
  dataSource: CivicDataSource
  /** Secondary data source for capital improvement projects (CIP) / future permits. */
  pipelineSource?: CivicDataSource
}

/** A civic record normalized by /api/civic from a city's open dataset. */
export interface CivicRecord {
  sourceId: string
  name: string
  address: string
  ownerName: string
  zoning: string
  taxStatus: string
  parcelId: string
  assessedValue: string
}

/** Normalized future development / permit / CIP record. */
export interface PipelineProject {
  sourceId: string
  projectName: string
  address: string
  parcelId: string
  status: string
  estimatedTimeline: string
  tradeScope: string
  estimatedCost?: string
  applicantName?: string
  cityId: string
  cityName: string
  isPipeline: true
}

export const CITIES: CityConfig[] = [
  {
    id: 'milwaukee-wi',
    label: 'Milwaukee',
    state: 'WI',
    dataSource: {
      type: 'ckan',
      baseUrl: 'https://data.milwaukee.gov',
      resourceEnv: 'CIVIC_MILWAUKEE_RESOURCE_ID',
      fieldMap: {
        name: 'OWNER_NAME_1',
        address: 'GEO_ADDRESS',
        ownerName: 'OWNER_NAME_1',
        zoning: 'ZONING',
        taxStatus: 'TAX_RATE_CD',
        parcelId: 'TAXKEY',
        assessedValue: 'C_A_TOTAL',
      },
    },
    pipelineSource: {
      type: 'ckan',
      baseUrl: 'https://data.milwaukee.gov',
      resourceEnv: 'CIVIC_MILWAUKEE_PIPELINE_RESOURCE_ID',
      fieldMap: {
        projectName: 'PERMIT_TYPE',
        address: 'GEO_ADDRESS',
        status: 'STATUS',
        estimatedTimeline: 'ISSUE_DATE',
        tradeScope: 'WORK_DESCRIPTION',
        estimatedCost: 'ESTIMATED_COST',
      },
    },
  },
  {
    id: 'orlando-fl',
    label: 'Orlando',
    state: 'FL',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.cityoforlando.net',
      resourceEnv: 'CIVIC_ORLANDO_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
    pipelineSource: {
      type: 'socrata',
      baseUrl: 'https://data.cityoforlando.net',
      resourceEnv: 'CIVIC_ORLANDO_PIPELINE_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
  {
    id: 'chicago-il',
    label: 'Chicago',
    state: 'IL',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.cityofchicago.org',
      resourceEnv: 'CIVIC_CHICAGO_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
    pipelineSource: {
      type: 'socrata',
      baseUrl: 'https://data.cityofchicago.org',
      resourceEnv: 'CIVIC_CHICAGO_PIPELINE_RESOURCE_ID',
      resourceId: 'ydr8-5enu',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
  {
    id: 'atlanta-ga',
    label: 'Atlanta (Fulton County)',
    state: 'GA',
    dataSource: {
      type: 'none',
    },
    pipelineSource: {
      type: 'socrata',
      baseUrl: 'https://data.atlantaga.gov',
      resourceEnv: 'CIVIC_ATLANTA_PIPELINE_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
  {
    id: 'zellwood-fl',
    label: 'Zellwood (Orange County)',
    state: 'FL',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.ocfl.net',
      resourceEnv: 'CIVIC_ZELLWOOD_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
    pipelineSource: {
      type: 'socrata',
      baseUrl: 'https://data.ocfl.net',
      resourceEnv: 'CIVIC_ZELLWOOD_PIPELINE_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
  {
    id: 'new-york-ny',
    label: 'New York',
    state: 'NY',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.cityofnewyork.us',
      resourceEnv: 'CIVIC_NEW_YORK_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
  {
    id: 'los-angeles-ca',
    label: 'Los Angeles',
    state: 'CA',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.lacity.org',
      resourceEnv: 'CIVIC_LOS_ANGELES_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
  {
    id: 'san-francisco-ca',
    label: 'San Francisco',
    state: 'CA',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.sfgov.org',
      resourceEnv: 'CIVIC_SAN_FRANCISCO_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
  {
    id: 'seattle-wa',
    label: 'Seattle',
    state: 'WA',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.seattle.gov',
      resourceEnv: 'CIVIC_SEATTLE_RESOURCE_ID',
      appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN',
    },
  },
]

/** Shape of an admin-managed city stored in the Firestore `cities` collection. */
export interface StoredCity {
  label: string
  state: string
  type: CivicSourceType
  baseUrl?: string
  resourceId?: string
  fieldMap?: Partial<Record<CivicField, string>>
  pipelineType?: CivicSourceType
  pipelineBaseUrl?: string
  pipelineResourceId?: string
  pipelineFieldMap?: Partial<Record<PipelineField, string>>
}

/** Convert a Firestore city doc into a runtime CityConfig. */
export function storedCityToConfig(id: string, doc: StoredCity): CityConfig {
  return {
    id,
    label: doc.label,
    state: doc.state,
    dataSource: {
      type: doc.type,
      baseUrl: doc.baseUrl,
      resourceId: doc.resourceId,
      fieldMap: doc.fieldMap,
      appTokenEnv: doc.type === 'socrata' ? 'CIVIC_SOCRATA_APP_TOKEN' : undefined,
    },
    pipelineSource:
      doc.pipelineType && doc.pipelineType !== 'none'
        ? {
            type: doc.pipelineType,
            baseUrl: doc.pipelineBaseUrl,
            resourceId: doc.pipelineResourceId,
            fieldMap: doc.pipelineFieldMap as any,
            appTokenEnv: doc.pipelineType === 'socrata' ? 'CIVIC_SOCRATA_APP_TOKEN' : undefined,
          }
        : undefined,
  }
}

/** Build a stable city id from a label + state, e.g. "Austin" + "TX" → austin-tx. */
export function makeCityId(label: string, state: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug}-${state.trim().toLowerCase()}`
}

export function getCity(id?: string | null): CityConfig | undefined {
  if (!id) return undefined
  return CITIES.find((city) => city.id === id)
}

/** Friendly label for a stored regionId, falling back to a humanized form. */
export function cityLabel(regionId?: string | null): string {
  const city = getCity(regionId)
  if (city) return city.label
  if (!regionId) return ''
  const head = regionId.split('-')[0] ?? regionId
  return head.charAt(0).toUpperCase() + head.slice(1)
}
