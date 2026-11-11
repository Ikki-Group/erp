## Problem Statement

Two POS/inventory screens lie to the user about money and about filtered results.

- On the four list screens with a date-range control — POS **Orders**, inventory **Transfers**, **Opname**, and **Receiving** — the date filter only narrows the rows already on the current page. The server never receives a date range, so pagination and the total count reflect the *unfiltered* dataset. Pick a date range and the table shows a subset of one page while the pager insists there are more; cross a page boundary and matching rows silently vanish. The filter looks like it works and does not.
- On the POS **new-order** screen, the cashier's running total is computed on the client from a hard-coded `TAX_RATE = 0.11` using JS `number` math. The server is authoritative for order money (it recomputes `subtotal`/`taxAmount`/`total` with the real company tax rate on every line change) — so the number the cashier sees can drift from the number the server records whenever the tax rate, rounding, or discount ordering differs.

## Solution

- Make the four date filters real: the server accepts a date range on each list endpoint and filters at the source, so the returned page and its total count both honour the range. The client stops post-filtering rows it already received.
- Make the client stop computing money. The new-order screen displays the totals the server returns, with an honest pending state before the first sync. The hard-coded tax rate and the client-side arithmetic are deleted, not patched. (See ADR-0017.)

## User Stories

1. As a cashier reviewing today's sales, I want the Orders date filter to return every matching order across all pages, so that the list and its count reflect the range I chose, not just the current page.
2. As a warehouse manager, I want the Transfers date filter to query the server, so that filtering by last week returns all of last week's transfers regardless of pagination.
3. As a warehouse manager, I want the Opname date filter to be server-backed, so that a date range narrows the whole result set and the pager stays truthful.
4. As a purchaser, I want the Receiving date filter to be server-backed, so that filtering by received date returns the complete, correctly-counted set.
5. As any user of a filtered list, I want the total count and page controls to agree with the active date filter, so that I can trust the pager.
6. As any user, I want a date range combined with the existing status/search/supplier filters to compose correctly on the server, so that filters narrow together rather than fighting each other.
7. As a cashier building an order, I want the displayed total to be the amount the server will actually charge, so that the receipt never surprises me or the customer.
8. As a cashier, I want tax applied at the company's configured rate rather than a value baked into the app, so that a tax-rate change takes effect everywhere at once.
9. As a cashier, I want an honest "calculating" state for the total before the cart has synced, so that I am never shown a confident but wrong number.
10. As a developer, I want a single server-side way to express a created-at/ordered-at date range on list endpoints, so that the four screens share one pattern instead of four client-side hacks.
11. As a developer, I want the client-side total math and the hard-coded tax constant removed entirely, so that there is no second source of truth for money to drift or rot.

## Implementation Decisions

- **Date-range contract, server-side.** Add optional `dateFrom`/`dateTo` (coerced date) to the four list contracts: `OrderFilterDto` (POS order), `TransferFilterDto`, `OpnameFilterDto`, `ReceivingFilterDto`. Mirror the exact shape already proven on `AuditLogFilterDto`, which carries `dateFrom`/`dateTo` today — this is a copy of an existing pattern, not a new invention.
- **Filter field per module.** Orders filter on `orderedAt`; transfers/opname/receiving filter on `createdAt`. (These are the fields already exposed on each detail DTO.)
- **Repo does the filtering.** Each module's list repo applies the range with Drizzle `gte`/`lte` on the chosen column, composed with the existing status/search/supplier predicates. The service passes the new params through unchanged; no business logic beyond wiring.
- **Web FilterDto mirrors the server.** Add `dateFrom`/`dateTo` to the four web-side FilterDtos so the `defineQuery` calls send them as query params. The route toolbars already own a `dateRange` state — it now feeds the query params instead of a local array filter.
- **Delete the client-side date `.filter()`** blocks on all four routes (the `useMemo` that slices `rawData` by `dateRange`). No backward-compat path.
- **Tax/money (ADR-0017).** Delete `TAX_RATE` and the client `subtotal`/`taxAmount`/`total` computation in new-order. Render the server-returned order totals from the synced order / order detail. Show a pending state for the total until the cart's first line-sync completes. The catalog per-item price (from the menu-item DTO) is still shown while browsing — that is a server-provided price, not client arithmetic.
- **No new endpoints, no new modules.** All changes extend existing contracts/repos and simplify existing routes.

## Testing Decisions

- **Good test = external behaviour.** Assert on what a caller observes through the HTTP boundary (returned rows, total count, computed totals), never on repo internals or query builders.
- **Primary seam: server HTTP integration tests** (`apps/server/src/tests/integration/`), the established high seam that drives real routes with seeded data via the `POST`/`GET`/`json` + `loginAs` + `seed` helpers. Prior art: `pos-order.test.ts`, `inventory-stock.test.ts`, `audit.test.ts`.
  - Date range: seed rows straddling two dates, request with `dateFrom`/`dateTo`, assert both the returned page and the pagination total reflect the range, and that range composes with status/search. One test group per module (order, transfer, opname, receiving).
  - Tax/money: extend `pos-order.test.ts` to assert the order's `taxAmount`/`total` after line-sync match the company tax rate through `calculateOrderTotals` — proving the value the client will display is server-produced. Pure math stays covered by the existing `unit/order-calculator.test.ts`.
- **No new web unit seam.** The web change is a deletion plus reading server fields; the existing `apps/web/src/lib/api/*.test.ts` and `features/pos/api.test.ts` already cover the query/endpoint layer that now carries the extra params.
- **Environment caveat.** Server integration tests require a test database (`NODE_ENV=test` + a `test-user` `DATABASE_URL`, per `scripts/db-scripts-helper.ts`). Tests are written regardless; running them here depends on that DB being provisioned. If unavailable, the tests are still committed and must pass in CI.

## Out of Scope

- Server-side aggregation endpoints (revenue-over-time, category sales) — belongs to the dashboard spec / its own follow-up.
- Any Production module web surface.
- Presets or relative ranges ("last 7 days") on the date filters — this spec delivers an absolute `from`/`to` range only.
- Changing how money is computed on the server (the calculator is already correct); this spec only stops the client from recomputing it.

## Further Notes

- No backward compatibility required: delete the client-side filter/tax code outright rather than leaving fallbacks.
- ADR-0017 (the web client never recomputes money) is the durable decision behind the tax change; keep the new-order implementation consistent with it.
- `AuditLogFilterDto` is the reference implementation for the date-range params — read it before adding the four new ones.
