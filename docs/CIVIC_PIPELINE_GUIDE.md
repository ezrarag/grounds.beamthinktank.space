# Development Pipeline & CIP Open Data Integration Guide

Grounds supports secondary civic open data streams for future development pipeline data (capital improvement projects, building permits, and civic redevelopment plans) alongside current parcel records.

## Architecture

In `lib/cities.ts`, each `CityConfig` object can carry both a `dataSource` (Master Property/Parcel records) and a `pipelineSource` (Capital Improvement Projects & Building Permits):

```ts
export interface CityConfig {
  id: string
  label: string
  state: string
  dataSource: CivicDataSource       // Parcel records (MPROP, Assessor)
  pipelineSource?: CivicDataSource  // Future Development Pipeline (Permits, CIP)
}
```

## Adding a Pipeline Source to a City

To enable future development pipeline records for any registered city:

### 1. In Code (`lib/cities.ts`)

Append a `pipelineSource` entry to the target city in `CITIES`:

```ts
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
}
```

### 2. Environment Variables

Set the environment variable containing the dataset ID:

- **Milwaukee (CKAN)**: `CIVIC_MILWAUKEE_PIPELINE_RESOURCE_ID=...`
- **Orlando (Socrata)**: `CIVIC_ORLANDO_PIPELINE_RESOURCE_ID=...`
- **Chicago (Socrata)**: `CIVIC_CHICAGO_PIPELINE_RESOURCE_ID=...`
- **Atlanta (Socrata)**: `CIVIC_ATLANTA_PIPELINE_RESOURCE_ID=...`
- **Zellwood FL (Socrata)**: `CIVIC_ZELLWOOD_PIPELINE_RESOURCE_ID=...`

### 3. Via Admin Console (No Code Required)

1. Navigate to `/portal/acquisition` -> **City registry**.
2. Open or create a city.
3. Scroll down to **Secondary Pipeline Source (CIP / Permits)**.
4. Set the **Source Type** (`socrata` or `ckan`), **Base URL** (e.g., `https://data.cityoforlando.net`), and **Dataset ID**.
5. Save the city.

## Endpoint & Surface Isolation

- **Endpoint**: `/api/civic/pipeline` accepts `{ cityId, q, limit }` and returns normalized `PipelineProject[]`.
- **Data Isolation**: Pipeline projects are marked with `isPipeline: true` and are rendered in the participant portal under the **[FUTURE PIPELINE - COMING]** tab. They are strictly isolated from acquirable `BeamAsset` objects.
