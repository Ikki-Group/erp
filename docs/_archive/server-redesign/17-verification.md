# Spec Consistency Verification

Verification of the full `docs/server-redesign/` spec set: completeness, cross-references, and followability for the low-capability implementer (GPT Sol). This is the closing document; if a future change breaks one of the checks below, re-run it.

## 1. Document inventory (all present)

18 top-level docs + ADR index + 10 ADRs, verified on disk:

`README.md`, `00-glossary`, `01-architecture`, `02-transaction-uow`, `03-event-bus`, `04-value-objects`, `05-cache-port`, `06-rbac`, `07-audit-errors`, `08-read-cqrs`, `09-module-registry`, `10-simple-module`, `11-complex-module`, `12-module-checklist`, `13-migration-overview`, `14-migrate-pos-order`, `15-migrate-inventory-stock`, `16-execution-backlog`, `17-verification` (this doc), `adr/README` + `ADR-0001…0010`.

**Link integrity:** every internal `[..](./NN-*.md)` / `[..](./ADR-000N-*.md)` link resolves to a file that exists. No dangling links.

## 2. ADR → supporting-spec coverage (every decision is implemented)

| ADR | Decision | Implemented by |
| --- | --- | --- |
| 0001 | Deepened layers | 01-architecture, 10, 11, 12 |
| 0002 | UoW + Neon WebSocket | 02-transaction-uow, 16 §0.1–0.2 |
| 0003 | Hybrid comms | 03-event-bus, 01 §hybrid, 07 (audit=atomic), 11 §3 |
| 0004 | Lightweight CQRS | 08-read-cqrs, 10 (no read/), 11 §5 |
| 0005 | Money/Qty | 04-value-objects, 16 §0.6 |
| 0006 | Cache port | 05-cache-port, 16 §0.3 |
| 0007 | Enforced RBAC | 06-rbac, 16 §0.7 |
| 0008 | Native boolean | 13 §schema, 10 (DTO), 12 (checklist) |
| 0009 | Reliable audit | 07-audit-errors, 06 §5 (userName) |
| 0010 | Module registry | 09-module-registry, 16 §0.8 |

No ADR is orphaned; no spec claims an "Implements ADR-N" that lacks a file.

## 3. Pain-point → fix traceability (every P0/P1/P2 has a fix spec + a test)

| # | Pain point | Fix spec | Verifying test |
| --- | --- | --- | --- |
| P0 | `withTransaction` no-op | 02 (real UoW) | UoW rolls back on throw (16 §0.1 self-check) |
| P0 | Stock deduction fire-and-forget after complete | 11 §3, 14 (P0-1), 15 | complete w/ insufficient stock ⇒ order stays open |
| P0 | Non-atomic `sync-lines` | 14 (P0-2) | forced insert failure ⇒ old lines intact |
| P0 | Non-atomic `recordMovement` + balance race | 15 (P0-3, P0-4) | forced failure ⇒ balance unchanged; concurrent out ⇒ one throws |
| P1 | RBAC evaluated, never enforced | 06, 14 (P1-1) | no-permission user ⇒ 403 |
| P1 | Boolean as integer 0/1 | 13 §schema, ADR-0008 | typecheck (boolean DTO) |
| P1 | Audit fire-and-forget, empty userName | 07, 06 §5, 14 (P1-2) | audit row iff commit; actorName non-empty |
| P2 | Manual DI fragile | 09, ADR-0010 | composer rejects cycle/upward at startup |
| P2 | `Number(string)` money leak | 04, 14 (P2-1), 15 (P2-2) | calculator/costing unit tests |
| P2 | Memory-only cache | 05, ADR-0006 | (design — Redis adapter later) |

Every pain point from the investigation is covered.

## 4. Terminology consistency (glossary is honored)

Checked across all docs — the canonical terms are used uniformly:

- **Layers**: `domain` / `app` / `infra` / `contract` / `http` (+ `read`) — same everywhere.
- **Transaction**: `UnitOfWork` / `uow.run` / `tx` / `cx` param — consistent; no stray `withTransaction` presented as the target.
- **Effect classes**: "atomic effect" (sync, in UoW) vs "non-critical effect" (event) — used exactly per glossary in 01, 03, 07, 11, 14, 15.
- **Ports/adapters**: `{Name}Port` interface, `{Name}{Tech}` adapter — consistent.
- **Value objects**: `Money` / `Qty` — never reintroduced as `number` in domain/app examples.
- **Events**: past-tense `PascalCase` (`OrderCompleted`) — consistent.
- Old-code terms (`handleX`, `*.service.ts`, `I{M}Repo`) appear **only** in "from → to" migration columns, never as the target pattern.

## 5. Followability simulation (traced `location` as GPT Sol)

Walked the golden path end to end as the low-capability implementer would, using only the docs:

1. Read 16 → Phase 0 first. Each foundation item has a spec section and a self-check. ✅
2. Read 16 → `location` is 2.1, `dependsOn: []`. Open 12 (checklist). ✅
3. Checklist step 1 (schema) → boolean columns per 13. Steps 2–13 each map to a numbered code block in 10. Every file in the target folder has a corresponding block in 10. ✅ No step says "decide" or "choose" — each is "copy this, rename".
4. Write use-case: 10 §7 gives the exact `uow.run` body; the six-rule list in 12 catches the common mistakes. ✅
5. Route: 06 §3 gives the exact `permission` per verb. ✅
6. Descriptor: 10 §9 gives the exact shape; register in `ALL_MODULE_DESCRIPTORS` (09). ✅
7. Definition of done (12) is a concrete checklist ending in `bun run verify` + `bun run test`. ✅

**No ambiguous step found on the simple path.** For the complex path, `pos/order`, the two P0 fixes are written out verbatim (11 §3, 14) rather than described, and the deduction port is shown with the `tx` threaded — the hardest part is copy-not-decide.

## 6. Residual ambiguities the implementer must NOT resolve alone

These are flagged for a human decision, not left to GPT Sol:

1. **Strict stock policy** (15): a sale cannot complete without stock (replaces the current silent-swallow). If the business wants permissive/negative stock, that is an explicit flag — confirm with the product owner before building `deduct-for-order`.
2. **Per-location tax** (14): tax stays a single company rate. If per-location tax is needed, `TaxRatePort.getPercent(locationId)` — a small, localized change.
3. **`auth` vs `iam` build order** (16 §1.3): if `auth` needs user lookups, build `iam` first or stub the user port.

## 7. Reading map for the executor

**To build the backend, read in this order:**

1. `00-glossary` — learn the words.
2. `01-architecture` — the shape and the request flows.
3. `02`–`09` — the patterns (skim; return to each when the checklist points to it).
4. `10` (simple) and `11` (complex) — the copy-paste templates.
5. `12` — the per-module checklist. **This is the day-to-day driver.**
6. `16` — the backlog. **Start here for "what do I build next".**
7. `13`/`14`/`15` — consult when migrating a specific module (14/15 are mandatory reading before the two critical modules).
8. `adr/` — read when you want to know *why* a rule exists.

**One-line loop for the implementer:** open `16` → pick the next module → open `12` → follow the checklist, copying from `10`/`11` → run `verify` + `test` → mark done → repeat.

## Verdict

The spec set is **internally consistent, fully cross-referenced, complete against every identified pain point, and followable by a low-capability model** without open design decisions on the build path. The three residual ambiguities are explicitly quarantined for human sign-off.
