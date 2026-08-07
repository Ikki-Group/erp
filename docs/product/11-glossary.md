# Glossary

Domain terminology used throughout Ikki ERP.

## Location & Organization

| Term | Definition |
|------|------------|
| Location | Operational unit — either a store or warehouse. Every data record is scoped here. |
| Store | Location type that sells to customers. Has POS, menu, inventory. |
| Warehouse | Location type for bulk storage. Has inventory only (no POS, no menu). |
| Context | The currently active location in the UI. Determines what data is shown. |

## Menu & Products

| Term | Definition |
|------|------------|
| Menu Item | Sellable product at a store (e.g. Iced Latte). Per-location. |
| Modifier Group | Customization category (Size, Sugar Level, Topping). |
| Modifier Option | Choice within a group (Large, Less Sugar). Has optional price adjustment. |
| Base Price | Menu item price before modifiers. |
| Recipe / BOM | Bill of Materials — materials + quantities that produce one menu item. |
| HPP | Harga Pokok Penjualan (COGS) — cost to produce one menu item from recipe. |

## Materials & Inventory

| Term | Definition |
|------|------------|
| Material | Raw ingredient/supply consumed by recipes. Global catalog (shared). |
| UoM | Unit of Measure (kg, g, L, ml, pcs, karton). |
| UoM Chain | Linked conversions enabling multi-hop resolution (karton→L→ml). |
| Purchase UoM | Unit used when buying from supplier. |
| Storage UoM | Unit used for stock balance tracking. |
| Recipe UoM | Unit used in recipe ingredient lines. |
| Stock Balance | Current quantity of a material at a location (in storage UoM). |
| Stock Movement | Any event changing stock — immutable audit record. |
| Transfer Request | Request to move materials between locations. |
| Stock Opname | Physical inventory count reconciliation. |
| Weighted Average | Cost method: new_cost = (old_qty×old_cost + new_qty×new_cost) / total_qty. |
| Min Stock | Alert threshold — fires when total stock < this value. |

## POS & Sales

| Term | Definition |
|------|------------|
| Order | A customer's purchase at POS. Has line items and payments. |
| Open Bill | Tab — order now, pay later. Lines can be added over time. |
| Close Bill | Counter — order and pay immediately in one action. |
| Split Bill | One order paid by multiple payments (different people/methods). |
| Void (full) | Cancel entire order. Reverses stock + journals. |
| Void (partial) | Cancel one line item. Recalculates totals. |
| Cashier Shift | Work session tracking opening/closing cash. |
| Source | Origin of a transaction: `internal`, `moka`, `manual`. |
| Table | Dine-in seating. Orders can be linked to tables. |

## Finance

| Term | Definition |
|------|------------|
| CoA | Chart of Accounts — hierarchical structure of financial accounts. |
| Journal Entry | Balanced debit/credit record of a financial event. |
| Double-entry | Every debit has an equal credit. Entries always balance. |
| Accrual basis | Record when event occurs, not when cash moves. |
| AP | Accounts Payable — money owed to suppliers. |
| Fiscal Period | Monthly accounting period (open/closed). |
| P&L | Profit & Loss statement (Laba/Rugi). |
| Gross Profit | Revenue - HPP. |
| Net Profit | Gross Profit - Operating Expenses. |

## HR

| Term | Definition |
|------|------------|
| Employee | Staff member (may or may not have system user access). |
| Shift Template | Recurring schedule definition (Pagi 07:00-15:00). |
| Shift Assignment | Employee assigned to shift on specific date. |
| Attendance | Actual clock-in/out record. |
| Payroll Run | Monthly batch salary calculation. |
| Payslip | Individual salary breakdown for one employee. |
| Leave | Time-off request (annual, sick, unpaid). |

## CRM

| Term | Definition |
|------|------------|
| Customer | Registered person (identified by phone at POS). |
| Tier | Loyalty level based on lifetime points. |
| Points | Loyalty currency — earned on purchases, redeemed for discounts. |
| Earn Ratio | Spending per point (default: Rp 10.000 = 1 point). |
| Promotion | Time-bound campaign targeting customer segments. |

## System

| Term | Definition |
|------|------------|
| IAM | Identity & Access Management (users, roles, permissions). |
| RBAC | Role-Based Access Control. |
| Audit Trail | Record of who did what, when. On every mutation. |
| Soft Delete | Mark inactive without removing from database. |

---

**Next:** [12-timeline.md](./12-timeline.md) — Development timeline.
