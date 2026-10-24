# 06: Menu & Recipe

**What to build:** A per-location menu (items, categories, modifier groups/options) and one active recipe per item, plus an enriched item-detail read POS uses to build order lines with price snapshots.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Menu item / category / modifier-group / modifier-option CRUD (`handle*`, RBAC), all per-location, store-only; SKU unique within a location; modifier-group many-to-many with items within the same location (ADR-0012).
- [ ] Modifiers affect price only (Phase-1 boundary): options carry `priceAdjustment`, no recipe (ADR-0012).
- [ ] Recipe/BOM: exactly one active recipe per item (partial unique); lines reference global materials with UoM convertible to base; deleting a material used by an active recipe is blocked (ADR-0012).
- [ ] Enriched `itemDetail` read (item + groups + options + prices) exposed via `Api` for POS; supports order-line price snapshotting (ADR-0012).
- [ ] HPP surfaced per item using the ticket-05 calculator.
- [ ] Unit tests (modifier price math) + integration; `verify` + `test` pass.
