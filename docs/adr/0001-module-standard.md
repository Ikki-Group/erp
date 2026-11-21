# ADR-0001: Backend Module Standard (Flat-Hybrid with Pure-Domain Separation)

**Status:** Accepted
**Date:** 2026-09-13
**Supersedes:** the archived `docs/_archive/server-redesign/adr/ADR-0001-layered-vertical-slices.md` (five-folder layout), which was never followed by the code that was actually built.

## Context

The backend is built as vertical-slice modules under `apps/server/src/modules/<module>/`. Two competing standards existed:

- The **archived ADR-0001** prescribed a five-folder layout (`domain/`, `app/`, `infra/`, `contract/`, `http/`) with `make*()` use-case functions and `RepoPort`/`RepoDrizzle` naming. Its stated motive was sound: separate pure business rules (testable, no DB) from I/O and orchestration, so services don't bloat (the legacy POS order service reached ~450 lines) and fire-and-forget bugs have nowhere to hide.
- The **code that was actually built** ignored that ADR and used a flat-file "hybrid": `<module>.contract.ts`, `.repo.ts`, `.service.ts`, `.route.ts`, `.module.ts`, `.internal.ts`, with a `Service` class exposing `handle*` methods, and sub-folders per sub-entity for complex modules (`menu/item/`, `menu/category/`, …).

Every implemented module (`location`, `material`, `uom`, `iam`, `menu`, `recipe`, `supplier`, `payment-method`, `audit`, `company`) uses the flat-hybrid. Zero use the five-folder layout. The written standard lost to reality — because the five-folder ceremony was too heavy for a single-business app at this stage, exactly as the archived ADR's own "Alternatives Rejected" section predicted of full Clean/Onion architecture.

The product is in grooming and **not tested**, so there is no backward-compatibility burden: we ratify what works and fix what drifted, rather than preserve legacy shapes.

The implementer of new modules is **GPT-Luna**, so the standard must be mechanical: given a module, there must be one obvious shape with no judgment calls.

## Decision

Ratify the **flat-hybrid** layout as the canonical module standard, with **one addition**: pure business logic must live in DB-free files, separate from orchestration. This cures the archived ADR's legitimate complaint (rules tangled with I/O) without adopting its five-folder ceremony.

### 1. Simple vs complex module (mechanical rule)

- **Simple** = one entity + plain CRUD → a single flat file set in the module root.
- **Complex** = has sub-entities **OR** a cross-module atomic effect **OR** a heavy read query → one sub-folder per sub-entity, each with its own flat file set; module root holds the aggregate `*.module.ts`, `*.route.ts`, `index.ts`.

Reference modules: `location` (simple), `menu` and `iam` (complex).

### 2. File set per module (or per sub-entity)

| File | Contains | Must NOT contain |
| --- | --- | --- |
| `<x>.contract.ts` | Zod DTOs, composed from shared primitives (`zp`/`zc`/`zq`) with spread-shape | logic, DB, Elysia |
| `<x>.repo.ts` | `IXxxRepo` interface + `XxxRepo` class (Drizzle). Every method threads `db?: DbContext \| Tx`. Finders return DTO or `undefined`; writes return `EntityRef` or `undefined`. Includes `assertNoConflict`. | business rules, orchestration |
| `<x>.rules.ts` | pure `assert*` invariants / state-transition guards (no DB). May be empty for simple modules. | I/O, Drizzle, Elysia, cache |
| `<x>.calculator.ts` | **required when the module does money/quantity math** — pure functions over `Money`/`Qty`, free of `Number(string)` | I/O, DB |
| `<x>.service.ts` | orchestration only: open UoW, call repo, run rules/calculator, record audit, invalidate cache. `XxxService` class with `handle*` public methods. | pure math/rules inlined (delegate to calculator/rules); direct Drizzle |
| `<x>.route.ts` | thin Elysia routes: validate via contract → call one `handle*` → wrap in `res.*`; every route declares a `permission` | business logic, domain/infra imports |
| `<x>.internal.ts` | module-private error factories, unique-field lists | anything exported outside the module |
| `<x>.module.ts` | `ModuleDescriptor` wiring adapters → service → route | logic |
| `index.ts` | barrel: exports **only** `ModuleDescriptor` + the `Api` type | internal service/repo/contract |

### 3. Naming

- Repo: `IXxxRepo` (interface) + `XxxRepo` (class).
- Service: `XxxService` with `handle*` public entry points.
- DTO: `PascalCase` + `Dto`. Module directory: `kebab-case`.

### 4. Where logic lives (the pure/orchestration split)

- Pure business logic — totals, weighted-average cost, UoM conversion, HPP, status-transition assertions, row→entity mapping — lives in `*.rules.ts` / `*.calculator.ts` and is **unit-testable without a DB**.
- The `service.ts` orchestrates only. If a `handle*` method contains money math or a non-trivial invariant inline, it belongs in a calculator/rules file instead.

### 5. Module wiring

- All infrastructure dependencies (`db`, `uow`, `cache`, `auditPort`, `events`) come from the registry `ctx`. Importing a global `cache`/`db` singleton inside a module is forbidden.
- Cross-module dependencies are accessed only through the neighbour's exported, statically-typed `Api`. Runtime duck-typing (`isXxxApi(...)`) is forbidden.
- `location.module.ts` is the reference; `menu.module.ts` (global-cache import + duck-typing) is non-conforming and is corrected when it is next touched.

### 6. Public surface (seam between modules)

- A module's only outward surface is its `Api` type. Other modules never import its `XxxService`/`XxxRepo`/contract directly.
- The concrete *shape* of cross-module communication for atomic effects (port threaded with `tx` vs domain event) is decided in F2 (transaction model), not here. This ADR only fixes that access goes through `Api`.

### 7. Tests

- Unit tests are **required** for every `*.calculator.ts` and non-empty `*.rules.ts` (no DB).
- Complex modules with a cross-module atomic effect require an integration test proving rollback; the exact atomicity-test mechanism is specified in F2.

## Alternatives Considered

- **Enforce the archived five-folder layout and migrate every module.** Rejected: large rename/move with no depth gain at this scale; the five-folder ceremony is why the archived ADR was ignored in the first place.
- **Keep pure flat files with no domain separation (status quo).** Rejected: this is the exact tangle that produced the 450-line POS service and the fire-and-forget bugs. The `*.rules.ts`/`*.calculator.ts` requirement is the minimal cure.

## Consequences

- **Easier:** the existing code is already ~conformant; changes are additive (extract pure logic, standardize wiring). GPT-Luna copies `location` (simple) or `menu`/`iam` (complex) as a known shape.
- **Harder:** money/qty math must be pulled out into calculators — enforced by the F3 (Money) discipline and by unit-test coverage.
- **Constraint:** no global-singleton infra imports; no cross-module internal imports; barrels export only `ModuleDescriptor` + `Api`. Enforced by review and `check-deps`.
