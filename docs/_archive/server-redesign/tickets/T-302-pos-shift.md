# T-302: `pos/shift` module

**Tracker row:** M.pos-shift
**Depends on:** `location` (T-201)
**Type:** simple module (Layer 2)

## Goal
Cashier shift open/close, exposing `api.getActive(actorId, locationId)` for `pos/order`.

## Read first
- [10-simple-module.md](../10-simple-module.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. Entity `cashier_shifts`; cash amounts are `Money`. Use-cases: `openShift`, `closeShift` (write, UoW + audit). Expose `api.getActive(actorId, locationId): Promise<ShiftDto | undefined>`.

Routes guarded by `pos-shift.*` (`pos-shift.open`, `pos-shift.close`, `pos-shift.read`).

## Definition of done
- Open/close shift; only one open shift per user+location; `getActive` correct.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: ['location']`. Sibling of `pos/order` within the `pos` group.
