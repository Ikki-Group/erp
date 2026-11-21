# 04: Master Data (Material, UoM chain, Supplier, assignment)

**What to build:** A global material catalog assigned to locations, a UoM chain that resolves multi-hop conversions, and suppliers with reference prices — the reference data everything downstream consumes.

**Blocked by:** 03.

**Status:** ready-for-agent

- [ ] Material CRUD (`handle*`, RBAC): global catalog, unique code, `type` raw/semi_finished, base UoM + optional default purchase/stock/recipe UoMs (must be convertible), `minStock`; soft-delete; no delete while stock ≠ 0 anywhere; no cost field (ADR-0009).
- [ ] Material→location assignment: hard constraint for receiving/transfer; removal blocked while stock ≠ 0 (ADR-0009).
- [ ] UoM + conversions CRUD; conversions within one category, factor > 0; resolution via the pure `Qty` resolver from ticket 01; system UoMs undeletable (ADR-0009).
- [ ] Supplier + supplier-material reference price CRUD; soft-delete (ADR-0009).
- [ ] Unit tests (UoM chain resolution, assignment rules) + integration; `verify` + `test` pass.
