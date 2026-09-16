# Real-Estate Exploration & Site Pipeline Testing Guide

This guide outlines how to test the **BEAM Grounds Real-Estate Exploration & Site Pipeline Tool** on `/portal/participant` across four distinct visitor persona flows.

---

## 1. Overview of Features Added

- **Live Asset Pipeline (`useAcquisitionSites`)**: Integrates real-time `BeamAsset` items from Firestore into the member profile view.
- **Track Filter Toolbar**:
  - `All Properties`: Full combined view of live commercial/civic assets and $1 homestead properties.
  - `Commercial & Production (Track C/D)`: Filtered to commercial, studio, warehouse, industrial, and mixed-use assets.
  - `Civic & Residential (Track A/B)`: Filtered to civic reuse anchors, community centers, and residential developments.
  - `$1 Homestead Eligible`: Filtered to $1 sweat-equity properties across target cities (e.g., Milwaukee, Atlanta).
- **Target Node Filtering**: Quick filter by city nodes (`All Cities`, `Milwaukee`, `Atlanta`, etc.).
- **Live Search**: Instant keyword filtering across property name, address, zoning code (`ckanZoning`), and asset status.
- **Financial & Appraisal Badges**:
  - Estimated Property Valuation (`estimatedValue` / `ckanAssessedValue`).
  - Essential Repair & Rehabilitation Estimates (`repairCostEstimate`).
  - Projection Monthly Revenue & Commercial Financing Plans (`financePlan`).
- **Commercial & Track Interest Modal (`AssetInterestModal`)**:
  - Allows signed-in members and visitors to express interest in specific properties.
  - Supports engagement types: *Commercial Lease / Tenancy Request*, *Co-Development & Joint Operating Partner*, *Land Trust Equity Participant*, *General Site Inquiry & Tour Request*.
  - Writes directly to the `assetInterest` Firestore collection.
- **Layer 2 Site Work Roster Integration (`PropertyWorkRosterModal`)**:
  - Allows members to attach their profile to any property roster for skilled labor, moving assistance, or acoustics/stewardship shifts.

---

## 2. Visitor Persona Testing Flows

### Persona A: Commercial Operator or Studio Lessee (Track C/D)
> **Goal**: Explore available commercial or production spaces (warehouses, studios, retail) and submit a tenancy/co-development inquiry.

1. Navigate to `/portal/participant` in your browser.
2. Under **Real-Estate Exploration & Site Pipeline**, click the **Commercial & Production (Track C/D)** filter pill.
3. Observe live assets such as production hubs, recording studios, or warehouses with Track C / Track D badges.
4. Review the **Est. Valuation**, **Repair Estimate**, and **Proj. Monthly Rev** metrics.
5. Click **I'm Interested** on a commercial property.
6. In the modal:
   - Select *Commercial Lease / Tenancy Request* or *Co-Development & Joint Operating Partner*.
   - Enter proposal notes (e.g., "Seeking 2,500 sq ft for recording residency & acoustics lab").
   - Click **Submit Interest Inquiry**.
7. Verify that the inquiry succeeds and displays confirmation.

---

### Persona B: Civic Partner or Community Steward (Track A/B)
> **Goal**: Browse civic adaptive reuse anchors and propose a community program or tour request.

1. On `/portal/participant`, click the **Civic & Residential (Track A/B)** filter pill.
2. Filter by city node (e.g. click **Atlanta** or **Milwaukee**).
3. Click **Propose Use / Inquiry** on a civic property card.
4. Select *General Site Inquiry & Tour Request* or *Land Trust Equity Participant*.
5. Submit the inquiry and verify confirmation.

---

### Persona C: $1 Homestead Participant
> **Goal**: Browse $1 sweat-equity sites, evaluate essential repairs, and attach a $1 homestead claim.

1. On `/portal/participant`, click the **$1 Homestead Eligible** filter pill.
2. Review available $1 homestead taxkey parcels and essential repair estimates.
3. Click **$1 Homestead** / **Claim $1 Homestead Site** to launch the `PropertyMatcherModal`.
4. Select a city node and complete property matching.
5. Notice that your profile now displays **Linked $1 Site Attached** with green highlight status!

---

### Persona D: Skilled Worker or Site Volunteer
> **Goal**: Attach profile to a property's revitalization work roster to offer trade skills or receive work shift alerts.

1. On any property card (live asset or $1 homestead site), click **Attach Roster** / **Attach Profile to a Work Site**.
2. Select skilled work capacities (e.g., *Trade Skills*, *Moving & Hauling*, *Acoustics & AV*, *Site Stewardship*).
3. Enable **Work Alerts Active** notification toggle.
4. Click **Attach Profile to Work Roster**.
5. Scroll up to **My Site Work & Revitalization Rosters** and verify your attached roster card appears with active badges.

---

## 3. Verification Checklist

- [x] TypeScript clean check: `npx tsc --noEmit` passes with 0 errors.
- [x] `useAcquisitionSites` updated with `retail`, `warehouse`, `industrial`, `studio`, `recording-studio`, `mixed-use`.
- [x] Atlanta, GA registered in `lib/cities.ts` with `dataSource.type: 'none'`.
- [x] Firestore security rules remain intact.
- [x] `AssetInterestModal` writes inquiries to `assetInterest` collection in Firestore.
