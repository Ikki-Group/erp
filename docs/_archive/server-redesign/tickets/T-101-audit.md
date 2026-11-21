# T-101: `audit` module

**Tracker row:** M.audit
**Depends on:** Phase 0 (esp. T-005)
**Type:** simple module (Layer 0)

## Goal
The `audit` module: owns the `AuditPort` adapter (already built in T-005) and exposes read endpoints for audit logs.

## Read first
- [10-simple-module.md](../10-simple-module.md) · [12-module-checklist.md](../12-module-checklist.md)
- [07-audit-errors.md](../07-audit-errors.md) Part A

## Build
Follow the checklist. This module has **no write use-cases** (writes happen via `AuditPort` inside other modules' UoWs). It provides:
- `read/audit-log.query.ts` — paginated/filterable list of audit entries (by module, entity, actor, date).
- `http/audit.route.ts` — `GET /audit/list` with `permission: 'audit.read'`.
- descriptor exposing `api: {}` (nothing consumed upward) and mounting the route.

## Definition of done
- Read endpoint returns audit rows; guarded by `audit.read`.
- `bun run verify` + `bun run test` green; append descriptor to `ALL_MODULE_DESCRIPTORS`.

## Notes / gotchas
`layer: 0`, `dependsOn: []`. The write path is `AuditPort` (T-005) — do not add a write use-case here.
