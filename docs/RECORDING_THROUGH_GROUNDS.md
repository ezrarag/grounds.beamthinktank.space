# Recording through Grounds — brief for the grounds thread

Written 2026-09-15 from the BEAM structure thread. Committed here rather than to project memory
because project memory was unavailable in that session — read this as if it were a memory file.

## The decision

Ezra wants to **start the recording program through grounds rather than orchestra**, even though
orchestra is the more finished site. That is a deliberate strategic choice, not an ordering
accident, and it should be treated as settled input rather than re-litigated.

The reasoning, as far as it can be reconstructed: a recording program needs a *room* before it
needs a roster. Orchestra can list musicians all day; without a space with a door and a date on it,
nothing gets recorded. Grounds is the division that produces rooms.

It also front-loads the thing with the real deadline. Grounds is one of two sites that has to be
visibly working before Ezra asks Kathy Smith about the Georgia property (house + barn) in October,
around a gig he is playing that she is organizing. Orchestra has no October gate. Grounds does.

## What grounds already has that serves this

From the earlier grounds architecture review:

- **`BeamAsset.locationType`** already includes `venue`, `rehearsal-space`, `performance-venue`,
  and `project-site`. A recording space fits today without a schema change. There is no
  `recording-studio` value — decide whether that's worth adding or whether `rehearsal-space` with a
  `cohortUses` tag carries it.
- **`BeamAsset.cohortUses?: string[]`** is the existing field for "this asset belongs to division
  X's program." A barn tagged for the recording residency is one string.
- **`NGOLinkManager` / `BeamAsset.ngoLinks`** already models relationships between an asset and
  other divisions/institutions, with `relationshipType` covering `anchor-site`, `service-site`,
  `cohort-project`, `training-site`. This is how a grounds property becomes orchestra's venue
  without either site owning the other's data.
- **`getPublicProperties()`** reads are gated only on `publicVisible`, not on domain — so any BEAM
  site holding the same Firebase project id can already read public grounds assets. Orchestra can
  display a grounds venue with no new API.
- **`SuggestSiteForm.tsx`** exists and writes to a `siteSuggestions` collection, but **is not
  mounted on any route.** That is the natural "a division needs a building" intake channel and it's
  one route away from existing.
- **Network Dispatcher mode** (`LiveDispatchMap`) is a live proximity map. Built for routing
  participants; it is also the surface a vehicle fleet would dispatch from later.

## The gaps worth naming

- `groundsConfig.pathways` has five participant entry tiles — learn, earn, teach, partner, own —
  and all five are housing and land-trust flavored. **There is no tile for a participant joining to
  work on a non-housing project space.** A musician who wants to help stand up a recording room has
  no door.
- `RedevelopmentProject.assetId` is a single string. A residency that spans a house *and* a barn
  has no native representation. Workaround is a shared `cohortUses` tag plus reciprocal
  `linkedProjectIds`; the real fix is `assetIds: string[]`.
- No Florida or Georgia city is registered in the city registry yet — only Milwaukee (CKAN) and
  five Socrata cities. Registering one is a two-minute admin form and can be done with
  `dataSource.type: 'none'` purely to unlock manual entry. **The Georgia property cannot be entered
  as an asset until its county or city is registered.**
- `isAdmin()` in `firestore.rules` is hardcoded to a single email. Nobody else can use the intake UI.

## Two sites, two clocks

- **Georgia (house + barn, James Smith's, managed by Kathy).** The recording target. Ezra is
  explicitly *not* ready to ask her for anything — the plan is to let things develop until the
  October gig and have something visibly in use first. So: the barn can be modeled in grounds as a
  prospective asset, but nothing should be built that requires her permission or that she would
  have to see before October.
- **Milwaukee (Central United Methodist Church).** The parallel site, more performance and
  recording focused. Milwaukee is already a registered city with real civic data behind it, so it's
  the one that can be exercised end-to-end today.

## Suggested first move

The shortest path to "a non-technical visitor can look at this and understand it" — which is the
actual October requirement — is probably:

1. Register the Georgia county (or nearest city) with `dataSource.type: 'none'` so manual entry works.
2. Enter the barn as a `BeamAsset`, `locationType: rehearsal-space`, tagged `cohortUses` for the
   recording residency, `publicVisible` false until Ezra says otherwise.
3. Mount `SuggestSiteForm` on a real route so the "a division needs a building" direction exists.
4. Give the residency a `RedevelopmentProject` so there is something with a name, a site, and a
   state that a visitor can look at.

That is four small things, none of which need Kathy's permission, and together they make the
concept legible on screen.

## Open questions for this thread

1. Does `ParticipantCommandCenter` support *adding* a participant, or only managing existing ones?
   (Still unverified — check before designing an intake screen.)
2. Is `REGRID_API_TOKEN` live in production? Without it, parcel lookup falls back to three
   hardcoded Milwaukee seed addresses.
3. Add a `recording-studio` locationType, or carry it with tags?
4. Add a sixth pathway tile for non-housing project work?
5. Who besides Ezra gets grounds admin, and is it all-or-nothing or scoped per division?

## Write findings back

No thread can read another thread. When something here gets settled or turns out to be wrong,
write it to project memory (`beam-grounds-library-siting.md`, or a new topic file with an index
line in `MEMORY.md`) so the structure thread and every future site thread inherit it.
