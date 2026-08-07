# PRD: Finance

Specifications for Chart of Accounts, Journal Entries, Accounts Payable, and Financial Reporting. Proper double-entry accrual accounting.

## Overview

Every monetary event produces a balanced journal entry (debit = credit). The system auto-generates journals from operational events (sales, purchases, payroll) and supports manual entries for expenses like rent, utilities, and maintenance.

## Chart of Accounts (CoA)

### Fields

| Field | Type | Description |
|-------|------|-------------|
| code | string | Account code (e.g. "1-1001") |
| name | string | Account name |
| type | enum | `asset`, `liability`, `equity`, `revenue`, `expense` |
| parentId | FK? | Parent account (hierarchy, max 3 levels) |
| normalBalance | enum | `debit`, `credit` |
| isSystem | boolean | System-defined (cannot delete) |
| isActive | boolean | Active toggle |

### System Accounts (auto-created)

| Code | Name | Type | Normal |
|------|------|------|--------|
| 1-1001 | Kas | asset | debit |
| 1-1002 | Bank | asset | debit |
| 1-2001 | Persediaan Bahan Baku | asset | debit |
| 2-1001 | Hutang Usaha | liability | credit |
| 3-1001 | Modal | equity | credit |
| 4-1001 | Pendapatan Penjualan | revenue | credit |
| 5-1001 | HPP (Harga Pokok Penjualan) | expense | debit |
| 5-2001 | Beban Gaji | expense | debit |
| 5-3001 | Beban Sewa | expense | debit |
| 5-4001 | Beban Operasional | expense | debit |

### Business Rules

- Account codes are unique.
- System accounts cannot be deleted or have type changed.
- Accounts with posted entries cannot be deleted (deactivate instead).
- Custom accounts can be created for: utilities, marketing, maintenance, etc.

## Journal Entry

### Header

| Field | Type | Description |
|-------|------|-------------|
| entryNo | string | Auto-generated |
| date | date | Transaction date |
| description | string | What this entry records |
| source | enum | `auto_sales`, `auto_purchase`, `auto_payroll`, `manual` |
| referenceType | string? | Source document type |
| referenceId | string? | Source document ID |
| locationId | FK? | Location scope (null = company-wide) |
| status | enum | `draft`, `posted`, `voided` |
| postedBy | FK? | Who posted |
| postedAt | timestamp? | When posted |

### Journal Line

| Field | Type | Description |
|-------|------|-------------|
| entryId | FK | Parent entry |
| accountId | FK | CoA account |
| debit | decimal | Debit amount (0 if credit line) |
| credit | decimal | Credit amount (0 if debit line) |
| description | string? | Line description |

### Auto-Journal Mappings

| Operational Event | Debit | Credit |
|-------------------|-------|--------|
| POS sale completed (revenue) | Kas / Bank | Pendapatan Penjualan |
| POS sale completed (COGS) | HPP | Persediaan Bahan Baku |
| Goods received (credit purchase) | Persediaan Bahan Baku | Hutang Usaha |
| Goods received (cash purchase) | Persediaan Bahan Baku | Kas / Bank |
| Supplier payment | Hutang Usaha | Kas / Bank |
| Payroll paid | Beban Gaji | Kas / Bank |
| Void sale | Reverse of original entries |
| Rent expense (manual) | Beban Sewa | Kas / Bank |

### Business Rules

- Every entry must balance: Σ debits = Σ credits.
- Posted entries are **immutable** — corrections create reversing entries.
- Auto-generated entries are created instantly on the triggering event.
- Manual entries require `accountant` or `owner` role.
- Draft entries do not affect reports. Only posted entries count.

## Accounts Payable (Hutang Usaha)

### Purpose

Track money owed to suppliers (credit purchases with payment terms).

### How It Works

When goods are received on credit (supplier with payment terms):
1. Journal: debit Persediaan, credit Hutang Usaha.
2. AP record created with due date (receipt date + payment terms days).
3. When supplier is paid: debit Hutang Usaha, credit Kas/Bank.

### AP Record Fields

| Field | Type | Description |
|-------|------|-------------|
| supplierId | FK | Supplier owed |
| referenceType | string | Source document (e.g. "receiving") |
| referenceId | string | Source document ID |
| amount | decimal | Total owed |
| paidAmount | decimal | Amount paid so far |
| status | enum | `unpaid`, `partial`, `paid` |
| dueDate | date | When payment is due |
| paidAt | timestamp? | When fully paid |

### Business Rules

- AP is created automatically on credit purchases.
- Partial payments allowed (update `paidAmount`).
- Status auto-updates based on paidAmount vs amount.
- Overdue AP shown on dashboard as alert.

## Operational Expenses

### Purpose

Record non-purchase expenses: rent, utilities, maintenance, misc.

### Flow

Manual journal entry (or simplified expense form):
1. User selects expense account (Beban Sewa, Beban Operasional, etc.)
2. Enter amount, date, description, location.
3. System creates journal: debit expense account, credit Kas/Bank.

### Expense Categories (via CoA)

- Beban Sewa (rent)
- Beban Listrik & Air (utilities)
- Beban Maintenance
- Beban Marketing
- Beban Operasional Lainnya

## Financial Reports

### Profit & Loss (Laba/Rugi)

```
Pendapatan Penjualan (revenue accounts)
- HPP (COGS accounts)
= Laba Kotor (Gross Profit)
- Beban Operasional (expense accounts excl. HPP)
= Laba Bersih (Net Profit)
```

Filterable by: date range, location, all locations.

### Balance Sheet (Neraca)

```
Assets = Liabilities + Equity
```

Point-in-time snapshot. Company-wide (not per-location).

### Cash Flow (Arus Kas)

Simplified:
- Cash in: from sales (cash payments)
- Cash out: supplier payments, payroll, expenses
- Net cash movement per period

### Business Rules

- Reports use posted entries only (not drafts).
- Per-location P&L available. Balance sheet is company-wide.
- Fiscal periods are monthly. Closing a period prevents new postings.

## Fiscal Period

| Field | Type | Description |
|-------|------|-------------|
| year | integer | Fiscal year |
| month | integer | 1-12 |
| status | enum | `open`, `closed` |
| closedBy | FK? | Who closed |
| closedAt | timestamp? | When closed |

### Business Rules

- Only `owner` or `accountant` can close a period.
- Closed periods reject new journal postings.
- Reopening requires `owner` + audit log entry.

---

**Next:** [08-prd-hr.md](./08-prd-hr.md) — HR module.
