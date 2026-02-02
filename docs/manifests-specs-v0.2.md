# Sea Saba App — Manage Guests + Day Manifest + Taxi (Spec v0.1)

This document is a Windsurf-ready build plan/spec for implementing:
- **Manage Guests** (Guest Database + In‑House Board)
- **Whole‑Day Day Manifest** (Dives 1/2/3 + ND, boat assignment)
- **Taxi runs auto-generation** (with default run times + editable/custom overrides)
- **Gear handled on a separate screen**
- **Print views can differ from build UI**

---

## 1) High-level goals

1. **CSV import → Firestore**
   - Dedupe guests (email/phone)
   - Create/update **Customers** and **Stays**
2. **Manage Guests**
   - Guest Database: search/filter/edit/import/dedupe review
   - In‑House Board: editable arrival/departure + accommodation (hotel/property only)
   - Gear requirements editable from both areas and saved to DB
3. **Day Manifest (whole day)**
   - One list for the date: each person has D1/D2/D3/ND toggles
   - Boat assignment via fast control: “Boat for selected dives” + optional per-dive advanced
   - Derived Taxi list + editable/custom taxi times when needed
4. **Gear screen**
   - Separate view focused on rental gear (build UI != gear UI != print UI)

---

## 2) Firestore collections & field specs

### 2.1 `customers/{customerId}`
Long-lived person identity + verified cert + “latest gear” + last dive stats.

**Identity**
- `fullName: string`
- `emailLower: string | null`
- `phoneE164: string | null`
- `dob: string (YYYY-MM-DD) | null`
- `notesGeneral: string | null`

**Dive certification (locked after verification)**
- `certLevel: string | null`
- `certAgencyNumber: string | null`
- `certVerified: boolean` (default false)
- `certVerifiedAt: timestamp | null`
- `certVerifiedBy: string | null`

**Nitrox certification (separate from “wants nitrox”)**
- `nitroxCertified: boolean | null`
- `nitroxCertAgencyNumber: string | null`
- `nitroxVerified: boolean` (default false)
- `nitroxVerifiedAt: timestamp | null`
- `nitroxVerifiedBy: string | null`

**Diving history (update only when lastDive becomes more recent)**
- `lastDiveDate: string (YYYY-MM-DD) | null`
- `lifetimeDives: number | null`
- `lastDiveDateSourceAt: timestamp | null`

**Gear (latest wins by submissionUpdatedAt)**
- `gearDefault: Gear`
- `gearLastUpdatedAt: timestamp | null`

**Bookkeeping**
- `createdAt: timestamp`
- `updatedAt: timestamp`

#### Gear object shape (normalized MVP)
Use this for both `customers.gearDefault` and `stays.gearRequested`.
```ts
type GearItem = { needRental: boolean; sizeText?: string; sourceText?: string };
type Gear = {
  bcd?: GearItem;
  regulator?: GearItem;
  wetsuit?: GearItem;
  fins?: GearItem;
  mask?: GearItem;
  computer?: GearItem;
  otherNotes?: string;
};
```

MVP parsing: detect “Rental” vs “I have my own”; store raw `sourceText` and `needRental`.

---

### 2.2 `stays/{stayId}`
Trip-specific window, accommodation, form submission metadata, trip gear request, nitrox preference.

- `customerId: string`
- `bookingCode: string | null` (e.g., HHQB-010226)
- `externalDocId: string | null` (“Document” column)
- `arrivalDate: string (YYYY-MM-DD)`
- `arrivalDetails: string | null`
- `departureDate: string (YYYY-MM-DD)`
- `departureDetails: string | null`
- `accommodationName: string | null` (hotel/property only; no room)
- `participantsName: string | null`

**Operational status**
- `status: "planned" | "in_house" | "checked_out"` (default planned)
- `checkedOutAt: timestamp | null`

**Imported workflow/status fields**
- `sourceStatus: string | null` (e.g., COMPLETE)
- `submissionUpdatedAt: timestamp` (from CSV Updated Date, fallback Created Date)
- `importId: string`

**Trip preferences**
- `nitroxPreference: "air" | "nitrox" | null` (from “Diving Nitrox (at additional cost)”)

**Gear requested for this stay**
- `gearRequested: Gear`
- `gearRequestedAt: timestamp` (= submissionUpdatedAt)

