# 11: Production (semi-finished items)

**What to build:** Staff produce semi-finished materials (e.g. Gula Cair) from other materials via a production order that atomically consumes inputs and produces output, deriving the output's cost from the inputs.

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] Production recipe CRUD: one active per semi_finished material (partial unique); inputs any type (nested allowed), UoM convertible to base (ADR-0014).
- [ ] Production order (`handle*`, RBAC): `PRD-...` numbering; draft → completed/cancelled (ADR-0008, 0014).
- [ ] completeProduction (one UoW via recordMovement): consume inputs (`production_out`, permissive — sale rule); produce output (`production_in`) with cost = Σ(input consumed × input cost) / actualQty; output material must be assigned (ADR-0014).
- [ ] Unit tests (output cost math, nested/negative inputs) + integration proving atomic consume+produce; `verify` + `test` pass.
