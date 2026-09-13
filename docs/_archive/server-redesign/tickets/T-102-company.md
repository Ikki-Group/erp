# T-102: `company` module

**Tracker row:** M.company
**Depends on:** Phase 0
**Type:** simple module (Layer 0)

## Goal
The `company` singleton-settings module, exposing `api.taxRate.getPercent()` consumed by `pos/order`.

## Read first
- [10-simple-module.md](../10-simple-module.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. Singleton settings (one row): use-cases `getSettings` (read) and `updateSettings` (write, in UoW + audit). Expose:
- `api.taxRate.getPercent(): Promise<number>` — reads `taxRate` from settings (stored as percentage, e.g. `11`).

Routes: `GET /company/settings` (`company.read`), `PUT /company/settings` (`company.update`).

## Definition of done
- `getSettings`/`updateSettings` work; update is audited in a UoW.
- `api.taxRate.getPercent()` returns the numeric percent.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 0`, `dependsOn: []`. `pos/order` reads tax via this `api` (spec 14 §tax). Per-location tax is out of scope (open decision in 18-progress).
