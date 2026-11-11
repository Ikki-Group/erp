# Module Build Checklist

The exact file-by-file order to build a module. Follow top to bottom — each step depends only on steps above it. Do not skip, do not reorder. For the shape of each file, copy from [10-simple-module.md](./10-simple-module.md) (simple) or [11-complex-module.md](./11-complex-module.md) (complex).

## Before you start

- [ ] Module name in `kebab-case` (e.g. `payment-method`).
- [ ] Decide simple vs complex: **simple** = one entity, plain CRUD → follow doc 10. **complex** = sub-entities OR cross-module atomic effect OR heavy read → follow doc 11.
- [ ] Identify the module's **layer** (0–3, see [01-architecture.md](./01-architecture.md)) and which lower-layer modules it depends on.
- [ ] List unique fields (for `assertNoConflict`).
- [ ] List the permissions the routes need: `<module>.read`, `<module>.create`, `<module>.update`, `<module>.delete`, plus any domain verbs (`<module>.<verb>`).

## Build order (each box = one file, in this order)

1. [ ] **Schema** — `db/schema/<domain>.ts`: Drizzle table. Use native `boolean` (ADR-0008), `numeric` for money/qty, `...pk`, `...auditBasicColumns`, unique indexes for conflict fields.
2. [ ] **Contract** — `contract/<entity>.dto.ts`: `<Entity>Dto`, `<Entity>CreateDto`, `<Entity>UpdateDto`, `<Entity>FilterDto`, enums. Use `zp`/`zc`/`zq`. No logic.
3. [ ] **Domain entity** — `domain/<entity>.ts`: entity type, `rowTo<Entity>` pure mapper. Wrap money/qty columns in `Money`/`Qty` if the entity has them.
4. [ ] **Domain errors** — `domain/<entity>.errors.ts`: `<Entity>Error` factories (`notFound`, conflicts, `*Failed`, domain-verb errors).
5. [ ] **Domain rules** — `domain/<entity>.rules.ts`: `assert<Rule>` pure functions that throw. (Empty file allowed if none yet.)
6. [ ] **(complex only) Calculator** — `domain/<entity>.calculator.ts`: pure math on `Money`/`Qty`.
7. [ ] **(complex only) Events** — `domain/events.ts`: past-tense event classes (only for non-critical effects).
8. [ ] **Ports** — `app/ports.ts`: `<Entity>RepoPort` (+ external atomic-effect ports the use-cases need, each taking `cx`/`tx`).
9. [ ] **Repo adapter** — `infra/<entity>.repo.drizzle.ts`: implements the port. Every method threads `cx: DbContext | Tx = this.db`. Includes `assertNoConflict`.
10. [ ] **Write use-cases** — `app/<verb-noun>.usecase.ts`: one per mutation. Each opens `uow.run`, follows load → rules → persist → atomic effects → audit; publishes events + invalidates cache **after** commit. (See the template in doc 10 §7 / doc 11 §3.)
11. [ ] **Read use-cases / queries** — simple: `get`/`list` use-cases (no uow). complex: `read/<view>.query.ts` (no uow, no domain).
12. [ ] **Route** — `http/<entity>.route.ts`: `.use(rbac)`, one handler per use-case, every route declares `permission`. Validate → call one use-case → `res.*`.
13. [ ] **Module descriptor** — `<domain>.module.ts`: `ModuleDescriptor` with `name`, `layer`, `dependsOn`, `create(ctx, deps)` wiring adapters → use-cases → route. Export the `UseCases` type and any `api` surface other modules consume.
14. [ ] **Register** — add the descriptor to `ALL_MODULE_DESCRIPTORS`.
15. [ ] **Permissions** — add the module's permission strings to the permission vocabulary list and to the relevant IAM role seeds.
16. [ ] **Migration** — `bun run db:generate` then `bun run db:migrate` (see AGENTS.md; run from `apps/server`).
17. [ ] **Test** — one integration test per write use-case (real DB) proving atomicity (e.g. a failing atomic effect rolls back the main write), plus unit tests for domain calculators/rules (no DB).

## Definition of done (per module)

- [ ] `bun run verify` passes (lint + typecheck + knip + check-deps) — from `apps/server`.
- [ ] `bun run test` passes.
- [ ] Every route declares a `permission` (except the three public routes).
- [ ] Every write use-case body is inside exactly one `uow.run`.
- [ ] No `Number(<numericString>)` anywhere in domain/app (money/qty use `Money`/`Qty`).
- [ ] No boolean `? 1 : 0` / `=== 1` conversions (native boolean).
- [ ] Every audit entry has a non-empty `actorName`.
- [ ] Atomic effects are inside the UoW; events/cache are after commit.
- [ ] `check-deps` shows no upward or cyclic module dependency.

## The rules an implementer most often breaks (re-read before finishing)

1. **Atomic effect placed after commit** → data corruption. It must be inside `uow.run`, taking `tx`. (03, 11 §3)
2. **Event or cache invalidation inside the transaction** → lies about rolled-back changes. They go after `uow.run` returns. (02 §5, 03 §5)
3. **Repo method ignores the passed `cx`/`tx`** → silent loss of atomicity. Every method threads it. (02 §3)
4. **`Number(string)` on money** → precision loss. Use `Money.of(...)`. (04)
5. **Route without `permission`** → unenforced auth. Declare it. (06)
6. **Business logic in the route or repo** → wrong layer. Routes are thin; repos are queries only. (10 table)

---

**Next:** Stage 4 — per-module migration specs.
