# T-005: `AuditPort` + Drizzle adapter

**Tracker row:** P0.5
**Depends on:** T-001
**Type:** foundation

## Goal
`shared/audit/audit.port.ts` defines `AuditPort` (`record(entry, tx)`); `infra/audit/audit.drizzle.ts` implements it, writing to `audit_logs` **inside the given transaction**, rejecting empty `actorName`.

## Read first
- [07-audit-errors.md](../07-audit-errors.md) Part A

## Build
1. Create `shared/audit/audit.port.ts` with `AuditEntry` (incl. required `actorName`) and `AuditPort.record(entry, tx)` — spec 07 Part A.
2. Create `infra/audit/audit.drizzle.ts`: awaited insert via `tx`; throw if `!entry.actorName`.
3. Delete/retire the old fire-and-forget `auditLog.record` (`void ...catch`). The `audit` module (T-101) owns read endpoints.

## Definition of done
- `record` is awaited and throws on failure (so it participates in rollback).
- Empty `actorName` throws.
- Self-check test: call `record` inside a `uow.run` that then throws ⇒ no audit row committed.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
Audit is an ATOMIC effect (spec 07, ADR-0003/0009) — always in the UoW, never an event. `actorName` comes from `actorOf(auth)` (T-007).
