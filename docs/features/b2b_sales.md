# B2B Sales & Distribution

The B2B Sales & Distribution module (Layer 2/3) manages wholesale operations. While Moka POS expertly handles retail transactions (B2C: walk-in customers buying coffee cups), this module handles large-volume sales (B2B: Ikki Group selling 100kg of roasted beans or 50 liters of signature syrup to partner cafes or franchises).

## 1. Core Objectives

- **Wholesale Order Tracking**: Manage the full lifecycle of a bulk order from Quotation to Final Payment.
- **Credit Terms Management**: Handle B2B realities where clients do not pay upfront, tracking Piutang (Accounts Receivable).
- **Inventory Protection**: Hard-allocate stock to large orders so the retail outlets (Ikki Coffee) do not accidentally use up beans promised to B2B clients.

## 2. Key Features

### Customer Relationship Database (CRM)

- Store partner client data, delivery addresses, PIC contacts, and agreed-upon discount tiers (e.g., "Wholesale VIP - 15% off").

### The Fulfillment Pipeline

1. **Sales Quotation (SQ)**: Draft pricing sent to the B2B client for approval.
2. **Sales Order (SO)**: The confirmed order. _Crucial ERP Action:_ This formally reserves the inventory in Gudang Utama so it cannot be transferred to Ikki Resto.
3. **Delivery Order (DO)**: The document printed for the driver. When the DO is signed and marked "Shipped", the inventory is officially deducted from the system forever.

### B2B Invoicing & Accounts Receivable

- Once the DO is complete, generate a formal B2B Invoice (Faktur) indicating the total amount and payment due date (e.g., Net 30).
- Unpaid invoices automatically populate the `Finance` module's Accounts Receivable (Piutang) dashboard.

## 3. Technical Architecture (Proposed)

- **Clear Separation of Duty**: This module intentionally operates parallel to the `Moka` integration. B2C sales flow through Moka into the ERP as completed transactions, whereas B2B sales natively originate inside the ERP's Sales Pipeline.
- **Ledger Interlocks**: Generates complex double-entry journals:
  - On Delivery: `Credit: Inventory`, `Debit: COGS`.
  - On Invoice: `Debit: Accounts Receivable`, `Credit: Sales Revenue`.

## 4. Next Phase Recommendations

- **Automated Payment Reminders**: Send automated WhatsApp or Email reminders to B2B clients 3 days before their Invoice due date.
- **Return Merchandize Authorization (RMA)**: Handle wholesale return scenarios (e.g., 5kg of beans arrived damaged and need to be restocked into Quarantine).
