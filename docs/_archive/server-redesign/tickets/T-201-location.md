# T-201: `location` module

**Tracker row:** M.location
**Depends on:** Phase 0
**Type:** simple module (Layer 1) — **golden-path reference**

## Goal
The `location` module, built to be the exact reference every other simple module copies. Get it reviewed before proceeding.

## Read first
- [10-simple-module.md](../10-simple-module.md) — this module IS the worked example there
- [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist 1→17. All code is in spec 10 verbatim (contract, domain, ports, repo, 5 use-cases, route, descriptor). Native boolean `isActive`. Routes guarded by `location.read/create/update/delete`.

## Definition of done
- Full CRUD works; create/update conflict-check on code+name; delete is soft.
- Every write use-case is in a `uow.run` with audit; reads have no uow.
- Every route declares a permission.
- Integration test: create → get → update → list → delete round-trip.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: []`. **Stop and get this reviewed** — a correct `location` de-risks every later simple module. Exposes `api.get` for downward consumers.
