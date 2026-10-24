## Problem Statement

Three gaps sit on top of an otherwise fully-wired web app:

- The **dashboard** (`_authenticated/index.tsx`) is entirely hardcoded — revenue chart, category sales, low-stock list, stat cards, and recent activity are all literal arrays. It is self-labelled placeholder content. A user landing on the home screen sees numbers that mean nothing.
- An **audit-log browser** was scaffolded at the API layer — `auditResource.list` and `auditResource.detail` are defined — but no page consumes them. Only the per-entity timeline (`byEntity`) is wired. The result is defined-but-unused endpoints (dead surface) and no way to answer "who changed what across the whole system?"
- The wired screens grew over time and drift in the small stuff: loading/empty/error states, table density, form layout, dark-mode parity. There is now a design steering file (`ikki-design`) and shadcn skills to measure against, but no punch-list of where screens fall short.

## Solution

- Replace the dashboard's hardcoded content with real data from endpoints that already exist, wiring the honest subset now and clearly marking the metrics that need future server aggregation.
- Build a filterable audit-log browser route that consumes the already-defined `auditResource.list`/`detail`, retiring the dead endpoints by using them.
- Produce a concrete UI-consistency punch-list from an audit of the wired screens against the `ikki-design` steering, and land the high-value fixes.

## User Stories

1. As an owner opening the app, I want the dashboard stat cards (today's orders, today's revenue, low-stock count, active shifts) to show real figures for my active location, so that the home screen is a true operational snapshot.
2. As a manager, I want the low-stock panel to list materials actually below their minimum at my location, so that I know what to restock without opening the inventory screen.
3. As a manager, I want the active-shifts figure to reflect the shifts genuinely open now, so that I can see who is on duty.
4. As a manager, I want the recent-activity panel to show real recent audit entries, so that it reflects what actually happened, not sample text.
5. As a user, I want any dashboard metric that cannot yet be computed (7-day revenue trend, category sales) to be clearly marked as coming soon rather than shown as fake data, so that I never mistake a placeholder for a real number.
6. As a user switching location, I want the dashboard to reflect the newly-active location, so that the snapshot follows my context.
7. As an owner or auditor, I want a dedicated audit-log page listing every recorded mutation, so that I can review system activity in one place.
8. As an auditor, I want to filter the audit log by module, entity, user, action, and date range, so that I can find the changes I care about.
9. As an auditor, I want to open an audit entry and see its old/new values and actor, so that I can understand exactly what changed.
10. As an auditor, I want the audit-log page gated by the `audit.read` permission, so that only authorised roles can review it.
11. As any user, I want list screens to show skeleton rows while loading, a composed empty state when there is nothing, and an inline error when a fetch fails, so that no screen shows a bare spinner or a blank void.
12. As any user, I want forms to follow one layout (label above input, helper/error below) and buttons that name their action, so that every form behaves the same way.
13. As any user, I want consistent table density, spacing, and dark-mode contrast across screens, so that the app feels like one product rather than several.

## Implementation Decisions

- **Dashboard — wire the honest subset from existing endpoints only.**
  - Low-stock: `stockBalanceList` filtered to balances below minimum for the active location.
  - Active shifts: `shiftResource.list` (or active) scoped to the active location.
  - Recent activity: `auditResource.list` (most-recent page), rendered as the activity feed.
  - Today's orders / today's revenue: `orderResource.list` for the day; use the total the list provides. If a needed total is not available from the list response, treat that card as a "coming soon" metric rather than computing money on the client (ADR-0017).
  - **Coming-soon, explicitly marked:** 7-day revenue trend and category-sales breakdown are true aggregations with no endpoint today. Render them as an explicit empty/coming-soon state, not fabricated data. Server aggregation endpoints are a separate follow-up.
  - Delete every hardcoded array in the dashboard file. No placeholder data left behind.
- **Audit-log browser — new route, existing endpoints.**
  - Add a list route under settings (e.g. `settings/audit`) using the standard `useServerTable` + URL-state pattern that every other list route follows.
  - Consume `auditResource.list` for the table and `auditResource.detail` for a row's old/new values. `AuditLogFilterDto` already supports `q`, `module`, `entity`, `entityId`, `userId`, `action`, `dateFrom`, `dateTo` — surface these as toolbar filters.
  - Gate the route on `audit.read` (the permission already exists in the IAM matrix). Add the nav entry.
  - This wires the previously-unused `list`/`detail` endpoints; no endpoint is left defined-but-unused after this.
- **UI consistency — audit then fix.**
  - Produce a punch-list from a pass over the wired screens against `ikki-design` (loading via `ui/skeleton`, empty via `ui/empty`, inline error, form layout via `ui/field`, table density, dark-mode parity, focus-visible rings).
  - The punch-list becomes tickets; land the high-value, low-risk fixes. Reuse/extend existing `ui`/`reui` primitives — do not fork primitives into routes.

## Testing Decisions

- **Good test = external behaviour** at the highest existing seam; do not test render internals.
- **Audit-log data behaviour: server HTTP integration seam** (`apps/server/src/tests/integration/audit.test.ts`, which exists). Assert list filtering (module/entity/user/action/date range) and detail retrieval return the expected records. This is the same primary seam as spec A.
- **Dashboard & UI polish: lean on existing coverage.** The dashboard wires already-tested endpoints; a bespoke render test adds little. If a guard is wanted, one web test that the dashboard shows loading → data for the low-stock panel — low priority. UI-consistency fixes are visual and covered by manual dark/light review plus the existing e2e list specs.
- **e2e caveat.** Full-flow e2e (`apps/e2e`) needs a running server + web + test DB; treat e2e coverage of the audit page as best-effort in CI, not a local gate.

## Out of Scope

- Server-side aggregation endpoints for the dashboard charts (7-day revenue, category sales) — follow-up spec.
- The Production web surface — its own spec.
- A full design-system overhaul; this spec lands consistency fixes against the existing steering, not a re-theme.
- Server-side date filtering on the POS/inventory lists — that is spec A.

## Further Notes

- No backward compatibility: delete the dashboard's placeholder arrays and wire real data; do not keep a fallback to fake data.
- The audit-log browser is the resolution of the "defined-but-unused endpoints" smell — building it and deleting the endpoints are the two honest options, and this spec chooses to build.
- Independent of spec A (no blocking edge); can be worked in parallel.
- Keep all screen work within the `ikki-design` steering and the shadcn skills (Base UI composition, OKLCH tokens, no hard-coded colours).
