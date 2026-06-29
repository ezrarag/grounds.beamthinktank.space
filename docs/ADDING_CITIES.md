# Adding a city / state to BEAM Grounds

Grounds is multi-city. The city registry (`lib/cities.ts`) powers:

- the **City** dropdown when adding a property (`AddPropertyForm`),
- the **Scan civic records** tool (`CivicScanImport` → `/api/civic`),
- the **Node filter** and city labels on `/properties`.

A property added in any registered city populates the public Properties page
(when published). The civic scan additionally pulls real parcel records from
that city's open-data portal — once you supply its dataset id.

## What "civic data source" means

Most US cities publish open data on one of two platforms. The scan adapter
(`app/api/civic/route.ts`) supports both:

| Platform | Example portals | Needs |
| --- | --- | --- |
| **Socrata** | data.cityofnewyork.us, data.cityofchicago.org, data.lacity.org, data.sfgov.org, data.seattle.gov | dataset id (`xxxx-xxxx`), optional app token |
| **CKAN** | data.milwaukee.gov, many county/state portals | resource id (UUID) |

You do **not** need an API key for either to read public datasets. A Socrata
**app token** is optional and only raises rate limits.

## Daily checklist — add one city

1. **Find the city's open-data portal.** Search "<city> open data portal". Note
   the domain (e.g. `https://data.cityofchicago.org`).
2. **Identify the platform.** Socrata portals have URLs like `/resource/abcd-1234.json`.
   CKAN portals expose `/api/3/action/datastore_search`.
3. **Find the property/parcel dataset.** Search the portal for "parcels",
   "property", "assessor", or "master property". Open the dataset.
4. **Grab the id:**
   - Socrata: the dataset id is the `xxxx-xxxx` code in the dataset URL / API endpoint.
   - CKAN: open the resource → copy its **resource id** (a UUID) from the Data API section.
5. **Register the city** in `lib/cities.ts` — append a `CityConfig`:
   ```ts
   {
     id: 'austin-tx',            // becomes regionId; format: city-state
     label: 'Austin',
     state: 'TX',
     dataSource: {
       type: 'socrata',          // or 'ckan'
       baseUrl: 'https://data.austintexas.gov',
       resourceEnv: 'CIVIC_AUSTIN_RESOURCE_ID',
       appTokenEnv: 'CIVIC_SOCRATA_APP_TOKEN', // Socrata only; omit for CKAN
       // fieldMap is optional — the adapter probes common field names. Add a
       // mapping only if a dataset uses unusual column names.
     },
   }
   ```
6. **Set the dataset id env var** (the value from step 4):
   - Local: add `CIVIC_AUSTIN_RESOURCE_ID=...` to `.env.local`.
   - Production: add the same var in Vercel (Project → Settings → Environment Variables),
     then redeploy (or `vercel env pull` locally to sync).
7. **(Socrata, optional)** set `CIVIC_SOCRATA_APP_TOKEN` once — it's shared by all Socrata cities.
8. **Verify.** Sign in as admin → `/portal/acquisition` → **Scan civic records** →
   pick the city → Scan. You should see records. Select the ones you want, tick
   **Publish**, and Add — they appear on `/properties`.

## Field mapping (only if needed)

The adapter auto-detects common columns (name, address, owner, zoning, tax
status, parcel id, assessed value). If a city's scan shows blank fields, open
one raw record from the portal, find the real column names, and add a `fieldMap`
to that city's `dataSource`, e.g.:

```ts
fieldMap: {
  address: 'situs_address',
  ownerName: 'owner',
  parcelId: 'pin',
  assessedValue: 'total_value',
}
```

## Already registered

Milwaukee (CKAN) and New York, Chicago, Los Angeles, San Francisco, Seattle
(Socrata). The Socrata cities need only their `*_RESOURCE_ID` env var to go live.
