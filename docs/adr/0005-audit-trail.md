# ADR-0005: Audit Trail Model

**Status:** Accepted
**Date:** 2026-09-13
**Supersedes:** archived `ADR-0009-reliable-audit.md` (re-grilled) and reconciles the AI-generated `docs/product/02-prd-core-audit.md`.
**Depends on:** ADR-0002 (transaction model — audit is an atomic effect), ADR-0004 (RBAC — audit action verbs align with permission verbs).

## Context

Two tracking layers exist: audit **stamps** (`created_by`/`updated_by`/`created_at`/`updated_at` on every mutable table) and the audit **log** (a separate append-only table with old/new values). The `AuditPort` is already built and correct: `record(entry, tx)` — awaited, written **inside** the transaction, throws on failure. The live P1 is that callers pass `actorName: ''` (empty) and the legacy POS path records audit fire-and-forget outside any transaction.

The AI-generated PRD **contradicts the transaction model**: it states "audit log writes are async (non-blocking) — if audit insert fails, the main transaction still succeeds." ADR-0002 already classified audit as an **atomic** effect. This ADR resolves the contradiction in favour of atomicity.

## Decision

### 1. Audit is atomic (overrides the PRD's async claim)

- Audit records are written **inside the operation's UoW**, awaited, and a failure rolls the operation back. `AuditPort.record(entry, tx)` (already built) is the mechanism.
- The PRD's "async / non-blocking / main tx still succeeds" statement is **consciously rejected**: an audit record that may silently vanish cannot be trusted for accountability ("who voided this order?"). A committed void with a lost audit entry is a lie.

### 2. Action verbs align with RBAC domain verbs

- `AuditEntry.action` is a string covering CRUD (`create`, `update`, `delete`) **and** first-class domain verbs (`complete`, `void`, `void-line`, `ship`, `receive`, `opname-complete`, `adjust`, `close`, …), matching the permission vocabulary from ADR-0004.
- Recording "complete order" as a bare `update` (as the PRD's CRUD-only action set would force) is rejected — it loses meaning.

### 3. Record contents

- **create:** `oldValues = null`, `newValues` = the new record's fields.
- **update:** `oldValues`/`newValues` = **only the changed fields** (reduce noise).
- **delete/deactivate:** `oldValues` = key fields, `newValues = null`.
- **`actorName` is mandatory** — filled from the `Actor` (`actorOf(auth)`, which carries the name). `actorName: ''` is forbidden (closes the P1). `actorId` + `actorName` always come from the `Actor`.
- `summary` is a human-readable line; `metadata` (jsonb) carries extra context (e.g. `{ reason }`).

### 4. One user action = one audit entry

- Audit is recorded at the top-most use-case, on the entity the user operated on.
- **Derived atomic effects do not produce their own audit entry.** Stock deduction triggered by completing an order leaves its trace as the (immutable, `createdBy`-stamped) stock movement, not a second audit row. This avoids double-logging.
- **Event-driven non-critical effects** (table status change, min-stock alert) are **not** audited as user actions — they are system consequences, reconstructable from the originating action's audit entry.

### 5. What is not audited; access; retention

- Not audited: read operations, login/logout (session/security concern), 401/403 (security logging), auto-generated events without user action (cron).
- Read access: permission `audit.read` (ADR-0004 `<slice>.<action>` form), owner-only by default, assignable to custom roles.
- Append-only (never update, never delete). Indexes on `(timestamp)`, `(entity, entity_id)`, `(user_id, timestamp)`, `(module, timestamp)`. Old/new values as JSONB. Retention unlimited for now; cold-storage archival is a future concern.

## Alternatives Considered

- **Async / non-blocking audit (per PRD).** Rejected: reintroduces the P1; an audit that can be lost is not an audit.
- **CRUD-only action set (per PRD).** Rejected: loses domain meaning; misaligned with RBAC verbs.
- **Audit every derived effect separately.** Rejected: double-logging; the stock movement already records the derived change immutably.

## Consequences

- **Easier:** one reliable trail; `actorName` always present; action verbs read naturally and match permissions.
- **Harder:** audit shares the transaction, so a broken audit write fails the operation — correct, but means audit code must be correct. Covered by the same integration tests that prove atomicity.
- **Constraint:** audit inside the UoW (awaited); `actorName` never empty; one entry per user action; action verbs drawn from the RBAC vocabulary.
