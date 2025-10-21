<!-- .github/copilot-instructions.md -->
# Quick instructions for AI coding agents

These notes help an AI agent be immediately productive in the ContractBuilder repo (frontend: `contract_builder/`). Keep suggestions specific, small, and constrained to the project's patterns.

- Project type: Next.js (App Router) + TypeScript frontend in `contract_builder/`. Firebase (Firestore/Auth) is the primary backend (no server-side REST API in this repo).
- Run & test: use npm scripts in `contract_builder/package.json` (dev: `npm run dev`, build: `npm run build`, test: `npm run test`).

Key patterns and important files
- Firebase client initialization: `src/lib/firebase.ts`. Use env vars starting with `NEXT_PUBLIC_FIREBASE_*` for keys.
- Auth / roles: `src/context/AuthContext.tsx` — onAuthStateChanged is used; user roles are read from Firestore `users/{uid}`. Default role is `viewer`.
- Routing: Next.js App Router. Import navigation hooks from `next/navigation` not `next/router`.
- Contracts UI: Wizard flow implemented in `src/app/contracts/GroupContractWizard.tsx`. Steps are separate components: `GroupContractForm`, `RoomSelectionForm`, `DivePackageSelectionForm`, `MealPackageSelectionForm`, `TotalCostCalculation`.

Project-specific conventions
- Keep client code under `src/app` and `src/components`. Server-like or shared utility code lives in `src/lib`, `src/services`, and `src/utils`.
- Components follow small, single-responsibility patterns (see the contract wizard step components). When adding a step, export a component that accepts `onNext`, `onBack`, `onCancel`, and `initial*` props where relevant.
- Firebase reads/writes use Firestore modular SDK (import from `firebase/firestore`). Follow existing `services/*.ts` helpers for reads/writes.
- Default role handling: if no user document exists, code assumes role `'viewer'` — preserve this behavior when changing auth flows.

Testing and linting
- Tests run with Vitest (`npm run test`). There are unit/mocks under `tests/` and `contract_builder/src/utils/__tests__/`.
- Lint via `npm run lint` (Next's ESLint config).

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
