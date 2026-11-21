# Architecture Decision Records

Each ADR captures one locked decision for the backend redesign: the context, the choice, the alternatives rejected, and the consequences. ADRs are immutable once accepted — a later change is a new ADR that supersedes an older one.

| ADR | Decision | Status |
| --- | --- | --- |
| [ADR-0001](./ADR-0001-layered-vertical-slices.md) | Deepened per-module layers (domain/app/infra/contract/http) | Accepted |
| [ADR-0002](./ADR-0002-unit-of-work-neon-websocket.md) | Explicit Unit of Work + Neon WebSocket driver | Accepted |
| [ADR-0003](./ADR-0003-hybrid-cross-module.md) | Hybrid cross-module communication (sync atomic + async events) | Accepted |
| [ADR-0004](./ADR-0004-lightweight-cqrs.md) | Lightweight CQRS (no projection tables) | Accepted |
| [ADR-0005](./ADR-0005-money-qty-value-objects.md) | Money/Qty value objects | Accepted |
| [ADR-0006](./ADR-0006-cache-port.md) | Cache behind a port | Accepted |
| [ADR-0007](./ADR-0007-enforced-rbac-macro.md) | Enforced per-route RBAC macro | Accepted |
| [ADR-0008](./ADR-0008-native-boolean.md) | Native Postgres boolean | Accepted |
| [ADR-0009](./ADR-0009-reliable-audit.md) | Reliable audit inside the UoW | Accepted |
| [ADR-0010](./ADR-0010-declarative-module-registry.md) | Declarative module registry (replace manual DI) | Accepted |

## ADR Template

```
# ADR-NNNN: <title>

**Status:** Accepted
**Date:** YYYY-MM-DD

## Context
Why this decision is needed; the problem/pain point.

## Decision
The choice, stated plainly.

## Alternatives Considered
Options rejected and why.

## Consequences
What becomes easier, harder, or constrained. Impact on the low-capability implementer.
```
