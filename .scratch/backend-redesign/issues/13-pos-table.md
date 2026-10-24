# 13: POS table

**What to build:** Dine-in tables with a status that reflects whether they hold an open order, and the ability to move an order between tables.

**Blocked by:** 03.

**Status:** ready-for-agent

- [ ] Table CRUD (`handle*`, RBAC `table.manage`): per-location, unique number within location, status available/occupied/reserved (ADR-0013).
- [ ] One open order per table (partial unique) (ADR-0006, 0013).
- [ ] Status changes driven by a domain event (non-critical): occupied when an order links, available when it completes/voids (ADR-0002, 0013).
- [ ] Move: reassign an order to another table (old → available, new → occupied). Merge is backlogged (ADR-0013).
- [ ] Exposes table lookup/link via `Api` for orders (ticket 15).
- [ ] Integration test: move updates both tables; one-open-order invariant holds; `verify` + `test` pass.
