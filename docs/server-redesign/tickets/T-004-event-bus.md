# T-004: `EventBusPort` + memory adapter

**Tracker row:** P0.4
**Depends on:** —
**Type:** foundation

## Goal
`shared/events/event-bus.port.ts` defines `DomainEvent`, `EventBusPort`; `infra/events/event-bus.memory.ts` implements an in-process pub/sub with per-handler isolation.

## Read first
- [03-event-bus.md](../03-event-bus.md) §1, §2, §5

## Build
1. Create `shared/events/event-bus.port.ts` (spec 03 §2): `DomainEvent`, `Handler`, `EventBusPort` (publish, subscribe).
2. Create `infra/events/event-bus.memory.ts` (spec 03 §2): map of handlers; `publish` runs each handler isolated (`void Promise.resolve().then(...).catch(log)`) so one failure never affects others or the publisher.

## Definition of done
- A throwing handler is logged, not propagated to `publish`.
- Multiple handlers for one type all run.
- Self-check test: subscribe two handlers, one throws; assert the other still ran and `publish` did not throw.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
Events are published AFTER commit and carry IDs only, never a `tx`. This is for non-critical effects only (spec 03 classification). Atomic effects do NOT use this.
