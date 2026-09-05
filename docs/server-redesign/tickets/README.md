# Development Tickets

One ticket per work unit. Each ticket is a **self-contained brief** for the implementer (GPT Sol): open exactly one ticket, do exactly what it says, update [../18-progress.md](../18-progress.md), move to the next. Do not work on more than one ticket at a time.

## Workflow

1. In [../18-progress.md](../18-progress.md), find the next `todo` row whose deps are all `done`.
2. Open its ticket here.
3. Set the row to `in-progress`.
4. Read the spec sections the ticket lists. Build following the ticket's checklist.
5. Run `bun run verify` + `bun run test` (from `apps/server`). Both must pass.
6. Set the row to `done`, tick **Verify**, record the commit.
7. Next ticket.

## Ticket ID scheme

- `T-00N` — Phase 0 foundation
- `T-1NN` — Layer 0 modules
- `T-2NN` — Layer 1 modules
- `T-3NN` — Layer 2 modules

## Ticket template

Every ticket follows this shape:

```
# T-NNN: <title>

**Tracker row:** <id in 18-progress.md>
**Depends on:** <ticket ids that must be done first>
**Type:** foundation | simple module | complex module | schema

## Goal
One sentence: what exists when this ticket is done.

## Read first
The exact spec sections to read before writing code.

## Build
The ordered, mechanical steps (points to 12-module-checklist for modules).

## Definition of done
Concrete, checkable. Always ends with: `bun run verify` + `bun run test` green.

## Notes / gotchas
Module-specific warnings, the `api` surface to expose, open decisions.
```

## Index

**Phase 0 — Foundation:** T-001 … T-009
**Layer 0:** T-101 audit · T-102 company · T-103 auth
**Layer 1:** T-201 location · T-202 uom · T-203 iam · T-204 material · T-205 supplier · T-206 payment-method · T-207 menu · T-208 recipe
**Layer 2:** T-301 inventory/stock · T-302 pos/shift · T-303 pos/table · T-304 pos/voucher · T-305 pos/order · T-306 inventory/receiving · T-307 inventory/transfer · T-308 inventory/opname · T-309 production

> Two tickets are **CRITICAL** (carry P0 fixes) and cite dedicated migration specs: T-301 ([15](../15-migrate-inventory-stock.md)) and T-305 ([14](../14-migrate-pos-order.md)).
