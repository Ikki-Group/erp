# F5 · RBAC & permission model

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: F1 ✅

## Resolution (2026-09-13)

**Decision:** Permission format `<slice>.<action>` (dot, two-part, slice = smallest entity); domain verbs first-class; enforced by the existing `rbac` macro on every route; owner bypass + location-scoped role assignments. Full decision in [`docs/adr/0004-rbac-permissions.md`](../../../docs/adr/0004-rbac-permissions.md).

Settled Q1–Q4:
- Q1/Q4: format `<slice>.<action>` — slice = smallest entity (`location.read`, `order.void`, `shift.close`). Reconciles code (dot) vs PRD (colon 3-part).
- Q2: domain verbs kept first-class (order.void, shift.close-other, transfer.ship, opname.complete, stock.adjust, discount.apply).
- Q3: owner bypass; permissions from assignments matching active location or global; no record-level restrictions; system roles immutable. Active-location resolution deferred to auth/iam module grilling.
- Catalog + 5 default roles adopted from PRD, rewritten to `<slice>.<action>`, limited to in-scope modules (Finance/HR/CRM deferred).

## Question

What is the permission catalog, how are permissions enforced, and what are the role defaults?

Press: the permission-string vocabulary (`<module>.<action>` + domain verbs like `order.void`, `order.complete`); enforcement mechanism (declarative per-route macro, mandatory not advisory); role defaults for Owner/Manager/Cashier/Warehouse/Accountant; owner-bypass semantics; how location-scoping interacts with permissions. This fixes the live P1 (POS/inventory routes authenticate but don't authorize). Output: an ADR defining the RBAC model + a permission catalog.

## Notes

- Live P1: operations routes use auth macro with NO permission declared — authenticated but not authorized.
- Raw material: `docs/product/02-prd-core-permissions.md` (AI-generated, review it), old ADR-0007.
- Sensitive verbs to decide: who can void orders, complete orders, close shifts, adjust stock, complete opname.
- Depends on F1.
