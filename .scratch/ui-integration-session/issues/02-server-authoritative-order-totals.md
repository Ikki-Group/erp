# 02: Server-authoritative order totals (delete client tax math)

**Parent:** Spec A (#47)

**What to build:** The POS new-order screen shows the totals the server produced, not a number computed on the client. The hard-coded tax rate and all client-side subtotal/tax/total arithmetic are removed. The cashier always sees the amount the server will actually record.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `TAX_RATE` constant and the client-side `subtotal`/`taxAmount`/`total` computation are deleted from new-order. No backward-compat path.
- [ ] The order total shown comes from the server-returned order (synced order / order detail) — `subtotal`/`discountAmount`/`taxAmount`/`total`.
- [ ] Before the cart's first line-sync completes, the total shows an honest pending/calculating state rather than a client estimate.
- [ ] The per-item catalog price shown while browsing the menu still renders (server-provided price, not client arithmetic) — this is unchanged.
- [ ] Server HTTP integration test (extend `pos-order.test.ts`) asserts the order's `taxAmount`/`total` after line-sync match `calculateOrderTotals` at the company tax rate — proving the displayed value is server-produced.
- [ ] Implementation is consistent with ADR-0017 (the web client never recomputes money).