**Bookkeeping**
- `createdAt: timestamp`
- `updatedAt: timestamp`

---

### 2.3 `dayManifests/{dateId}`
One doc per calendar date (whole day).

- `date: string (YYYY-MM-DD)`
- `status: "draft" | "published" | "completed"` (default draft)
- `notes: string | null`
- `createdAt: timestamp`
- `updatedAt: timestamp`

Optional header info (if desired for print):
- `captainByBoat: Record<boatId, string>`
- `crewByBoat: Record<boatId, string[]>`

#### `dayManifests/{dateId}/rows/{rowId}`
One row per person for that date.

**Linkage**
- `customerId: string`
- `stayId: string | null` (active stay for that day, if any)

**Dive plan**
- `d1: boolean`
- `d2: boolean`
- `d3: boolean`
- `nd: boolean`

**Boat assignment**
- `d1BoatId: string | null`
- `d2BoatId: string | null`
- `d3BoatId: string | null`

**Taxi**
- `needsTaxi: boolean`
- `pickupLocationText: string | null` (default from stay.accommodationName)
- `dropoffLocationText: string | null` (default same as pickup)
- `taxiOverride?: {
    pickupRunId?: string;
    dropoffRunId?: string;
    noTaxiToday?: boolean;
  }`

**Day notes**
- `notes: string | null`

**Bookkeeping**
- `createdAt: timestamp`
- `updatedAt: timestamp`

---

### 2.4 `dayManifests/{dateId}/taxiRuns/{runId}`
Taxi runs are **editable per day** and allow custom times.

Fields:
- `direction: "to_harbor" | "from_harbor"`
- `timeLocal: string` (e.g., `"08:30"`, `"10:45"`, 24h preferred)
- `label?: string` (optional, e.g., “Extra run”)
- `isDefault: boolean`
- `sortIndex?: number` (optional; otherwise sort by time)
- `createdAt`, `updatedAt`

**Default runs (seed if missing on first open for the date):**
- To Harbor: **08:30**, **10:15**, **12:30**
- From Harbor: **10:45**, **13:00**, **15:00**

---

## 3) CSV import pipeline

### 3.1 Staging
- Create `imports/{importId}` and store rows in `imports/{importId}/rows/{rowId}`:
  - raw fields
  - normalized fields: `emailLower`, `phoneE164`, parsed dates, parsed gear object
  - match results: `matchCustomerId`, `matchType`, `needsReview`

### 3.2 Dedupe / matching
For each row:
1) If `emailLower` matches existing customer → link
2) Else if `phoneE164` matches → link
3) Else create new customer

Flag for review if:
- email matches one customer, phone matches another, or multiple candidates.

### 3.3 Customer update rules (user requirements)
Let `importTimestamp = submissionUpdatedAt`.

**Cert fields**
- If `customer.certVerified === true`: DO NOT overwrite `certLevel`, `certAgencyNumber`
- Else overwrite from import

**Nitrox certification fields**
- If `customer.nitroxVerified === true`: DO NOT overwrite `nitroxCertified`, `nitroxCertAgencyNumber`
- Else overwrite from import

**Last dive + lifetime dives**
If `import.lastDiveDate > customer.lastDiveDate`:
- set `lastDiveDate = import.lastDiveDate`
- set `lifetimeDives = import.lifetimeDives`
- set `lastDiveDateSourceAt = importTimestamp`

**Gear**
If `importTimestamp > customer.gearLastUpdatedAt`:
- set `gearDefault = parsedGearFromImport`
- set `gearLastUpdatedAt = importTimestamp`

### 3.4 Stay upsert rule
Upsert stay using a stable key:
- Prefer key: `(bookingCode + customerId)` when bookingCode exists
- Else `(externalDocId)` if unique
- Else create new stay

Always update stay fields from import (arrival/departure/accommodation/details/status/nitroxPreference/gearRequested).

---

## 4) Manage Guests UI

### 4.1 Guest Database
- Search: name/email/phone
- Filters:
  - certVerified, nitroxVerified
  - accommodationName (via active stay or latest stay)
  - needs rental gear (any)
  - “active on date” (optional)
