# ADR-0009: Reliable Audit Inside the Unit of Work

**Status:** Accepted
**Date:** 2026-09-05

## Context

`auditLog.record` is fire-and-forget (`void db.insert(...).catch(log)`): it does not await and never throws, so an audit write can be lost if the process dies or the insert fails. Separately, every caller passes `userName: ''`, so the audit trail has no human-readable actor. For an ERP, the audit trail must be trustworthy.

## Decision

Audit is an **atomic effect**: the audit entry is written **inside the use-case's Unit of Work**, awaited via an `AuditPort`. It commits or rolls back with the operation — if the operation succeeds, its audit row exists; if it rolls back, no misleading audit row remains. The actor's name is resolved (from the loaded user / auth context) and stored, not left blank.

## Alternatives Considered

- **Keep fire-and-forget for performance.** Rejected: an unreliable audit trail is worse than none for an ERP; the cost of one extra insert in the transaction is negligible.
- **Audit as a domain event (post-commit).** Rejected: a post-commit event can still be lost, and an event handler failure would leave a committed operation with no audit — the exact reliability gap we are closing. Audit is classified atomic in ADR-0003's table for this reason.

## Consequences

- **Easier:** audit is guaranteed consistent with the data. The implementer calls `auditPort.record(entry, tx)` inside the UoW like any other write.
- **Harder:** audit failure now fails the operation. This is intended — a mutation that cannot be audited should not silently succeed.
- **Constraint:** `userName` (or a resolved actor label) is required on every audit entry; empty is not allowed. Audit entry shape specified in Stage 2.
