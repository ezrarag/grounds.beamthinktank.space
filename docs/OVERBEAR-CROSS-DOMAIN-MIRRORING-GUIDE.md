# OVERBEAR Cross-Domain Mirroring Guide & Architecture
**Division:** `grounds.beamthinktank.space` -> `home.beamthinktank.space`  
**Purpose:** Specification for the "OVERBEAR" thread / agent to implement distributed event mirroring across BEAM satellite domains into the central BEAM Home nerve center.  
**Author:** Antigravity  
**Date:** 2026-09-24  

---

## 1. Executive Summary & Core Philosophy

The BEAM thinktank ecosystem consists of autonomous division websites (e.g. `grounds`, `business`, `law`, `forge`, `transportation`, `band`, `choir`, etc.) and a central coordinating hub (`home.beamthinktank.space`).

Each satellite site possesses unique local data models and security constraints:
- **Grounds:** Real-estate acquisitions, land trust covenants, participant sweat-equity hours, and stakeholder meeting agenda topics (Denail, DeTania, Rick, Ezra).
- **Business / BFCU:** Credit union balances, collateral tokens, loan origination.
- **Law:** Pre-law memos, quiet title dockets, statutory abandonment filings.

### Fundamental Principle: **Local-First Persistence, Async Central Mirroring**
1. **Never block the user experience on a cross-domain network call.** Every action taken on `grounds.beamthinktank.space` must commit first and immediately to the local Grounds Firestore database (`db` in `lib/firebase.ts`) or return a local receipt.
2. **OVERBEAR Mirroring Engine:** An asynchronous bridge responsible for detecting or receiving local satellite events and normalizing them into central collections on `home.beamthinktank.space` (e.g., `central_agenda_queue`, `ecosystem_notifications`, `cross_division_ledger`).

---

## 2. Grounds Stakeholder Agenda Queue Contract

The landing page of `grounds` introduces a direct stakeholder input for leadership (Denail, DeTania, Rick, brother, Ezra).

### Local Grounds Firestore Schema
**Collection:** `agendaQueue` (on `grounds` Firestore)  
**Document ID:** Auto-generated (`addDoc`)

```typescript
export interface GroundsAgendaItem {
  id?: string
  topic: string                    // The question, friction point, or priority item
  category: 'monetization' | 'title-acquisition' | 'bfcu-capital' | 'community-clt' | 'participant-housing' | 'general'
  stakeholderName?: string         // e.g. "Denail", "DeTania", "Rick", "Ezra", or partner email
  stakeholderRole?: string         // e.g. "Board / Family / Advisor / Partner"
  contact?: string                 // Email or phone if provided
  urgency: 'routine' | 'priority' | 'urgent'
  sourceDivision: 'grounds'
  sourcePage: '/'                  // Landed from root showcase
  status: 'queued' | 'reviewed' | 'addressed'
  createdAt: string                // ISO timestamp
  meetingDateTarget?: string       // Nearest weekly meeting date
  syncedToHome: boolean            // Flag set by OVERBEAR bridge
  homeSyncedAt?: string
}
```

### Local API Endpoint: `/api/agenda-queue`
- **Route:** `app/api/agenda-queue/route.ts`
- **Handler:** POST
- **Action:**
  1. Validates payload (topic non-empty).
  2. Strips undefined values using `sanitizeForFirestore()`.
  3. Writes to `collection(db, 'agendaQueue')`.
  4. Attempts non-blocking HTTP dispatch to `process.env.BEAM_HOME_MIRROR_ENDPOINT` (or logs local queue receipt if offline).
  5. Returns `{ success: true, queueId: docRef.id, message: "Added to leadership agenda." }`.

---

## 3. How OVERBEAR Should Handle the Mirroring

The OVERBEAR agent / thread should implement the downstream sync following this protocol:

```
[Stakeholder on Grounds]
          │
          ▼
[Grounds Firestore: agendaQueue]  <-- Local source of truth (Guaranteed)
          │
          ├─────────────────────────────────────────┐
          │ (Push attempt via Webhook/API)          │ (Pull / Scheduled reconciliation)
          ▼                                         ▼
[Home API: /api/mirror/agenda]              [OVERBEAR Worker / Cron]
          │                                         │
          ▼                                         ▼
[Home Firestore: centralAgendaQueue] <──────────────┘
          │
          ▼
[BEAM Weekly Agenda Dashboard (`beam-weekly-agendas.md` or Home Admin UI)]
```

### Protocol Guidelines for OVERBEAR:
1. **Idempotency via `sourceDivision + sourceDocId`:**
   When writing to `centralAgendaQueue` on Home, the document ID or unique lookup must be `grounds_${groundsDocId}`. This prevents duplicate agenda items during retries.
2. **Different Strokes for Different Sites:**
   - **Grounds -> Home:** High-touch governance (`agendaQueue`), parcel recommendations (`suggestSite`), and verified asset interest (`assetInterest`).
   - **Transportation -> Home:** Fleet shift logs and transit token claims.
   - **Law -> Home:** Legal docket status and pre-law memo flags.
   - **Forge -> Home:** Developer bug echoes and deployment statuses.
3. **Fallback to Polling / Sync Sprints:**
   If cross-domain firewalls or serverless timeouts prevent direct webhook delivery, OVERBEAR's recurring task checks `grounds` documents where `syncedToHome == false` and syncs them in batch.

---

## 4. Immediate Action Checklist for Grounds
- [x] Document schema and mirroring contract in `docs/OVERBEAR-CROSS-DOMAIN-MIRRORING-GUIDE.md`.
- [ ] Create `/api/agenda-queue/route.ts` with local Firestore writes and non-blocking Home webhook forwarder.
- [ ] Update `firestore.rules` on Grounds to allow public/stakeholder submission to `agendaQueue` with strict schema validation.
- [ ] Update `docs/CROSS-AGENT-STATUS.md` with entry noting the new `agendaQueue` collection.
