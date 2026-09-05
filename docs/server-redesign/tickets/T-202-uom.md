# T-202: `uom` module

**Tracker row:** M.uom
**Depends on:** Phase 0
**Type:** simple module (Layer 1)

## Goal
The `uom` module: units of measure + chain conversions, exposing conversion resolution for stock/recipe math.

## Read first
- [10-simple-module.md](../10-simple-module.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. Entities: `uoms`, `uom_conversions` (sub-entity). Move the existing pure conversion logic (`uom.resolver.ts`) into `domain/uom.resolver.ts` (it is pure — good fit). Expose:
- `api.getAllConversions(cx?)` and `api.resolveConversion(...)` — consumed by `inventory/stock` deduction.

Routes for UoM + conversion CRUD, guarded by `uom.*`.

## Definition of done
- CRUD for uoms + conversions; resolver unit-tested (pure).
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: []`. The resolver is pure domain — no DB inside it. Conversions are read by stock deduction with the order's `tx`.
