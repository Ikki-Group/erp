# F5 · RBAC & permission model

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: F1

## Question

What is the permission catalog, how are permissions enforced, and what are the role defaults?

Press: the permission-string vocabulary (`<module>.<action>` + domain verbs like `order.void`, `order.complete`); enforcement mechanism (declarative per-route macro, mandatory not advisory); role defaults for Owner/Manager/Cashier/Warehouse/Accountant; owner-bypass semantics; how location-scoping interacts with permissions. This fixes the live P1 (POS/inventory routes authenticate but don't authorize). Output: an ADR defining the RBAC model + a permission catalog.

## Notes

- Live P1: operations routes use auth macro with NO permission declared — authenticated but not authorized.
- Raw material: `docs/product/02-prd-core-permissions.md` (AI-generated, review it), old ADR-0007.
- Sensitive verbs to decide: who can void orders, complete orders, close shifts, adjust stock, complete opname.
- Depends on F1.
