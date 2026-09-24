# Capital pipeline visibility + project status + credentialing — plan and Antigravity prompts

Checked against the live repo before writing this (`lib/adminAccess.ts`, `lib/useIsAdmin.ts`, `lib/redevelopment.ts`, `lib/cities.ts`) — not written cold. Three things in here: an honest take on the Capital Projects idea, a design for the project-status view you described, and a credentialing tier — and it turns out the third one isn't a new feature, it's the fix for two real defects already found in yesterday's review.

---

## Part 1 — The Capital Projects / Development Pipeline tab idea: my take

It's a genuinely good idea, and it fits Grounds better than it would almost anywhere else, because Grounds already has the exact architecture this needs — it just doesn't know it yet.

Look at `lib/cities.ts`: every city already carries a `CivicDataSource` — `type: 'ckan' | 'socrata' | 'none'`, a base URL, a resource id, a field map. That's the abstraction the pasted proposal is describing from scratch (ArcGIS REST / CIP portals / permitting APIs) — Grounds already solved "how do we normalize a city's public data feed into our schema," it just solved it for *current* parcel records (MPROP), not *future* pipeline records (CIP/permits). The right move isn't a fourth tab bolted onto the parcel modal with new plumbing — it's a second `CivicDataSource` type (`'permits'` or `'cip'`) on the same `CityConfig`, reusing the field-mapping pattern that already works.

Two things I'd push back on in the pasted proposal, both about sequencing, not the idea:

- **Start with one city, not a nationwide aggregator.** Milwaukee already has a live CKAN feed wired (`CIVIC_MILWAUKEE_RESOURCE_ID`) and real MPROP data flowing. Milwaukee's open data portal also publishes permit and CIP data through the same CKAN system — that's the cheapest real version to build, because it's the same integration pattern you already have working, pointed at a second dataset. The "high effort, nationwide" aggregator tier in that proposal is real but premature; it's a year-two problem, not a this-quarter one.
- **The embeddable-iframe option is a trap for you specifically.** Low effort, but it means the data never touches your schema — you can't cross-reference a pipeline project against `acquisitionTrack`, `equitySlots`, or a participant's `laborType`, which is the entire point (see below). Skip it even though it's the "low effort" row.

**Where this actually connects to Jamila and participants like her:** right now the tool only tells someone what's *available today*. A pipeline feed tells them what's coming in 18–36 months — which is exactly the lead time a scout/recruiter role needs to be worth something. It also gives her something concrete to *do* between "explore a parcel" sessions that doesn't require recruiting anyone yet: watching Milwaukee's CIP feed for projects whose trade mix matches BEAM's labor pool, and flagging them before they break ground. That's real, checkable work — not just dreaming — and it's the kind of activity that could plausibly be tracked and credited even before there's a paid deal to attach a commission to (Phase 2 territory from the roadmap I sent you, not Phase 4).

---

## Part 2 — Project status view: what you're describing already has most of its data model built

You want something like the parcel modal, but for "is this project moving" — CUM Milwaukee, the Georgia property, whatever comes next — instead of per-parcel exploration. Good news: `lib/redevelopment.ts` already has almost exactly this shape, it's just never been surfaced as a portfolio view.

`RedevelopmentProject` already tracks: `status` (`feasibility → phase-1 → active → paused → complete`), `phases[]` (each with its own status and a task list), `equitySlots[]` (role, hours needed vs. committed, and — this is the part that matters for Part 3 — `laborType` and a `requiresSupervision` boolean per slot), `committedCount`, `totalLoggedHours`, `financingNote`. Today this only renders one project at a time, at a slug someone already knows (`getProject(slug)`). There's no board that shows all active projects side by side.

