# 03: Dashboard real data (honest subset)

**Parent:** Spec B (#48)

**What to build:** The dashboard shows real figures for the active location instead of hardcoded arrays. Metrics that existing endpoints can serve are wired; metrics that need future server aggregation are clearly marked coming-soon rather than faked.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Stat cards — today's orders, today's revenue, low-stock count, active shifts — show real data for the active location. Money figures come from server responses, never client computation (ADR-0017); if a total isn't available from a list response, that card is marked coming-soon.
- [ ] Low-stock panel lists materials below minimum at the active location (from `stockBalanceList`).
- [ ] Active-shifts figure reflects genuinely open shifts (from `shiftResource`).
- [ ] Recent-activity panel renders real recent audit entries (from `auditResource.list`).
- [ ] 7-day revenue trend and category-sales breakdown render an explicit coming-soon/empty state (no fabricated data).
- [ ] Every hardcoded data array in the dashboard file is deleted.
- [ ] Switching location updates the dashboard to the newly-active location.
- [ ] Loading, empty, and error states use the standard primitives (`ui/skeleton`, `ui/empty`, inline error).
