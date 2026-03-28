# Supplier & Vendor Management (SRM)

The Supplier Relationship Management (SRM) module (Layer 1) stores crucial Master Data regarding the external vendors that supply Ikki Coffee, Ikki Resto, and Gudang Utama. It extends the capability of the Purchasing module by managing business relationships rather than just items.

## 1. Core Objectives
- **Centralized Contact Handling**: Ensure all buyer-supplier communication and data (Bank accounts, PIC names) are stored in the ERP, not scattered in a manager's WhatsApp.
- **Price Control**: Lock negotiated pricing for raw materials to prevent accidental overspending.
- **Performance Evaluation**: Track how reliable a supplier is regarding delivery times and quality.

## 2. Key Features

### Vendor Master Registry
- Profiles for each supplier storing Legal Name, Tax ID (NPWP), Address, PIC Contact, and their designated Bank Accounts for AP (Accounts Payable) transfers.
- **Payment Terms (TOP)**: Set default terms for each vendor (e.g., COD, NET 14, NET 30).

### Purchase Agreements / Price Catalogs
- The Owner or General Manager can define a "Price Lock" for a specific material from a specific vendor.
- **Example**: Contracted price for Fresh Milk from PT Sumber Susu is Rp 18.000/Liter until December 2026.
- The Purchase Order (PO) creation form will strictly enforce this pre-approved price, denying any manual overrides by purchasing staff.

### Supplier Evaluation & Lead Time Tracking
- The system measures the gap between the PO created date and the Goods Receipt Note (GRN) finalized date.
- **Performance Metrics**: Identify if a meat supplier is consistently 2 days late, directly impacting kitchen readiness at Ikki Resto.

## 3. Technical Architecture (Proposed)
- **Relational Integrity**: The `Vendors` table is the parent of the `Purchase_Orders` table. The `Vendor_Items` junction table handles the Price Catalogs mapping `Vendors` $\leftrightarrow$ `Materials`.

## 4. Next Phase Recommendations
- **Vendor Portal Extranet**: A limited external dashboard where suppliers can log in to view requested POs, submit their invoices, and check when they will get paid by Ikki Group Finance.