**What to build:** a `RedevelopmentPipelineBoard` — one card per project, pulling `status`, phase progress (e.g. "3 of 5 phases complete"), open equity slots broken out by labor type ("2 licensed, 4 volunteer, 1 needs supervision"), and financing note. Same visual language as the Parcel Intelligence modal (tabs or cards, not a dense table) so it reads as one system. Link each card to the existing per-project detail view. Put it in both the admin console and the participant portal — admin sees every project including unpublished ones (the Georgia barn, once it's entered, stays admin-only via `isPublished`/`publicVisible` exactly like it does today); participants see published ones, which is what lets a community member or student actually pick a project to look into.

---

## Part 3 — Credentialing: this is the same fix yesterday's review already asked for

You asked for a way to make sure real professionals — people who can pull records, sign off on things, be liable for what they certify — are distinguishable from everyday participants like students or community members who should still be fully welcome to explore and dream. That's not a new ask layered on top of what's built; **the data model already has the hook for it, and the access-control layer is the one piece that's actually broken.**

Two things confirmed live in the repo:

- `lib/adminAccess.ts` is a flat allowlist — `ADMIN_EMAILS`, defaulting to just your email, overridable only by a full replacement env var. There is no tier between "signed in" and "is exactly this one admin account." Everyone else is `isAdmin: false`, full stop.
- `equitySlots` in `RedevelopmentProject` already has `laborType: 'licensed' | 'faculty-supervised' | 'research' | 'planning' | 'production' | 'volunteer'` and `requiresSupervision: boolean` — so the *data model* for "this task needs someone credentialed" already exists. Nothing today checks a person's actual credentials against it. A `laborType: 'licensed'` slot doesn't verify anyone is licensed; it's just a label on a task.

And separately, `docs/REVIEW_2026-09-17.md` (already in your repo) found two live defects that are really the same missing piece from the other direction: `assetInterest` submissions silently fail for everyone but your account, and `beamAssets`' read rule lets any signed-in user read non-public assets (the Georgia-barn privacy problem). Both are symptoms of having only two tiers — admin and everyone-else — when what you actually need is more like four.

**What to build — a real role/credential tier, not another boolean:**

- **Roles:** `community-member` (default — every signed-in participant; full explore/dream/interest access, no record-pull, no sign-off power), `verified-professional` (subtype: `general-contractor | underwriter | attorney | surveyor | architect` — matches the existing `laborType: 'licensed'` vocabulary rather than inventing a new one), `cohort-manager` (existing concept from the kernel spec — manages people, not legal/financial sign-off), `admin` (what `isAdmin()` means today).
- **A credential record**, server-written only (Admin SDK route, not client Firestore writes): who verified them, what they're verified for, when. No self-service "I'm a GC" checkbox — that defeats the point.
- **Gate by role, not by a second hardcoded email list:** requesting/approving a GC site walk or underwriter review (`AcquisitionTeamModule` already has the request side built — this adds the "who's allowed to be on the receiving end" side), pulling full owner-of-record/appraisal detail rather than the estimate badges, reading non-public `beamAssets`, editing a `redevelopmentProject`'s phases or equity slots. Community members keep everything they have now — search, explore, submit interest, attach to a work roster.
- **Fix the two review defects as part of the same change**, since they're the same root cause: give `assetInterest` its own create rule (open to any signed-in user, read restricted to admin/cohort-manager — not the `isAdmin()`-only catch-all), and fix `beamAssets`' read rule to `publicVisible == true || isAdmin() || <role check>` instead of the current `signedIn() || publicVisible == true`.

This is bigger than the pipeline-board work, so treat it as its own branch/PR.

---

## Antigravity prompts (paste as separate tasks — independent branches)

### Prompt A — Capital Projects data source (Milwaukee-first)

```
Extend Grounds' civic data layer to cover future development pipeline data (CIP/permits), not just current parcel records — reusing the existing pattern instead of building a new one.

Context: lib/cities.ts already defines CivicDataSource per city (type: ckan/socrata/none, baseUrl, resourceEnv, fieldMap) and /api/civic normalizes records for parcel lookups. Extend this rather than replacing it.

1. Add a second data-source slot to CityConfig — e.g. `pipelineSource?: CivicDataSource` — so a city can carry both a current-parcel source and a pipeline/CIP source independently.
2. Wire Milwaukee's pipelineSource to data.milwaukee.gov's permit/CIP dataset (CKAN, same pattern as the existing MPROP resourceEnv — use a new env var, e.g. CIVIC_MILWAUKEE_PIPELINE_RESOURCE_ID). Leave every other city's pipelineSource unset for now — don't build the nationwide aggregator tier yet.
3. Add a normalized PipelineProject type (name, address/parcel ref if available, status/stage if the source provides one, estimated timeline, trade/scope description) and a fetch function parallel to the existing civic scan.
4. Surface it as a filterable list in the participant portal — reuse the existing property-card visual pattern rather than a new component style. Do not merge pipeline entries into the BeamAsset/beamAssets collection; keep them a distinct, clearly-labeled "Coming" data type so nobody mistakes a future permit for an actual acquirable BEAM asset.
5. Feature branch + PR. PR description states this is Milwaukee-only by design and names what a second city needs (a pipelineSource config entry) to extend it.

Verify: hitting the participant portal's pipeline view for Milwaukee returns real permit/CIP records, not mock data; every other city shows no pipeline tab rather than an error.
```

### Prompt B — Redevelopment pipeline board + credential tiers (bigger, separate branch)

```
Two related changes — do the board first, the role system second, same branch is fine since the board's admin view needs the role check to be meaningful.

PART 1 — Portfolio-level project status board
lib/redevelopment.ts already models RedevelopmentProject with status (feasibility/phase-1/active/paused/complete), phases[] with per-phase status and tasks, equitySlots[] (role, hoursNeeded/hoursCommitted, laborType, requiresSupervision), committedCount, totalLoggedHours, financingNote — but it's only ever fetched one project at a time via getProject(slug). Build a RedevelopmentPipelineBoard component: one card per project, showing status, phase completion (e.g. "3 of 5 phases"), open equity slots broken out by laborType, and financingNote. Visual language should match the existing Parcel Intelligence Workspace modal (tabbed/card layout), not a dense table. Admin view (in app/admin) shows every project regardless of isPublished; participant view (in the portal) shows only isPublished ones. You'll need a way to list all redevelopmentProjects docs (there's currently only a per-slug fetch) — add that.

PART 2 — Role/credential tiers, replacing the single-admin boolean where it's currently overloaded
lib/adminAccess.ts today is a flat ADMIN_EMAILS allowlist with exactly one real tier (admin vs. not). This is the root cause of two live defects already logged in docs/REVIEW_2026-09-17.md: (a) the assetInterest Firestore collection has no rule of its own and falls through to the isAdmin()-only catch-all, so only the admin account can successfully submit an "I'm Interested" inquiry; (b) beamAssets' read rule is `signedIn() || publicVisible==true`, which lets any signed-in user read every non-public asset regardless of the flag's intent.

Add real roles: community-member (default for any signed-in user), verified-professional (with a subtype matching the existing laborType vocabulary: general-contractor/underwriter/attorney/surveyor/architect), cohort-manager, admin. Store credential grants server-side only — a new Admin-SDK-backed route, not a client-writable field — recording who verified the person, for what subtype, and when. No self-attestation path.

Update firestore.rules as part of this, not after: give assetInterest its own rule (create: any signed-in user; read/update/delete: admin or cohort-manager — not the bare catch-all), and fix beamAssets' read rule to `publicVisible == true || isAdmin() || <role-based check>` so "signed in" alone no longer means "can read everything." Gate AcquisitionTeamModule's GC-site-walk/underwriter-review *receiving* side (who's allowed to be assigned/act on a request, not who can request one — community members should still be able to request) by the matching verified-professional subtype.

Feature branch + PR, not main. PR description must explicitly confirm both REVIEW_2026-09-17.md defects are closed and say how to verify each (non-admin can submit an asset interest inquiry and have it persist; a non-admin signed-in user cannot read a beamAssets doc with publicVisible: false via the client SDK).
```

---

Order I'd actually do these in: Prompt B's Part 2 (the role/credential fix) is the one with a live defect behind it — the Georgia-barn privacy leak is real today, not hypothetical — so it outranks the board and definitely outranks Prompt A, which is a genuine improvement but nothing is broken in the meantime. If you only greenlight one thing this week, make it B.
