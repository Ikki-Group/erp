# 12: POS shift

**What to build:** A cashier opens a shift, all their orders attach to it, and closing reconciles expected vs actual cash — the session every sale belongs to.

**Blocked by:** 03.

**Status:** ready-for-agent

- [ ] Shift open/close (`handle*`, RBAC `shift.open`/`close`/`close-other`): one open shift per cashier per location (partial unique) (ADR-0006, 0013).
- [ ] Close computes `expectedCash = openingCash + cash payments − cash refunds` (pure Money calculator); variance recorded (ADR-0013).
- [ ] `shift.close-other` lets a manager close another user's shift (ADR-0004, 0013).
- [ ] Exposes shift lookup via `Api` for order creation (ticket 15).
- [ ] Unit tests (expected-cash) + integration (one-open invariant, close reconciliation); `verify` + `test` pass.
