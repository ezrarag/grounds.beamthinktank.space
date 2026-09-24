# Antigravity prompt: live civic data, auto-registered city nodes, state program discovery, map UX

Checked against the live repo before writing this — `lib/civicPartners.ts`, `app/api/civic/pipeline/route.ts`, `app/api/civic/partners/route.ts`, `components/profile/InteractivePinMapCanvas.tsx`, `components/profile/RegionalHomesteadEngine.tsx`. Feature branch, PR, not main — same rule as always, and especially important this round since one item below touches real people's names.

---

## ⚠️ Read this before touching civicPartners.ts

`lib/civicPartners.ts` currently contains a hardcoded array with real named public officials (e.g. "Alderwoman Milele A. Coggs," real district, real phone/email) and a `relationshipStatus: 'supportive' | 'in_dialogue'` field asserted as fact, with no source citation and no verification date. This was generated as placeholder/demo data while building the feature, not sourced from anything real. **Do not treat this data as a reference implementation to extend with more invented officials for new cities.** The fix in Part 1 below is about the *data model and refresh mechanism*, not about writing more example names into the file. Any real official's name, contact info, or relationship status must come from Ezra confirming it, not be generated.

---

## Part 1 — Give the civic-representative layer a real source, or clearly mark it as unsourced

Today `getCivicRepresentatives()`/`getNonProfitPartners()` in `lib/civicPartners.ts` are static, hand-written arrays with no `sourceUrl`, `lastVerifiedAt`, or `verifiedBy` field, and `/api/civic/partners/route.ts` just returns them as-is — there is nothing to "refresh" because nothing is live.

1. Add `sourceType: 'verified-manual' | 'unverified-placeholder'`, `lastVerifiedAt: string | null`, and `verifiedBy: string | null` to both `CivicRepresentative` and `NonProfitPartner`. Every existing hardcoded entry gets `sourceType: 'unverified-placeholder'`, `lastVerifiedAt: null` — don't quietly upgrade them to "verified."
2. In the UI (`CivicPartnerLayer.tsx`), entries with `sourceType: 'unverified-placeholder'` must render a visible flag (e.g. "Unconfirmed — needs verification") — this should not look identical to a confirmed entry.
3. Move these arrays from a static TypeScript file into an admin-managed Firestore collection (`civicRepresentatives`, `nonProfitPartners`), same pattern as the existing `StoredCity` admin-managed cities — writable only by admin/cohort-manager (server-side route, Admin SDK, same pattern as `/api/admin/credentials`), not by any signed-in user. This is what makes "update when representation changes" possible at all: an admin edits a real record when a real election happens, rather than a code deploy being required.
4. Genuinely live official data (current officeholder by district) does exist as public open data in some cities (e.g. municipal clerk APIs, OpenStates) — if you want to explore wiring one in, treat it as read-only source suggestions an admin approves into the record above, never as auto-published fact. Flag what you find rather than building against an assumed API that may not exist for every city.
5. Add a manual "Refresh" action on `CivicPartnerLayer.tsx` that re-fetches `/api/civic/partners` (already a live route call, this part already works) so an admin's edit shows up without a full page reload.

## Part 2 — Auto-register a searched city/county as a City Node (place only, not people)

When a parcel search resolves to a city/county not already in `CITIES` or the Firestore-managed cities collection, automatically create a minimal `StoredCity` doc for it (`type: 'none'`, no `pipelineSource`, flagged `autoDiscovered: true`) so the Future Development pipeline tab and the civic/CDC layer both have a real node to attach data to for that place going forward, instead of silently having nowhere to put it.

**Do not auto-create civic representative or CDC/nonprofit-partner records for the new node** — those stay empty until an admin fills them in (Part 1). The node itself (a name, state, and empty data slots) is harmless to auto-create; a claimed relationship with a real person is not.

Surface `autoDiscovered: true` nodes to the admin console as a short "newly discovered — needs review" list so someone notices and can flesh them out, rather than them silently accumulating unseen.

## Part 3 — State/region program discovery, generalized from RegionalHomesteadEngine

`components/profile/RegionalHomesteadEngine.tsx` already does the right thing for one program type across three hardcoded regions (`UserTargetRegion: 'MKE' | 'ATL' | 'TPA'`). Generalize it:

1. Replace the fixed `UserTargetRegion` enum and `REGION_LABELS` with the actual list of registered City Nodes (from `CITIES` + Firestore-managed cities, including auto-discovered ones from Part 2), grouped by state.
2. Widen beyond `CITY_HOMESTEAD_SITES` to also check the existing Municipal Grant Matcher (`/api/grants/match`) for other program types available in that state, so a participant sees "here's what's available in your state" across program types in one place, not just $1 Homestead.
3. Keep the existing empty-state pattern ("No $1 Homestead parcels currently listed for X") — it's the right tone, just needs to apply per-node instead of per-hardcoded-region, and should also say when NO program of any kind is known for a state yet, distinct from "none listed for this specific city within a state that has other options."

## Part 4 — Map UX: full-width mode, zoom controls, real location, and the modal bug

`components/profile/InteractivePinMapCanvas.tsx` is a fixed `h-96` (384px) box with no `NavigationControl`, no `FullscreenControl`, and no geolocation call anywhere in the file.

1. **First, before writing any UI code**: check whether `NEXT_PUBLIC_MAPBOX_TOKEN` is actually set in the Vercel production environment. The code's fallback value (`'pk.eyJ...xxxx'`, literally ending in the placeholder string `xxxx`) is not a real token — if the real env var is missing in production, every map on the live site is silently trying to authenticate with a fake key. This may be Ezra's reported "the modal didn't work" bug on its own. Reproduce that bug with the browser console open and report the actual error before assuming a different root cause.
2. Add `mapboxgl.NavigationControl` (zoom +/-, compass) and `mapboxgl.FullscreenControl` to the map instance.
3. Add an explicit "expand" affordance that opens the map at full viewport width/height (a full-screen overlay, not just Mapbox's native fullscreen button, since that exits browser chrome entirely which not everyone wants) — same visual language as the existing modal system, not a new one.
4. Evaluate Mapbox's built-in `cooperativeGestures: true` map option for the "hard to zoom out, keep accidentally clicking off it" problem — it requires ctrl/cmd+scroll to zoom and shows a hint instead of silently scrolling the page, which is the standard fix for an embedded map fighting page scroll. Pair it with the visible zoom buttons from step 2 so zooming isn't harder for anyone.
5. Add a "Use my location" control calling `navigator.geolocation.getCurrentPosition` to recenter the map, with the current behavior (whatever passes the default `center` prop today) as the fallback when location is denied or unavailable — don't remove the fallback, just stop making it the default when the browser can tell you better.

## Verify

- Non-admin: open the civic/CDC layer, confirm unverified entries are visibly flagged, confirm no ordinary signed-in user can write to `civicRepresentatives`/`nonProfitPartners`.
- Search an address in a city with no existing node, confirm a new City Node is created with empty civic/pipeline data, and confirm nothing about a "representative" appears for it automatically.
- Load the map, confirm zoom +/- buttons and a fullscreen/expand control are visible and usable, confirm scrolling past the map's edge doesn't immediately scroll the page out from under it, confirm a location prompt appears and (if granted) recenters away from Milwaukee.
- Reproduce whatever "modal didn't work" originally meant, with console open, and report the actual error text either way — even if it turns out to be the Mapbox token.
