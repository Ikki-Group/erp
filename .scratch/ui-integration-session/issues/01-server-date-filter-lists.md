# 01: Server-side date-range filter across POS/inventory lists

**Parent:** Spec A (#47)

**What to build:** A date-range filter that actually filters at the server on all four list screens — POS Orders, inventory Transfers, Opname, and Receiving. Picking a `from`/`to` range returns every matching row across all pages, and the pagination total reflects the range. The client stops post-filtering rows it already received.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `dateFrom`/`dateTo` (coerced date, optional) added to the four server list contracts: order, transfer, opname, receiving — mirroring the shape already on `AuditLogFilterDto`.
- [ ] Each list repo applies the range with Drizzle `gte`/`lte`: orders on `orderedAt`; transfers/opname/receiving on `createdAt`. Composes with existing status/search/supplier predicates.
- [ ] The four web-side FilterDtos gain `dateFrom`/`dateTo`; the route toolbars' existing `dateRange` state feeds the query params.
- [ ] The client-side date `.filter()` (`useMemo` slicing `rawData`) is deleted on all four routes. No fallback.
- [ ] Server HTTP integration tests (one group per module): seed rows straddling two dates, request with a range, assert both the returned page and the pagination total honor it, and that the range composes with status/search.
- [ ] Range with no matches returns an empty page with a correct zero count (not a full unfiltered page).
