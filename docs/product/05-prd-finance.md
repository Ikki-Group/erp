# PRD: Finance

Specifications for the accounting and financial reporting module — double-entry bookkeeping integrated with operations.

## Purpose

Provide real-time financial visibility by automatically generating journal entries from operational events (sales, purchases, production). Eliminate manual bookkeeping for routine transactions.

## Core concepts

| Concept | Description |
| ------- | ----------- |
| Chart of Accounts (CoA) | Hierarchical list of all accounts |
| Journal Entry | A balanced set of debits and credits |
| Journal Line | Single debit or credit within an entry |
| Ledger | Running balance per account |
| Fiscal Period | Monthly accounting period (open/closed) |

## Chart of Accounts

### Account types

| Type | Normal balance | Examples |
| ---- | -------------- | -------- |
| Asset | Debit | Cash, Bank, Inventory, Receivables |
| Liability | Credit | Accounts Payable, Tax Payable |
| Equity | Credit | Owner's Capital, Retained Earnings |
| Revenue | Credit | Sales Revenue, Other Income |
| Expense | Debit | COGS, Rent, Salaries, Utilities |

### Account fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| code | string | Account number (e.g. "1-1001") |
| name | string | Account name |
| type | enum | asset, liability, equity, revenue, expense |
| parentId | FK? | Parent account (for hierarchy) |
| isSystem | boolean | System-created, cannot delete |
| isActive | boolean | Active toggle |

### Business rules

- Account codes follow a numbering scheme: 1xxxx = asset, 2xxxx = liability, 3xxxx = equity, 4xxxx = revenue, 5xxxx = expense.
- System accounts are seeded on setup and cannot be deleted.
- Accounts with posted transactions cannot be deleted (only deactivated).

## Journal Entry

### Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| date | date | Transaction date |
| reference | string | Source document reference |
| description | string | What this entry represents |
| sourceType | enum | `sales`, `purchase`, `production`, `payment`, `adjustment`, `manual` |
| sourceId | FK? | Link to originating document |
| locationId | FK | Location scope |
| status | enum | `draft`, `posted`, `voided` |

### Journal Line fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| accountId | FK | Which account |
| debit | decimal | Debit amount (0 if credit) |
| credit | decimal | Credit amount (0 if debit) |
| description | string? | Line-level memo |

### Business rules

- Total debits MUST equal total credits (enforced at DB level).
- Posted entries cannot be edited — only voided and re-created.
- Voiding creates a reverse entry.
- Entries in a closed fiscal period cannot be modified.

## Auto-journal mapping

Operations create journal entries automatically:

| Event | Debit | Credit |
| ----- | ----- | ------ |
| Sales (cash) | Cash | Sales Revenue |
| Sales (receivable) | Accounts Receivable | Sales Revenue |
| Sales COGS | Cost of Goods Sold | Inventory |
| Purchase receipt | Inventory (material) | Accounts Payable |
| Purchase payment | Accounts Payable | Cash/Bank |
| Production consumption | WIP / Finished Goods | Raw Material Inventory |
| Payment received | Cash/Bank | Accounts Receivable |
| Payroll | Salary Expense | Cash/Bank |
| Stock adjustment (loss) | Inventory Loss | Inventory |

## Fiscal Period

| Field | Type | Description |
| ----- | ---- | ----------- |
| year | integer | Fiscal year |
| month | integer | Month (1–12) |
| status | enum | `open`, `closed`, `locked` |

### Rules

- Only one period can be open at a time per location.
- Closing a period prevents new entries in that period.
- Year-end closing transfers P&L balances to Retained Earnings.

## Reports

| Report | Description |
| ------ | ----------- |
| Trial Balance | All account balances for a period |
| Income Statement (P&L) | Revenue - Expenses for a period |
| Balance Sheet | Assets = Liabilities + Equity at a point in time |
| General Ledger | All transactions for an account |
| Cash Flow | Inflows and outflows by category |

### Business rules

- Reports can be scoped by location or consolidated.
- Reports respect fiscal period boundaries.
- All monetary values use decimal (string) to avoid floating-point errors.

---

**Next:** [06-prd-hr.md](./06-prd-hr.md) — HR module.
