# PRD: Auto-Journal Rules

Detailed rules for automatic journal entry generation from operational events.

## Account Strategy

- **Global accounts** — one Chart of Accounts for the entire company.
- **Location scoping via journal_entries.location_id** — filter journals by location for per-location reporting.
- No duplicate accounts per location (one "Kas" account, not "Kas Coffee" + "Kas Resto").

## Payment Method → Account Mapping

Each payment method type maps to a specific account:

| Payment Type | Target Account | Rationale |
|-------------|----------------|-----------|
| `cash` | Kas (1-1001) | Physical cash in register |
| `digital` (QRIS, GoPay, OVO, etc.) | Bank (1-1002) | Assumed immediate settlement |
| `card` (debit/credit) | Bank (1-1002) | Same as digital |
| `transfer` | Bank (1-1002) | Direct bank transfer |

Digital payments use "Bank" directly (Opsi A — no intermediary receivable account). This simplifies bookkeeping while remaining accurate for most F&B operations where settlements are near-instant.

## Kas Fisik vs Digital Tracking

To enable end-of-day cash vs digital breakdown:

- Reports filter journal lines by the payment method that triggered them.
- Each auto-journal from POS carries `reference_type: 'order'` + `reference_id` → link back to order → link to payments → know which method.
- Dashboard shows: cash revenue (physical), digital revenue (QRIS/card/e-wallet), total.

This does NOT require separate accounts — it's a reporting-level split using payment data.

## Auto-Journal: POS Sale Completed

When an order status changes to `completed`:

### Revenue Entry

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Kas (if cash payment) | order.total | — |
| 1 | Bank (if digital payment) | order.total | — |
| 2 | Pendapatan Penjualan (4-1001) | — | order.total |

If **split payment** (part cash, part digital):

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Kas | cash_amount | — |
| 2 | Bank | digital_amount | — |
| 3 | Pendapatan Penjualan | — | order.total |

### COGS Entry (simultaneous)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | HPP (5-1001) | total_hpp | — |
| 2 | Persediaan Bahan Baku (1-2001) | — | total_hpp |

Where `total_hpp` = sum of (recipe ingredient qty × material cost_price) for all order lines.

### Journal Metadata

```
source: 'auto_sales'
reference_type: 'order'
reference_id: order.id
location_id: order.location_id
status: 'posted' (auto-posted, no draft)
description: 'Penjualan {order_no}'
```

## Auto-Journal: Order Voided

When a completed order is voided, create a **reversing entry**:

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Pendapatan Penjualan | void_amount | — |
| 2 | Kas / Bank | — | void_amount |
| 3 | Persediaan Bahan Baku | total_hpp | — |
| 4 | HPP | — | total_hpp |

```
source: 'auto_sales'
description: 'Void {order_no}'
```

## Auto-Journal: Goods Received (Inventory)

When a receiving is recorded:

### Credit Purchase (supplier with payment terms)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Persediaan Bahan Baku (1-2001) | total_cost | — |
| 2 | Hutang Usaha (2-1001) | — | total_cost |

```
source: 'auto_purchase'
reference_type: 'receiving'
reference_id: receiving.id
```

### Cash Purchase (no credit, paid immediately)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Persediaan Bahan Baku (1-2001) | total_cost | — |
| 2 | Kas / Bank | — | total_cost |

```
source: 'auto_purchase'
```

Decision (credit vs cash) is based on: if `receiving.supplier_id` is set AND supplier has `payment_terms > 0` → credit. Otherwise → cash.

## Auto-Journal: Supplier Payment

When an AP record is (partially) paid:

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Hutang Usaha (2-1001) | payment_amount | — |
| 2 | Kas / Bank | — | payment_amount |

```
source: 'auto_purchase'
reference_type: 'ap_payment'
reference_id: accounts_payable.id
```

## Auto-Journal: Payroll Paid

When payroll run status becomes `paid`:

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Beban Gaji (5-2001) | total_net_salary | — |
| 2 | Bank | — | total_net_salary |

```
source: 'auto_payroll'
reference_type: 'payroll_run'
reference_id: payroll_run.id
location_id: payroll_run.location_id (or null for company-wide)
```

## Auto-Journal: Operational Expense

When user records an expense via the expense form:

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | {selected expense account} | amount | — |
| 2 | Kas / Bank | — | amount |

```
source: 'manual'
description: user-provided description
location_id: active location
```

## Summary of Triggers

| Event | Source | Accounts Affected |
|-------|--------|-------------------|
| Order completed | `auto_sales` | Kas/Bank ↔ Pendapatan, HPP ↔ Persediaan |
| Order voided | `auto_sales` | Reverse of above |
| Goods received (credit) | `auto_purchase` | Persediaan ↔ Hutang Usaha |
| Goods received (cash) | `auto_purchase` | Persediaan ↔ Kas/Bank |
| Supplier paid | `auto_purchase` | Hutang Usaha ↔ Kas/Bank |
| Payroll paid | `auto_payroll` | Beban Gaji ↔ Bank |
| Expense recorded | `manual` | {Expense account} ↔ Kas/Bank |

## System Accounts (Minimum Required)

| Code | Name | Type | Normal Balance |
|------|------|------|----------------|
| 1-1001 | Kas | asset | debit |
| 1-1002 | Bank | asset | debit |
| 1-2001 | Persediaan Bahan Baku | asset | debit |
| 2-1001 | Hutang Usaha | liability | credit |
| 3-1001 | Modal | equity | credit |
| 4-1001 | Pendapatan Penjualan | revenue | credit |
| 5-1001 | HPP | expense | debit |
| 5-2001 | Beban Gaji | expense | debit |
| 5-3001 | Beban Sewa | expense | debit |
| 5-4001 | Beban Listrik dan Air | expense | debit |
| 5-5001 | Beban Operasional Lainnya | expense | debit |

These are auto-created on first setup. Owner can add more expense accounts as needed.

---

**Next:** [08-prd-hr.md](./08-prd-hr.md) — HR module.