- Guest profile:
  - edit identity fields
  - edit cert + toggle verified (locks import overwrites)
  - edit nitrox cert + toggle verified
  - edit gearDefault (updates `gearLastUpdatedAt` = now)
  - view stay history

### 4.2 In‑House Guests Board (driven by stays)
Tabs:
- Today: arrival <= today <= departure AND status != checked_out
- Arriving soon (next N days)
- Departing soon
- All planned/in_house

Inline edits:
- arrivalDate, departureDate
- accommodationName (hotel/property only)
- status planned/in_house/checked_out

Stay detail drawer:
- travel details
- nitroxPreference
- gearRequested editor (trip-specific)
- link to customer

**Gear editing requirement**
- Customer screen edits `customers.gearDefault`
- In-house/stay screen edits `stays.gearRequested`
- Provide an action: “Copy stay gear → customer defaults” (optional)

---

## 5) Day Planner / Whole‑Day Manifest UI (build view)

### 5.1 Page behavior
- Select date
- Load or create `dayManifests/{dateId}`
- Ensure taxi runs exist for the day:
  - If `dayManifests/{dateId}/taxiRuns` empty, seed defaults.

**Pool for planning**
- compute “in scope” stays for selected date:
  - arrivalDate <= date <= departureDate
  - status != checked_out
- show them in a pool; allow “Add diver” autocomplete for one-offs.

### 5.2 Row editing (fast)
- D1/D2/D3/ND toggles (ND mutually exclusive)
- Boat assignment:
  - Primary: “Boat for selected dives” dropdown
  - Advanced: reveal per-dive boat dropdowns when needed

Validation gates for Publish:
- Any in-scope guest must be scheduled (D1/D2/D3 or ND), unless explicitly removed
- If Dx checked → DxBoatId required
- Capacity warnings per boat per dive (configurable soft/hard)

---

## 6) Taxi auto-generation rules (updated times + editable/custom runs)

### 6.1 Default run mapping by dives
Given dives selected:

**Pickup run (to harbor)**
- If earliest dive is **1** → pickup = **08:30**
- If earliest dive is **2** → pickup = **10:15**
- If earliest dive is **3** → pickup = **12:30**

**Dropoff run (from harbor)**
- If latest dive is **1** → dropoff = **10:45**
- If latest dive is **2** → dropoff = **13:00**
- If latest dive is **3** → dropoff = **15:00**

Examples:
- D1+D2 → 08:30 → 13:00
- D2+D3 → 10:15 → 15:00
- D1 only → 08:30 → 10:45
- D3 only → 12:30 → 15:00
- ND → no taxi

### 6.2 Overrides & custom times
- If `taxiOverride.noTaxiToday === true` → exclude from taxi lists
- If `taxiOverride.pickupRunId` set → use that pickup run (even if derived differs)
- If `taxiOverride.dropoffRunId` set → use that dropoff run

**Custom time workflow**
- In Taxi Runs editor for the day:
  - Add a run with direction and time (e.g., “to_harbor 09:00”)
  - That creates a `taxiRuns/{runId}` doc for the day
- In a row, “Override” allows selecting any runId in that direction.

### 6.3 Taxi list output (derived)
Generate two grouped lists:
- To Harbor groups by pickup run time
- From Harbor groups by dropoff run time

Each entry:
- Guest name
- pickup/dropoff location
- notes
- optional: boats/dive plan summary

---

## 7) Gear Screen (separate)
For a selected date:
- Show guests scheduled that day (from manifest rows)
- Determine gear needs by priority:
  1) stay.gearRequested (if stayId exists)
  2) else customer.gearDefault
- Filters:
  - by boat (any dive assigned to boat)
  - by needs rental gear
  - by accommodationName

---

## 8) Print views (separate from build UI)
- Boat sheets (one per boat): include guest rows where that boat is selected for that dive
- Taxi sheets: grouped by run times (using derived + overrides)
- Print layouts may mimic current paper manifest regardless of build UI.

---

## 9) Milestones / implementation order

1. Firestore schema + CRUD for customers/stays
2. Manage Guests UI (database + in-house board)
3. CSV staging import + dedupe review + commit rules
4. Day Planner + manifest rows + boat assignment UX
5. Taxi runs per day (seed defaults) + derived taxi lists + overrides + custom run editor
6. Gear screen
7. Print views
