# T-206: `payment-method` module

**Tracker row:** M.payment-method
**Depends on:** `location` (T-201)
**Type:** simple module (Layer 1)

## Goal
The `payment-method` module: payment methods + per-location enablement, exposing `api.byLocation` for `pos/order`.

## Read first
- [10-simple-module.md](../10-simple-module.md) (+ sub-folder for `payment_method_locations`) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. `payment_method_locations` is a sub-entity with native boolean `isEnabled`; methods have native boolean `isActive`. Expose:
- `api.byLocation(locationId): Promise<PaymentMethodDto[]>` — the enabled methods at a location, used by `pos/order` payment validation.

Routes for method + per-location config CRUD, guarded by `payment-method.*`.

## Definition of done
- CRUD + per-location enable/disable; `byLocation` returns only enabled methods.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: ['location']`. `pos/order.record-payment` validates against `byLocation`.
