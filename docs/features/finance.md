# Finance & Accounting

The Finance & Accounting module (Layer 2/3) serves as the ultimate aggregator of the ERP's financial health. While other modules track operations (liters, kilograms, clicks), this module translates everything into Rupiah and tracks the cash flow for Ikki Coffee and Ikki Resto.

## 1. Core Objectives
- **Automate Bookkeeping**: Transform daily operational data (Moka Sales, Gudang Purchases) into standard accounting journal entries automatically.
- **Track Expenses (Opex)**: Capture daily petty cash expenses happening at the outlet level.
- **Visibility & Reporting**: Generate real-time Profit & Loss (P&L) statements, eliminating the need to wait until the end of the month.

## 2. Key Features

### Chart of Accounts (CoA) & General Ledger
- Standardized, multi-level Chart of Accounts tailored for F&B (e.g., Asset Bank, Inventory Asset, COGS, Labor Expense, Operational Expense).
- **Auto-Journaling**: When a Goods Receipt Note (GRN) is finalized, the system automatically runs a journal entry debiting "Inventory" and crediting "Accounts Payable".

### Petty Cash & Operational Expenses (Expense Tracking)
- Baristas or Outlet Managers can submit digital structured forms for daily out-of-pocket expenses (e.g., Rp 50.000 for Ice Cubes from a vendor, Rp 20.000 for trash collection).
- Manager approval triggers direct posting to the ledger as an Operational Expense (Opex).

### Accounts Payable (Hutang) & Accounts Receivable (Piutang)
- **Accounts Payable (AP)**: Tracks unpaid Supplier Invoices generated from the Purchasing module. Sends warnings when a *Term of Payment* (e.g., NET 14 Days) is nearing its due date.
- **Accounts Receivable (AR)**: Tracks unpaid B2B Invoices (if Ikki Group sells roasted beans to other cafes in bulk).

## 3. Financial Statements (Reporting)
- **Profit & Loss (Laba Rugi)**: Live calculation of Gross Revenue (Sales) $\rightarrow$ Gross Profit (minus COGS) $\rightarrow$ Net Profit (minus Opex & Payroll). This can be filtered globally or per-outlet (Ikki Coffee vs Ikki Resto).
- **Balance Sheet (Neraca)**: Real-time view of assets vs liabilities.
- **Cash Flow (Arus Kas)**: Movement of actual liquid cash.

## 4. Technical Architecture (Proposed)
- **Double-Entry Safeguard**: Database logic enforces that every Ledger entry must balance ($Debit = Credit$), ensuring absolute accounting integrity. Entries cannot be deleted; corrections must be handled via formal Reversal Journals.

## 5. Next Phase Recommendations
- **Bank Reconciliation Integration**: API integration with Mandiri/BCA to auto-match bank mutations with ERP invoices.
