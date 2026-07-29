# Glossary

Domain terminology and definitions used across Ikki ERP documentation and code.

## General

| Term        | Definition                                                                      |
| ----------- | ------------------------------------------------------------------------------- |
| Location    | A physical place where business operations happen (store, warehouse, kitchen)   |
| Actor       | The authenticated user performing an action (referenced as `actorId`)           |
| Entity      | A business object stored in the database (e.g. Product, Sales Order)            |
| Module      | A vertical slice of business functionality in the codebase                      |
| Soft delete | Marking a record as deleted (`deletedAt`) without removing it from the database |

## Financial

| Term                      | Definition                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------- |
| CoA (Chart of Accounts)   | The complete list of accounts used for bookkeeping                                      |
| Journal Entry             | A balanced record of debits and credits for a financial event                           |
| Double-entry              | Accounting principle: every transaction has equal debits and credits                    |
| Debit                     | Left side of an entry. Increases assets/expenses, decreases liabilities/equity/revenue  |
| Credit                    | Right side of an entry. Decreases assets/expenses, increases liabilities/equity/revenue |
| GL (General Ledger)       | Complete record of all financial transactions by account                                |
| AP (Accounts Payable)     | Money owed to suppliers                                                                 |
| AR (Accounts Receivable)  | Money owed by customers                                                                 |
| COGS (Cost of Goods Sold) | Direct cost of producing/purchasing items that were sold                                |
| WIP (Work in Progress)    | Materials that have entered production but are not yet finished goods                   |
| Fiscal Period             | A monthly accounting period that can be opened or closed                                |
| P&L (Profit & Loss)       | Income Statement — revenue minus expenses for a period                                  |
| BS (Balance Sheet)        | Financial position at a point in time (Assets = Liabilities + Equity)                   |
| MDR                       | Merchant Discount Rate — fee charged by payment processor                               |

## Inventory

| Term             | Definition                                                        |
| ---------------- | ----------------------------------------------------------------- |
| SKU              | Stock Keeping Unit — unique identifier for a product variant      |
| UoM              | Unit of Measure (kg, pcs, L, ml)                                  |
| Weighted Average | Cost method: total cost of stock / total units = cost per unit    |
| FIFO             | First In First Out — cost method where oldest stock is sold first |
| Stock Opname     | Physical inventory count to reconcile system vs actual            |
| Reorder Point    | Minimum stock level that triggers a replenishment alert           |
| Safety Stock     | Buffer stock above reorder point to prevent stockouts             |

## Production

| Term                    | Definition                                                          |
| ----------------------- | ------------------------------------------------------------------- |
| BOM (Bill of Materials) | Recipe — list of materials needed to produce one batch of a product |
| Yield                   | Number of finished units produced from one batch                    |
| Wastage                 | Expected material loss during production (expressed as %)           |
| Variance                | Difference between theoretical (recipe) and actual consumption      |

## Purchasing

| Term                | Definition                                                          |
| ------------------- | ------------------------------------------------------------------- |
| PO (Purchase Order) | Document sent to a supplier to request materials                    |
| Goods Receipt       | Acknowledgment that ordered materials have been physically received |
| 3-way Match         | Verification that PO, receipt, and invoice quantities/amounts agree |
| Lead Time           | Days between placing a PO and receiving the goods                   |
| Payment Terms       | Agreed number of days before payment is due (e.g. Net 30)           |

## Sales

| Term          | Definition                                                      |
| ------------- | --------------------------------------------------------------- |
| Sales Type    | Channel through which a sale occurs (dine-in, takeaway, GoFood) |
| Settlement    | End-of-day reconciliation of payments received vs expected      |
| Discount      | Price reduction — applied at line level or order level          |
| Tax Inclusive | Price shown already includes tax                                |
| Tax Exclusive | Tax is added on top of the displayed price                      |

## HR

| Term        | Definition                                           |
| ----------- | ---------------------------------------------------- |
| Base Salary | Fixed compensation before allowances and deductions  |
| Allowance   | Additional compensation (meal, transport)            |
| Deduction   | Amount subtracted from gross pay (absence, advances) |
| Net Salary  | Final amount paid after all calculations             |
| Overtime    | Hours worked beyond the standard shift               |

## Technical

| Term             | Definition                                                          |
| ---------------- | ------------------------------------------------------------------- |
| Port             | TypeScript interface that a repository implements — enables testing |
| DTO              | Data Transfer Object — Zod schema for API input/output              |
| handleX          | Service method that routes call — the HTTP entrypoint               |
| Composition Root | `_registry.ts` — where all modules are wired together               |
| Narrow Interface | A `Pick<>` type selecting only needed methods from another module   |

---

**Next:** [10-glossary.md](./10-glossary.md) — Domain terminology and definitions.
