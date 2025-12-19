# Checkfront ↔ Waiver Reconciliation (Manifests + Taxi Scheduling)

## Goal
Create a reliable daily operations workflow where:

- Checkfront is the source of truth for **what bookings exist** (counts, dates, product/items booked).
- The waiver system is the source of truth for **who the actual people are** (names, contact details, accommodations/pickup location, etc.).
- Firestore stores normalized data so the UI can:
  - build boat manifests
  - schedule taxis
  - detect and resolve missing or mismatched guests

The join key between the two systems is **`booking_id`**.

## Constraints / Assumptions
- The waiver system is **not connected to the Checkfront API**.
- Waiver exports contain a **`booking_id`**, and that value will be stored in Firestore.
- Some waivers may be:
  - missing (guest never filled it out)
  - from a prior booking (guest reused an old waiver)
  - assigned to a wrong `booking_id` by human error

Therefore, reconciliation is a first-class UI workflow.

## Primary Use Cases

### 1) Create a manifest for a given date
- Choose a date.
- Choose the Checkfront products (item IDs) that represent dives for that day.
- Fetch Checkfront bookings for that date and those products.
- Join against waiver-imported guests.
- Show completeness and mismatches.

### 2) Schedule taxis for a given date
- Use the same joined guest list.
- Derive pickup times from dive slots and accommodations.
- Auto-assign taxis using taxi capacity + preference.

### 3) Resolve “missing people”
Example:
- Operations expects 12 divers for “two tank morning dive” for a day.
- Only 10 waiver guests match the day’s bookings.

The UI should guide the user to:
- identify which bookings are missing guests
- search for missing waivers or correct the `booking_id` on a guest
- create exceptions or placeholders when needed

## Data Model (Firestore)

### A) `checkfrontBookings` (synced from Checkfront)
Document ID: recommended `booking_{bookingId}` (string)

Fields (minimum viable):
- `bookingId: number`
- `code: string`
- `statusId: string`
- `statusName: string`
- `createdDate: Timestamp`
- `startDate: Timestamp` (if available/derivable)
- `endDate: Timestamp` (if available/derivable)
- `customerName: string`
- `customerEmail: string`
- `summary?: string`
- `dateDesc?: string`
- `syncedAt: Timestamp`
- `source: 'checkfront'`

Notes:
- `booking/index` returns booking-level info; it does not include waiver guest details.
- We store bookings even if there are 0 waivers so the UI can show "missing waivers".

### B) `guests` (or existing waiver-imported collection)
Each doc represents one person.

Fields (minimum viable):
- `fullName: string`
- `email?: string`
- `phone?: string`
- `accommodations?: string` (pickup location)
- `bookingId?: number` (nullable, but the goal is to populate it)
- `bookingCode?: string` (optional convenience)
- `source: 'waiver_import' | 'manual'`
- `importBatchId?: string`
- `createdAt`, `updatedAt`

### C) `manifestRuns` (daily reconciliation snapshot)
Document ID could be `YYYY-MM-DD` or include a run id.

Fields:
- `date: Timestamp`
- `selectedItemIds: number[]`
- `selectedStatusIds?: string[]`
- `expectedBookingIds: number[]`
- `createdAt`
- `createdBy`

This allows repeatable reconciliation and auditing.

### D) `taxiAssignments`
Assignments are operational and should remain editable.

Fields (minimum viable):
- `date: Timestamp` (or derive from diveSlotId; explicit date simplifies queries)
- `bookingId?: number`
- `guestId: string` (if you assign per person)
- `taxiId: string` (Firestore doc id from `taxis` collection)
- `pickupTime: string` (HH:mm)
- `pickupLocation: string`
- `destination: string`
- `numberOfPassengers: number`
- `notes?: string`
- `createdAt`, `updatedAt`

## Integration Strategy

### 1) Checkfront API access (server-side only)
- Use a Firebase Cloud Function as a proxy/sync layer.
- Do **not** call Checkfront from the browser.

Primary endpoint:
- `GET /api/3.0/booking/index`

Supported query params of interest:
- `start_date`, `end_date`
- `item_id`
- `status_id`
- `last_modified` (useful for incremental refresh)
- `limit`, `page`

Implementation detail:
- Depending on API behavior, we may need one call per `item_id` and then merge by `booking_id`.

### 2) Waiver import
Two approaches:

- **Manual upload**: export CSV from waiver system → upload in UI.
- **Scripted import**: CLI/node script that parses waiver export and writes `guests` docs.

Critical requirement:
- store `booking_id` from waiver export as `bookingId` in Firestore.

## Reconciliation Logic

Given:
- `expectedBookings` from Checkfront (`bookingId`s)
- `guests` imported from waiver system

Compute:

### A) Missing waivers
Bookings with 0 guests:
- `expectedBookingIds` minus the set of `bookingId`s present in guests.

Display as:
- booking code
- customer name/email
- status
- date description

### B) Unmatched waivers
Guests whose `bookingId` is not in `expectedBookingIds`.

Common causes:
- old waiver reused
- typo in booking id
- waiver belongs to a different date/product

### C) Partial matches
Bookings that exist in both but with fewer guests than expected.

Note:
- Checkfront index alone may not provide guest count. If needed later, we can query a booking detail endpoint by `booking_id` to get line items/guest counts.

## UI Proposal (Manual-First)

Building the UI as manual-first is **not a bad idea**, as long as we design the boundaries cleanly.

### Why manual-first can be good
- You can validate the operational workflow (what screens you need, what data you actually use) before committing to API details.
- You can ship value earlier (manual scheduling, manual reconciliation).

### What to avoid
- Hard-coding mock data structures that don’t match the future Firestore/API model.
- Mixing “data fetching + reconciliation + UI state” in one component without clear interfaces.

### Recommended UI slices

1) **Manifest Builder (date + products)**
- Pick date
- Pick “products” (later maps to Checkfront `item_id`s)
- Fetch bookings (manual stub first, then API)

2) **Reconciliation Panel**
- Counts: bookings found, guests matched, missing bookings, unmatched guests
- Tables:
  - Missing bookings (bookings with no guests)
  - Unmatched guests

3) **Search & Fix**
- Search bookings by `bookingId`, `code`, `email`
- Actions:
  - assign/correct a guest’s `bookingId`
  - mark booking as exception
  - create a placeholder guest

4) **Taxi Scheduler**
- Works off the reconciled guest list
- Auto-assign taxis using:
  - `taxi.priority` (lower is preferred)
  - capacity

## Phased Rollout

### Phase 0 — Manual UX prototype
- UI works with:
  - manually uploaded guests
  - manually entered “expected bookings” count or manually pasted booking IDs

### Phase 1 — Checkfront bookings index sync
- Cloud Function fetches bookings index for date + item_ids
- Persist `checkfrontBookings`
- UI uses real expected bookings list

### Phase 2 — Booking detail enrichment (optional)
- For missing guest counts, query booking details per bookingId (as-needed)

### Phase 3 — Automation + polishing
- Incremental refresh via `last_modified`
- Better exceptions handling
- Better reporting/export

## Open Questions
- What `status_id` values count as operational bookings?
- How will the user select `item_id`s in the UI?
  - hardcoded config
  - Firestore mapping collection
  - admin UI
- Do we need per-booking guest count from Checkfront (booking detail endpoint)?
- Should taxi assignments attach to `guestId`, `bookingId`, or both?

## Acceptance Criteria (first integrated milestone)
- For a selected date and selected products:
  - system fetches bookings index and stores it
  - system shows missing bookings and unmatched guests
  - user can fix bookingId mismatches
  - taxi scheduler can auto-assign taxis using priority and capacity
