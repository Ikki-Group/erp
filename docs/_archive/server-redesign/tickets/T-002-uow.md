# T-002: `UnitOfWork` port + Drizzle adapter

**Tracker row:** P0.2
**Depends on:** T-001
**Type:** foundation

## Goal
`shared/uow/uow.port.ts` defines `UnitOfWork` (`run<T>(fn: (tx: Tx) => Promise<T>)`); `infra/database/uow.drizzle.ts` exports `uow` implementing it via `db.transaction`.

## Read first
- [02-transaction-uow.md](../02-transaction-uow.md) §2, §5

## Build
1. Create `shared/uow/uow.port.ts` with the `UnitOfWork` interface (spec 02 §2).
2. Create `infra/database/uow.drizzle.ts`: `export const uow: UnitOfWork = { run: (fn) => db.transaction((tx) => fn(tx)) }`.

## Definition of done
- `uow.run(async (tx) => {...})` commits on return, rolls back on throw.
- Self-check test: two repo writes in one `uow.run` where the second throws ⇒ first is rolled back.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
`uow` is injected into every write use-case via `ModuleContext` (T-008). Never call effects/events/cache invalidation inside `run` — those belong after it (spec 02 §5).
