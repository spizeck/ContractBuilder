<!-- .github/copilot-instructions.md -->
# Quick instructions for AI coding agents

These notes help an AI agent be immediately productive in the ContractBuilder repo (frontend: `contract_builder/`). Keep suggestions specific, small, and constrained to the project's patterns.

- Project type: Next.js (App Router) + TypeScript frontend in `contract_builder/`. Firebase (Firestore/Auth) is the primary backend (no server-side REST API in this repo).
- Run & test: use npm scripts in `contract_builder/package.json` (dev: `npm run dev`, build: `npm run build`, test: `npm run test`).

Why this matters (beginner-friendly):
- Next.js App Router organizes pages and layouts under `src/app`. It affects how routing and server/client boundaries work — components under `app` can be server or client components depending on `'use client'` and imports. Use `next/navigation` for client-side navigation.
- Firebase is used only as a cloud-hosted backend (Auth + Firestore). There is no separate Node server in this repo, so security and rules are enforced via Firestore Security Rules and server-side functions (outside this repo) if needed.

Key patterns and important files
- Firebase client initialization: `src/lib/firebase.ts`. Use env vars starting with `NEXT_PUBLIC_FIREBASE_*` for keys.
- Auth / roles: `src/context/AuthContext.tsx` — onAuthStateChanged is used; user roles are read from Firestore `users/{uid}`. Default role is `viewer`.
- Routing: Next.js App Router. Import navigation hooks from `next/navigation` not `next/router`.
- Contracts UI: Wizard flow implemented in `src/app/contracts/GroupContractWizard.tsx`. Steps are separate components: `GroupContractForm`, `RoomSelectionForm`, `DivePackageSelectionForm`, `MealPackageSelectionForm`, `TotalCostCalculation`.

Why these patterns exist:
- Centralized `firebase.ts` keeps initialization in one place so components import `db`/`auth` safely without re-initializing Firebase.
- `AuthContext` centralizes authentication state and role resolution so every component can read `role` and `loading` consistently instead of duplicating logic.
- The wizard splits responsibilities into small components so UI complexity and business logic (room/dive/meal calculations) live close to the UI that needs them. This also makes testing each step straightforward.

Project-specific conventions
- Keep client code under `src/app` and `src/components`. Server-like or shared utility code lives in `src/lib`, `src/services`, and `src/utils`.
- Components follow small, single-responsibility patterns (see the contract wizard step components). When adding a step, export a component that accepts `onNext`, `onBack`, `onCancel`, and `initial*` props where relevant.
- Firebase reads/writes use Firestore modular SDK (import from `firebase/firestore`). Follow existing `services/*.ts` helpers for reads/writes.
- Default role handling: if no user document exists, code assumes role `'viewer'` — preserve this behavior when changing auth flows.

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
- No server-side config in this repo; Firebase credentials must be provided in `.env.local` for local dev. See README for the required `NEXT_PUBLIC_FIREBASE_*` vars.
- PDF generation and exports are implemented in the frontend (see `src/app/contracts/TotalCostCalculation.tsx` and related utils) — avoid adding heavy backend dependencies for PDF unless the change explicitly requires it.

When making changes, prefer:
- Small, iterative PRs that update one area (UI, service, or utils) at a time.
- Reuse `services/*` functions for Firestore access. Add new helpers there instead of direct reads/writes from components.

Examples to reference when coding or reviewing
- To fetch the current user's role: `src/context/AuthContext.tsx` (doc get on `users/{uid}`).
- To add a contract wizard step: mirror the props & state pattern used in `src/app/contracts/GroupContractWizard.tsx`.
- Firebase init: `src/lib/firebase.ts` — use `auth` and `db` exports.

If you need more detail
- Inspect `README.md` for feature-level overview and `contract_builder/package.json` for scripts and deps.
- Ask for missing env values (Firebase) or the preferred PDF approach before adding server-side services.

Be conservative: modify data shapes only when you update all callers (services, forms, and tests). Prefer adding deprecations and migration steps rather than silent breaking changes.

---
If anything here is unclear or you want additional examples (e.g., common Firestore queries, form validation helpers, or sample tests), tell me which area and I will expand the file.
