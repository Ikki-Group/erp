# Glossary

Canonical terminology for the backend redesign. Every other spec MUST use these terms exactly as defined here. If a term is not in this list, it has no special meaning.

## Layers (per module)

| Term | Definition |
| --- | --- |
| **domain** | Pure business logic: entities, value objects, invariants, state-transition rules. **No** database, **no** Elysia, **no** Zod, **no** I/O. Only plain functions and types. Deterministic and unit-testable without a DB. |
| **app** | Use-case layer. Orchestrates a single business operation (e.g. "complete order"). Defines **port** interfaces it needs (repo, cache, event bus). Owns the transaction boundary. Calls domain functions for rules, ports for I/O. |
| **infra** | Adapters that implement ports: Drizzle repositories, cache adapter, event-bus adapter. The only layer that touches the database or external systems. |
| **contract** | Zod DTOs — the HTTP boundary shapes (request bodies, query params, responses). Validation only, no logic. |
| **http** | Thin Elysia routes: validate input via contract → call one app use-case → wrap result in a response helper. No business logic. |

## Core Concepts

| Term | Definition |
| --- | --- |
| **Use-case** | A single business operation exposed by the `app` layer, named `verbNoun` (e.g. `completeOrder`, `createLocation`). One use-case = one entry point = one transaction boundary (if it writes). |
| **Port** | A TypeScript `interface` declared in the `app` layer describing an I/O dependency the use-case needs (e.g. `OrderRepoPort`, `CachePort`, `EventBusPort`). Implemented in `infra`. The app layer depends on the port, never on the concrete adapter. |
| **Adapter** | A concrete `infra` class implementing a port (e.g. `OrderRepoDrizzle implements OrderRepoPort`). |
| **Unit of Work (UoW)** | An explicit transaction scope. A write use-case runs inside exactly one UoW; all repo writes and synchronous atomic effects share the same transaction and commit or roll back together. |
| **Atomic effect** | A side effect that MUST succeed or fail together with the main operation. Executed **synchronously inside the UoW** (e.g. stock deduction on order completion). |
| **Non-critical effect** | A side effect that MAY fail or lag independently without invalidating the main operation. Emitted as an **event** and handled outside the UoW (e.g. audit log, notification). |
| **Domain event** | An in-process message published after a use-case commits, describing something that happened (past tense, e.g. `OrderCompleted`). Handled by subscribers asynchronously. Never carries a transaction. |
| **Event bus** | The in-process publish/subscribe mechanism for domain events. In-process only — no external broker (Kafka/SQS) at this stage. |
| **Write-service** | The `app`-layer code path that mutates state (create/update/delete/state-transition). Runs in a UoW. |
| **Read-query** | A dedicated read path, separate from write-services, optimized for a specific view. Part of lightweight CQRS. Does not go through the write-service or the domain layer. |
| **Lightweight CQRS** | Reads and writes are separated in code (read-query vs write-service) but share the same tables. **No** separate projection/denormalized tables that must be kept in sync. |

## Value Objects

| Term | Definition |
| --- | --- |
| **Money** | A domain value object wrapping an exact decimal amount (backed by `decimal.js`). Constructed at the boundary, used throughout domain logic, serialized to a `numeric` string only when persisting. Never represented as a JS `number` inside domain logic. |
| **Qty** | A domain value object for quantities/factors with high precision (6 dp). Same discipline as `Money`. |

## Cross-Cutting

| Term | Definition |
| --- | --- |
| **RBAC macro** | A declarative Elysia macro applied per route that enforces a required permission before the handler runs. Enforcement is mandatory, not advisory. |
| **Audit** | A reliable record of a mutation, written **within** the use-case's UoW (awaited), so it commits or rolls back with the operation. |
| **Actor** | The authenticated user performing an operation, identified by `actorId`. |
| **Location context** | The `locationId` carried by an authenticated request (from session), used to scope data. |

## Naming (unchanged from existing standard unless noted)

| Element | Convention | Example |
| --- | --- | --- |
| Module directory | `kebab-case` | `pos/`, `payment-method/` |
| Use-case file | `{verb-noun}.usecase.ts` | `complete-order.usecase.ts` |
| Port interface | `{Name}Port` | `OrderRepoPort`, `CachePort` |
| Adapter class | `{Name}{Tech}` | `OrderRepoDrizzle` |
| Domain entity/VO | `PascalCase` | `Order`, `Money`, `Qty` |
| Domain event | `PascalCase`, past tense | `OrderCompleted`, `StockDeducted` |
| Zod DTO | `PascalCase` + `Dto` | `OrderCreateDto` |

> **Note:** The redesign moves from the current `{module}.{layer}.ts` flat naming to layer **folders** (`domain/`, `app/`, `infra/`, `contract/`, `http/`). Rationale and exact folder shape: see [01-architecture.md](./01-architecture.md) and ADR-0001.
