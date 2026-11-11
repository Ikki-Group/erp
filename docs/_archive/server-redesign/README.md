# Server Redesign Documentation

Design and development specs for the Ikki ERP backend redesign (**Option C**: deepened per-module layers, hybrid cross-module communication, lightweight CQRS).

> **Status:** Design phase. No implementation code yet. These documents are the source of truth for the implementation, which will be executed in Kiro IDE by a low-capability model (GPT Sol). Every spec is written to be explicit and mechanical — a template to copy, not a decision to make.

> **Relationship to `docs/server/`:** The existing `docs/server/` docs describe the **current** architecture and remain valid as historical reference. This tree (`docs/server-redesign/`) describes the **target** architecture. When implementation completes, this tree replaces `docs/server/`.

## Locked Decisions (see ADRs)

| Decision | Choice |
| --- | --- |
| Module layering | Deepened layers per module: `domain` / `app` / `infra` / `contract` / `http` |
| Cross-module communication | **Hybrid** — synchronous in-transaction calls for atomic effects; in-process events for non-critical side effects |
| Read model | **Lightweight CQRS** — read-queries separated from write-services, **no** projection tables |
| Transactions | Explicit Unit of Work; Neon **WebSocket** driver (real `db.transaction()`) |
| Cache | Behind a port interface (swappable to Redis later) |
| Money / Quantity | Value objects (`Money`, `Qty`) — no leaked `Number(string)` conversions |
| Booleans | Native Postgres `boolean` (not `integer 0/1`) |
| Authorization | Per-route RBAC macro (declarative, enforced) |
| Audit | Reliable (awaited within the transaction boundary) |

## Reading Order

| # | Document | Purpose |
| --- | --- | --- |
| 00 | [00-glossary.md](./00-glossary.md) | Canonical terms used across every spec. Read first. |
| 01 | [01-architecture.md](./01-architecture.md) | Target architecture: layers, dependency rules, request flow |
| — | [adr/](./adr/) | Architecture Decision Records for each locked decision |
| 02 | [02-transaction-uow.md](./02-transaction-uow.md) | Unit of Work + Neon WebSocket; write use-case template |
| 03 | [03-event-bus.md](./03-event-bus.md) | In-process event bus; the sync-vs-event rule |
| 04 | [04-value-objects.md](./04-value-objects.md) | Money & Qty value objects |
| 05 | [05-cache-port.md](./05-cache-port.md) | CachePort + memory adapter |
| 06 | [06-rbac.md](./06-rbac.md) | Enforced per-route RBAC macro + permission vocabulary |
| 07 | [07-audit-errors.md](./07-audit-errors.md) | Reliable audit (in UoW) + error model |
| 08 | [08-read-cqrs.md](./08-read-cqrs.md) | Read-query convention (lightweight CQRS) |
| 09 | [09-module-registry.md](./09-module-registry.md) | Declarative module registry + composer |
| 10 | [10-simple-module.md](./10-simple-module.md) | Golden path — full simple module (`location`) |
| 11 | [11-complex-module.md](./11-complex-module.md) | Golden path — complex module (`pos/order`) + atomic effects |
| 12 | [12-module-checklist.md](./12-module-checklist.md) | File-by-file build checklist + definition of done |
| 13 | [13-migration-overview.md](./13-migration-overview.md) | Every module old→new, schema/boolean changes, `api` surface |
| 14 | [14-migrate-pos-order.md](./14-migrate-pos-order.md) | Critical migration — `pos/order` (P0 stock + sync-lines) |
| 15 | [15-migrate-inventory-stock.md](./15-migrate-inventory-stock.md) | Critical migration — `inventory/stock` (atomicity + race) |
| 16 | [16-execution-backlog.md](./16-execution-backlog.md) | Dependency-ordered build backlog for the implementer |
| 17 | [17-verification.md](./17-verification.md) | Consistency verification, traceability, reading map |
| 18 | [18-progress.md](./18-progress.md) | **Progress tracker** — status of every work unit (update as you build) |
| — | [tickets/](./tickets/) | **Development tickets** — one self-contained brief per work unit |

## Quick start for the implementer

Read `00-glossary` → `01-architecture` → skim `02`–`09`. Then run this loop: open [16-execution-backlog.md](./16-execution-backlog.md) → pick the next module → open [12-module-checklist.md](./12-module-checklist.md) → follow it, copying from [10](./10-simple-module.md) (simple) or [11](./11-complex-module.md) (complex) → run `bun run verify` + `bun run test` from `apps/server` → mark done → repeat. The two critical modules require reading [14](./14-migrate-pos-order.md) / [15](./15-migrate-inventory-stock.md) first. See [17-verification.md](./17-verification.md) §7 for the full reading map.

## Conventions For These Documents

- Language: **English**. Technical terms and identifiers in English.
- Structure follows the existing `docs/server/` house style (numbered files, README index, tables, copy-ready code blocks).
- Code blocks in specs are **normative templates** — the implementer copies them and fills the marked slots. Prose explains intent; code shows the exact shape.
