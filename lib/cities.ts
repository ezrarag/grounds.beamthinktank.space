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

export interface CivicDataSource {
  type: CivicSourceType
  /** Portal base URL, e.g. https://data.milwaukee.gov (CKAN) or a Socrata domain. */
  baseUrl?: string
  /**
   * Server-side env var holding the dataset/resource id (CKAN resource_id or
   * Socrata dataset id). Kept in env so real ids/tokens aren't committed.
   */
  resourceEnv?: string
  /** Server-side env var holding an app token (Socrata) if required. */
  appTokenEnv?: string
  /** Optional explicit mapping from a normalized field to the raw record key. */
  fieldMap?: Partial<Record<CivicField, string>>
}

export interface CityConfig {
  /** Stored as beamAsset.regionId. */
  id: string
  label: string
  state: string
  dataSource: CivicDataSource
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

export const CITIES: CityConfig[] = [
  {
    id: 'milwaukee-wi',
    label: 'Milwaukee',
    state: 'WI',
    dataSource: {
      // Milwaukee's open data portal (data.milwaukee.gov) runs CKAN. Point
      // CIVIC_MILWAUKEE_RESOURCE_ID at the Master Property (MPROP) resource id
      // to enable live scans.
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
    id: 'chicago-il',
    label: 'Chicago',
    state: 'IL',
    dataSource: {
      type: 'socrata',
      baseUrl: 'https://data.cityofchicago.org',
      resourceEnv: 'CIVIC_CHICAGO_RESOURCE_ID',
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
