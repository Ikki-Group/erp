# T-008: `ModuleDescriptor` + composer

**Tracker row:** P0.8
**Depends on:** —
**Type:** foundation

## Goal
`shared/module/registry.ts` defines `ModuleContext`, `ModuleDescriptor`, `BuiltModule`; `shared/module/compose.ts` topologically resolves and builds modules; `app.ts` mounts routes by iterating the registry.

## Read first
- [09-module-registry.md](../09-module-registry.md)

## Build
1. `shared/module/registry.ts` — the three interfaces (spec 09 §1). `ModuleContext` holds `{ db, uow, cache, events, auditPort }`.
2. `shared/module/compose.ts` — `composeModules` with memoization, cycle guard, and upward-dependency guard (spec 09 §3).
3. Rewrite `app.ts` to build `ctx`, call `composeModules(ALL_MODULE_DESCRIPTORS, ctx)`, and `.use()` each module's `route` (spec 09 §4). Create an empty `ALL_MODULE_DESCRIPTORS = []` for now; modules append themselves as they are built.

## Definition of done
- Composer builds each module once; a cycle or upward dependency throws at startup with a clear message.
- Self-check test: two fake descriptors with a cycle ⇒ `composeModules` throws; a valid pair builds in dependency order.
- App boots with zero modules (empty registry) and `/health` responds.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
This replaces the ~90-line manual DI block in `app.ts`. Each later module ticket ends by appending its descriptor to `ALL_MODULE_DESCRIPTORS`.
