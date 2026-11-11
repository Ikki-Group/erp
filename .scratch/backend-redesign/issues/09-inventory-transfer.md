# 09: Inventory transfer

**What to build:** A store requests materials, warehouse staff ship them (stock leaves source), and the destination receives them (stock arrives at source cost) — a two-step flow that models goods in transit.

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] Transfer request CRUD (`handle*`, RBAC): header (from/to location, status) + lines; can't transfer to same location; both locations must have the material assigned (ADR-0009, 0011).
- [ ] Ship (requested → in_transit), one UoW: check source has sufficient stock (transfer-out still checks, ADR-0006), `recordMovement(transfer_out)` carrying source cost, reduce source (ADR-0010, 0011).
- [ ] Receive (in_transit → received), one UoW: `recordMovement(transfer_in)` using source cost, add destination (permissive) (ADR-0010, 0011).
- [ ] Cancel only from requested (before any stock moved).
- [ ] Integration test: ship then receive moves cost correctly; goods in transit are in no balance; ship blocked on insufficient source stock; `verify` + `test` pass.
