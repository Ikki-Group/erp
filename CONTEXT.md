# Context

Domain and structural glossary for the Ikki ERP backend redesign. This file is a **glossary only** — no implementation details, no specs. When a term is sharpened during design, it is recorded here.

Decisions (the reasoning behind a choice) live in `docs/adr/`, not here.

## Structural terms

| Term | Definition |
| --- | --- |
| **Module** | A vertical slice of the backend under `apps/server/src/modules/<module>/`, owning one area of the domain. Presents a small outward surface (its `Api`) and hides its internals. |
| **Simple module** | A module for one entity with plain CRUD. Lives as a single flat file set in the module root. Reference: `location`. |
| **Complex module** | A module with sub-entities, a cross-module atomic effect, or a heavy read query. Split into one sub-folder per sub-entity. Reference: `menu`, `iam`. |
| **Service** | The orchestration object of a module (`XxxService`), exposing `handle*` methods as its public entry points. Coordinates repo, rules, audit, and cache; holds no pure business math itself. |
| **Repo** | The data-access object of a module (`IXxxRepo` interface + `XxxRepo` class). The only place that touches the database. Every method accepts an optional transaction handle. |
| **Rules** | Pure invariants and state-transition guards (`assert*`), free of any I/O — unit-testable without a database. |
| **Calculator** | Pure money/quantity math over value objects, free of `Number(string)`. Required whenever a module does monetary or quantity computation. |
| **Api** | A module's only outward surface — the statically-typed set of operations neighbouring modules may call. Modules never reach past it into each other's internals. |
| **Module descriptor** | The declarative registration of a module (name, layer, dependencies, wiring), composed into the app by the module registry. |

## Value & precision terms

| Term | Definition |
| --- | --- |
| **Money** | The value object for a currency amount, backed by exact decimal arithmetic. The only representation of currency in the domain — a JS `number` for money is forbidden. |
| **Qty** | The value object for a quantity or conversion factor, at high precision. The only representation of quantities/factors in the domain. |
| **Amount** | A `Money` in its currency role (subtotal, total, price, payment) — persisted at 0 decimal places (IDR has no subunit). |
| **Unit cost** | A `Money` in its per-unit-cost role (weighted-average `cost_price`) — persisted at 4 decimal places. |
| **Quantity** | A `Qty` value — persisted at 6 decimal places. |
| **Boundary** | The edge where `Money`/`Qty` are constructed (from DB numeric strings or validated input) and serialized back (to numeric strings). Rounding happens only here, never mid-calculation. |

## Access-control terms

| Term | Definition |
| --- | --- |
| **Permission** | A `<slice>.<action>` string (e.g. `location.read`, `order.void`) required by a route. `<slice>` is the smallest entity; `<action>` is CRUD or a first-class domain verb. |
| **Slice** | The smallest entity a permission scopes to — the module itself for a simple module, a sub-entity for a complex one (`order`, `shift`, `stock`). |
| **Role** | A named bundle of permissions. System roles (Owner, Manager, Cashier, Warehouse Staff, Accountant) ship by default; custom roles combine any catalog permissions. |
| **Assignment** | A user↔role↔location grant. Location-scoped or global; determines which permissions apply in the active location. |
| **Owner** | The role that bypasses all permission checks. At least one user must hold it; it cannot be restricted. |
| **Active location** | The location context of a request, carried as a `locationId` on each request (not stored server-side); validated per request against the user's access map. |
| **Access map** | The materialized authorization state for a user: `isOwner`, global permissions, and per-location permission sets. Returned whole by `GET /me`; cached per user; the sole source the per-request auth path reads. |
| **Session store** | The port holding server-side sessions, memory-backed now (BentoCache), swappable to Redis. |

## Audit terms

| Term | Definition |
| --- | --- |
| **Actor** | The authenticated user performing an operation, carrying `id` and `name`. Every mutation records the actor; a blank actor name is never allowed. |
| **Audit stamp** | The `created_by`/`updated_by`/`created_at`/`updated_at` columns on a mutable table — the quick "who last touched this". |
| **Audit log** | The append-only record of every user mutation, with old/new values, written inside the operation's transaction (atomic — never lost). |
| **Audit action** | The verb on an audit entry: CRUD (`create`/`update`/`delete`) or a domain verb (`complete`, `void`, `ship`, …), drawn from the same vocabulary as permissions. |

## Concurrency & stock terms

| Term | Definition |
| --- | --- |
| **Permissive stock** | The principle that a sale never blocks on insufficient stock; a balance may go negative. Negative stock is a restock signal, not an error. (Transfer-out still requires sufficient stock.) |
| **Snapshot opname** | A stock count that records system quantities at its start and lets sales continue while it runs; variance is computed against the snapshot on completion. Non-blocking. |
| **One-active invariant** | A rule that at most one record of a kind is active at once (one open shift per cashier, one active opname per location, one open order per table), enforced by a partial unique index — it blocks impossible state, not normal operation. |

## Domain terms

Sharpened as each core-operations module is grilled. The AI-generated `docs/product/11-glossary.md` is raw input to press, not yet canonical.

| Term | Definition |
| --- | --- |
| **Location** | The operational unit everything scopes to. One entity with a `type`; has a unique, immutable `code`. Cannot be deactivated while it holds stock. |
| **Store** | A `Location` of type store — has POS, inventory, and menu. Backend enforces store-only operations (orders, menu). |
| **Warehouse** | A `Location` of type warehouse — inventory only, no POS or menu. |
| **Company** | The singleton settings record for the whole business (Ikki Group): name, tax rate (single, company-wide), currency (IDR). Only the Owner edits it. |
| **Document number** | An immutable, per-location, daily-reset identifier `{PREFIX}-{LOCATION_CODE}-{YYYYMMDD}-{SEQ}` assigned at creation time, generated by an atomic sequence counter. |
| **Material** | A raw or semi-finished ingredient in the global catalog, shared across locations. Has one base UoM (the stock source of truth) and optional default display UoMs. Cost is per-location, not on the material. |
| **Assignment** (material→location) | The grant that a material may exist at a location. Required for receiving/transfer (a hard constraint); a POS sale never blocks on a missing assignment. |
| **Base UoM** | The unit a material's stock balance is stored in — the source of truth for quantity. |
| **UoM chain** | The graph of unit conversions (with factors) that resolves multi-hop conversions (karton→L→ml) purely, within one measurement category. |
| **Supplier** | A vendor supplying materials; reference data including payment terms and reference per-material prices (actual purchase price may differ). |
