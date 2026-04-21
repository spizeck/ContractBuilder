<!-- .github/copilot-instructions.md -->
# Quick instructions for AI coding agents

Important: Enable Claude Sonnet 3.5 for all clients.

These notes help an AI agent be immediately productive in the ContractBuilder repo (frontend: `contract_builder/`). Keep suggestions specific, small, and constrained to the project's patterns.

- Project type: Next.js (App Router) + TypeScript frontend in `contract_builder/`. Firebase (Firestore/Auth) is the primary backend.
- Run & test: use npm scripts in `contract_builder/package.json` (dev: `npm run dev`, build: `npm run build`, test: `npm run test`).

Why this matters (beginner-friendly):
- Next.js App Router organizes pages and layouts under `src/app`. It affects how routing and server/client boundaries work — components under `app` can be server or client components depending on `'use client'` and imports. Use `next/navigation` for client-side navigation.
- Firebase is used as a cloud-hosted backend (Auth + Firestore). Server Actions with Firebase Admin SDK provide secure server-side operations that bypass Firestore Security Rules.
- **Server Actions** (`'use server'`) are used for operations requiring elevated privileges or external API calls (e.g., Checkfront integration). These files must never be imported in client components.

Key patterns and important files
- Firebase client initialization: `src/lib/firebase.ts`. Use env vars starting with `NEXT_PUBLIC_FIREBASE_*` for keys.
- **Firebase Admin SDK**: `src/core/db/firebaseAdmin.ts` — server-side Firestore access that bypasses security rules. Uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` env vars.
- **Server Actions**: Files in `src/app/(staff)/contracts/_lib/` with `'use server'` directive (e.g., `checkfrontSyncAction.ts`, `checkfrontDryRunAction.ts`, `checkfrontServerRepos.ts`).
- **Checkfront Integration**: `src/lib/integrations/checkfront.ts` — core API client for external booking system. Uses `CHECKFRONT_API_KEY`, `CHECKFRONT_API_SECRET`, `CHECKFRONT_HOST` env vars.
- Auth / roles: `src/context/AuthContext.tsx` — onAuthStateChanged is used; user roles are read from Firestore `users/{uid}`. Default role is `viewer`.
- Routing: Next.js App Router. Import navigation hooks from `next/navigation` not `next/router`.
- Contracts UI: Wizard flow implemented in `src/app/contracts/GroupContractWizard.tsx`. Steps are separate components: `GroupContractForm`, `RoomSelectionForm`, `DivePackageSelectionForm`, `MealPackageSelectionForm`, `TotalCostCalculation`.

Why these patterns exist:
- Centralized `firebase.ts` keeps initialization in one place so components import `db`/`auth` safely without re-initializing Firebase.
- `AuthContext` centralizes authentication state and role resolution so every component can read `role` and `loading` consistently instead of duplicating logic.
- The wizard splits responsibilities into small components so UI complexity and business logic (room/dive/meal calculations) live close to the UI that needs them. This also makes testing each step straightforward.

Project-specific conventions
- Keep client code under `src/app` and `src/components`. Server-like or shared utility code lives in `src/lib`, `src/services`, and `src/utils`.
- Server Actions (`'use server'`) go in `src/app/**/_lib/` directories (e.g., `checkfrontSyncAction.ts`).
- **Never import Server Action files in client components** — call them via the action pattern instead.
- Components follow small, single-responsibility patterns (see the contract wizard step components). When adding a step, export a component that accepts `onNext`, `onBack`, `onCancel`, and `initial*` props where relevant.
- Firebase reads/writes use Firestore modular SDK (import from `firebase/firestore`). Follow existing `services/*.ts` helpers for reads/writes.
- **Server-side Firestore**: Use `getAdminDb()` from `src/core/db/firebaseAdmin.ts` in Server Actions to bypass security rules.
- Default role handling: if no user document exists, code assumes role `'viewer'` — preserve this behavior when changing auth flows.

Server Actions and external integrations
- Server Actions are the preferred pattern for:
  - External API calls (Checkfront, payment processors)
  - Operations requiring elevated Firestore privileges (bypassing security rules)
  - Any logic that must keep credentials server-side
- Example Server Action structure:
  ```typescript
  'use server'
  import { getAdminDb } from '@/core/db/firebaseAdmin'
  
  export async function myServerAction(data: FormData) {
    const db = getAdminDb()
    // Perform elevated operations
  }
  ```
- External API credentials (Checkfront keys, etc.) use env vars **without** `NEXT_PUBLIC_` prefix to keep them server-side.
- Checkfront integration uses printf-style logging (`console.log('%s', value)`) for CodeQL compliance — avoid template literals in console statements.

Permissions & multi-hotel considerations (recommended and discoverable patterns):
- Current `users/{uid}` documents store at least a `role` field. To support module-level access and per-hotel visibility, extend the user doc with two optional arrays:
	- `modules: string[]` (e.g., `['contracts','hotels','dives']`) — controls which app modules a user can access.
	- `hotelIds: string[]` (e.g., `['hotel_abc','hotel_xyz']`) — empty or missing means access to all hotels; otherwise restrict UI and queries to these ids.
- Enforce access in two places:
	1. `AuthContext.tsx` — read `modules` and `hotelIds` and expose them via context so components can hide UI quickly.
	2. Services & Firestore queries — include `where('hotelId','in', hotelIds)` or explicit filters so users can't see other hotels even if they try to call an endpoint directly.
- Why: UI-only checks are convenient but insufficient. Always pair with query-level restrictions and Firestore Security Rules (not in this repo) to protect data.

Testing and linting
- Tests run with Vitest (`npm run test`). There are unit/mocks under `tests/` and `contract_builder/src/utils/__tests__/`.
- Lint via `npm run lint` (Next's ESLint config).

PDF printing and finalization notes (concrete, discoverable guidance):
- Current PDF export is planned in `src/app/contracts/TotalCostCalculation.tsx` and related utilities. Because this is a client-side app, preferred approaches are:
	- jsPDF (lightweight, programmatic PDF creation) — good for simple table-based PDFs.
	- react-pdf or @react-pdf/renderer — use JSX-like templates; better for complex layouts.
- Recommended flow:
 1. When user confirms a contract, save the finalized contract document to Firestore (e.g., `contracts/{contractId}`) with a `status: 'final'` timestamped field.
 2. Generate the PDF from the stored document (client can read it back or generate immediately from the in-memory contract data). Persist the PDF to Firebase Storage if you want a downloadable permanent copy.
3. Why: persisting the contract ensures the printable PDF matches what was saved and provides a permanent record for accounting/archival.
- Keep the UI responsive: show a spinner while saving, and handle failures (save failed, PDF generation failed) with clear messages and retry options.

Integration & deployment notes
- Firebase credentials must be provided in `.env.local` for local dev. See README for the required `NEXT_PUBLIC_FIREBASE_*` vars.
- **Firebase Admin SDK** requires additional env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` for server-side operations.
- **Checkfront integration** requires: `CHECKFRONT_API_KEY`, `CHECKFRONT_API_SECRET`, `CHECKFRONT_HOST`.
- Server Actions with Admin SDK work in local dev and Vercel deployments. Ensure env vars are set in deployment platform.
- PDF generation and exports are implemented in the frontend (see `src/app/contracts/TotalCostCalculation.tsx` and related utils) — avoid adding heavy backend dependencies for PDF unless the change explicitly requires it.

When making changes, prefer:
- Small, iterative PRs that update one area (UI, service, or utils) at a time.
- Reuse `services/*` functions for Firestore access. Add new helpers there instead of direct reads/writes from components.

Examples to reference when coding or reviewing
- To fetch the current user's role: `src/context/AuthContext.tsx` (doc get on `users/{uid}`).
- To add a contract wizard step: mirror the props & state pattern used in `src/app/contracts/GroupContractWizard.tsx`.
- Firebase init: `src/lib/firebase.ts` — use `auth` and `db` exports.
- **Server Action pattern**: `src/app/(staff)/contracts/_lib/checkfrontSyncAction.ts` — shows `'use server'`, Firebase Admin usage, error handling.
- **Server-side Firestore repo**: `src/app/(staff)/contracts/_lib/checkfrontServerRepos.ts` — shows Admin SDK database operations with logging.
- **External API client**: `src/lib/integrations/checkfront.ts` — shows API client with printf-style logging for CodeQL compliance.

If you need more detail
- Inspect `README.md` for feature-level overview and `contract_builder/package.json` for scripts and deps.
- Ask for missing env values (Firebase) or the preferred PDF approach before adding server-side services.

Be conservative: modify data shapes only when you update all callers (services, forms, and tests). Prefer adding deprecations and migration steps rather than silent breaking changes.

## Addendum (2025-10-27)

### CodeQL and Security Compliance
- **Format String Safety**: Use printf-style logging (`console.log('%s', value)`) instead of template literals (`console.log(`value: ${value}`)`) in all files.
- CodeQL flags template literals in `console.log/warn/error` as "Use of externally-controlled format string" vulnerabilities.
- **Pattern**: Static format string + separate arguments:
  ```typescript
  // ✅ Correct (CodeQL compliant)
  console.log('[Checkfront] Contract: %s (%s)', contract.name, contract.id)
  console.error('[Checkfront] Error: %O', error)
  
  // ❌ Incorrect (CodeQL alert)
  console.log(`[Checkfront] Contract: ${contract.name}`)
  ```
- Apply this pattern consistently across all TypeScript files, especially in:
  - `src/lib/integrations/checkfront.ts`
  - `src/app/(staff)/contracts/_lib/*.ts`
  - `src/core/db/firebaseAdmin.ts`

### Chakra UI and Color Mode
- Place ColorModeScript as the first child of <body> in app/layout.tsx to avoid hydration mismatches.
- Use useColorModeValue for backgrounds, borders, and hover states; avoid hard-coded white in dark mode.
- When creating sticky headers or toolbars, set bg and border via useColorModeValue and prefer zIndex="base" unless a Portal is needed.
- For testing, ThemeToggle can be placed in NavLinks; comment it out for production.

Next.js App Router and Hydration
- Avoid invalid DOM nesting (e.g., no div or span directly inside tbody; no nested buttons).
- Remove stray {" "} nodes in tables to prevent hydration errors.
- Client hooks only in 'use client' components. Await params in dynamic server components if used.
- Prefer TableContainer with a flex layout: page h="100vh", outer overflow="hidden", inner table wrapper flex="1" overflow="auto".

Firestore and Types
- Dates stored as Firestore Timestamps; convert to JS Date in services.
- MaintenanceLog should include technicianId, technicianName, summary, details, hoursAtService, nextServiceDue, cost, createdBy, updatedAt.
- Asset categories limited to: Marine, Compressors, Vehicles, Scuba Equipment, Other. Categories apply only to parent assets; children inherit parent category.

Maintenance UI Conventions
- Assets page: filters fixed at top, table scrolls; category select uses the canonical list; search filters by name.
- Dashboard header: color-mode-aware bg/border; low zIndex to avoid covering navbar dropdowns.
- TechnicianActivity: render Tr rows directly inside Tbody; place Tooltip inside Td; row click filters/opens technician activity.

Forms
- Disable autofill where needed: form autoComplete="off" and hidden username/password fields to discourage browser autofill.
- Avoid nested interactive elements (no IconButton inside Button).
