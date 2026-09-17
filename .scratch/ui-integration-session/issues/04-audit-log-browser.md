# 04: Audit-log browser route

**Parent:** Spec B (#48)

**What to build:** A dedicated, filterable audit-log page listing every recorded mutation, so an owner/auditor can review system activity in one place and open any entry to see its old/new values and actor. This wires the previously defined-but-unused `auditResource.list`/`detail` endpoints.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A list route under settings (e.g. `settings/audit`) using the standard `useServerTable` + URL-state pattern that other list routes follow.
- [ ] Table is backed by `auditResource.list`; toolbar filters cover the fields `AuditLogFilterDto` already supports: search, module, entity, entityId, user, action, dateFrom, dateTo.
- [ ] Opening a row shows its detail (old/new values + actor) via `auditResource.detail`.
- [ ] Route is gated on the `audit.read` permission; a nav entry is added.
- [ ] After this ticket, no `auditResource` endpoint is defined-but-unused.
- [ ] Loading/empty/error states use the standard primitives.
- [ ] Server HTTP integration test (extend `audit.test.ts`) asserts `audit/list` filtering (module/entity/user/action/date range) and detail retrieval return the expected records.
