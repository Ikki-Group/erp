# ADR-0004: RBAC & Permission Model

**Status:** Accepted
**Date:** 2026-09-13
**Supersedes:** archived `ADR-0007-enforced-rbac-macro.md` (re-grilled) and reconciles the AI-generated `docs/product/02-prd-core-permissions.md` (permission catalog).
**Depends on:** ADR-0001 (module standard).

## Context

Two permission-string conventions collided: the actual code uses `<slice>.<action>` with a dot (`location.read`, `location.create`), while the AI-generated PRD uses `<module>:<entity>:<action>` with colons (`pos:order:create`). A single vocabulary is required. The enforcement mechanism already exists and works: the `rbac` Elysia macro (`apps/server/src/server/plugins/rbac.plugin.ts`) reads a per-route `permission` and calls `hasPermission(auth, required)`, throwing `ForbiddenError` (403) on failure. The live P1 is that POS/inventory/production routes authenticate but declare **no** `permission` — authenticated but not authorized.

## Decision

### 1. Permission string format: `<slice>.<action>`

- Two segments, dot-separated. `<slice>` is the smallest entity/sub-entity, not the aggregate module.
- Simple module: `location.read`, `location.create`, `location.update`, `location.delete`.
- Complex module (uses the sub-entity as slice): `order.void`, `shift.close`, `table.manage`, `stock.adjust`.
- This matches the existing code (`location.read`), stays two-part, and is unambiguous for complex modules with multiple sub-entities.

### 2. Actions

Standard CRUD: `read`, `create`, `update`, `delete`, plus `manage` (shorthand for full CRUD on low-risk config entities).

**Domain verbs are first-class permissions** (not folded into CRUD), because they are real authorization decisions:

| Slice | Domain-verb permissions |
| --- | --- |
| order | `order.void`, `order.void-line` |
| payment | `payment.create` |
| shift | `shift.open`, `shift.close`, `shift.close-other` |
| discount | `discount.apply` |
| voucher | `voucher.manage` |
| table | `table.manage` |
| transfer | `transfer.ship`, `transfer.receive`, `transfer.cancel` |
| opname | `opname.complete` |
| stock | `stock.adjust` |
| receiving | `receiving.create` |

### 3. Enforcement

- Every route declares a `permission` via the `rbac` macro. No `permission` = a bug (closes the live P1). The three public routes (login/health/etc.) are the only exceptions.
- Failure → `ForbiddenError` (403). Enforcement is mandatory, not advisory.

### 4. Authorization logic

On each request: resolve user from session → resolve active location → collect permissions from role assignments matching the active location (or global) → check the required permission is in the set → proceed or 403.

- **Owner bypasses all checks** (implicit all permissions); at least one user must hold Owner; system roles cannot be modified or deleted.
- Location-scoped roles apply only at assigned locations; switching to an unassigned location shows no data.
- **No record-level restrictions** — holding a permission grants it across the entire active-location context.
- Custom roles: any combination of catalog permissions, assigned per-location or global.

> How the *active location* is resolved belongs to the auth/iam grilling. **Resolved by ADR-0007:** the active location comes from the **request** (a `locationId` header), validated per request — not from a server-stored session field. This ADR fixes the permission vocabulary, enforcement, and authorization rule.

### 5. Catalog scope

The permission catalog and the five default roles (Owner, Manager, Cashier, Warehouse Staff, Accountant) from the PRD are adopted, **rewritten into `<slice>.<action>` form**, and limited to in-scope modules: Core, Master Data, Menu, POS, Inventory, Production. Finance/HR/CRM permissions are recorded in the PRD but are out of scope for this redesign map; their role defaults are finalized when those modules are grilled.

## Alternatives Considered

- **Three-part `<module>.<entity>.<action>`.** Rejected by the owner in favour of the simpler two-part form; `<slice>` as the smallest entity removes the ambiguity three parts were meant to solve.
- **Colon separator (`pos:order:create`, per PRD).** Rejected: the code already uses dots; no reason to migrate.
- **Fold domain verbs into CRUD.** Rejected: loses real authorization distinctions (e.g. `shift.close` vs `shift.close-other`, `order.void`).

## Consequences

- **Easier:** one vocabulary; enforcement already built; the P1 closes by making `permission` mandatory per route.
- **Harder:** the PRD catalog must be rewritten from colon three-part to dot two-part `<slice>.<action>`. Done once, as part of finalizing the catalog.
- **Constraint:** every route declares a `permission`; permission strings are `<slice>.<action>`; domain verbs stay first-class. Verified by review; a route without `permission` fails review.
