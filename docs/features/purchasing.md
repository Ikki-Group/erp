# Purchasing & Procurement

The Purchasing & Procurement module (Planned Layer 2/3) tracks the lifecycle of acquiring raw materials from external suppliers (e.g., buying 50kg of coffee beans or daily fresh vegetables). For Ikki Group, this is vital because **every new purchase updates the base cost of your recipes**.

## 1. Core Objectives
- **Cost Tracking (HPP Updates)**: If the price of fresh milk jumps from Rp 20.000 to Rp 25.000 per carton, the ERP must catch this in the Purchase Order and immediately raise the HPP for every milk-based coffee in the system.
- **Supplier Validation**: Ensure the warehouse staff only receives the exact quantity of goods that the owner actually ordered and approved.
- **Cash Flow Visibility**: Track how much money is currently tied up in "Pending Orders" to external vendors.

## 2. Key Transaction Types

### Purchase Requisition (PR)
- **Internal Request Flow**: The Head Barista or Head Chef submits a formal digital request outlining what supplies are running low at the outlet or warehouse.
- **Approval Queue**: The General Manager reviews the PR, modifies quantities if needed, and approves it to become a Purchase Order.

### Purchase Order (PO)
- **Vendor Contract**: The official order sent to the supplier (e.g., PT Sumber Susu). It locks in the expected Date of Delivery, Quantity, and the Negotiated Price.
- **Status Tracking**: Tracks if an order is Draft, Sent, Partially Received, or Fully Received.

### Goods Receipt Note (GRN)
- **Physical Reception**: When the supplier's truck arrives at *Gudang Utama*, the warehouse staff opens the ERP and creates a GRN linked to the PO.
- **Strict Validation**: The system prevents the staff from inputting 15 cartons of milk if the PO only authorized 10, thus preventing costly mistakes or fraud.
- **Inventory Integration (Auto-Add)**: The moment a GRN is "Finalized", the inventory balances in the warehouse automatically increase, and the `Material` module recalculates its Weighted Average Cost (WAC) based on the new invoice price.

## 3. Technical Architecture (Proposed)

### Service Layer Intersections
- The `PurchasingService` depends heavily on `Location` (where the goods are going) and `Material` (the master catalog of UOMs and items).
- When a GRN finalizes, it invokes the `InventoryService.addStock()` method to ensure the inventory ledger remains the single source of truth for stock movement.

### Accounting Safety Net
- **Non-Deletable Final Records**: Once a PO is fulfilled and a GRN is finalized, it cannot be deleted ("Soft-Deletes/Voids" only) because it has permanently altered the company's financial Cost of Goods (COGS) average.

## 4. Next Phase Recommendations
1. **Invoice Matching**: Connecting the GRN with the actual Supplier Invoice to handle cases where the supplier charged a different amount than what was negotiated on the PO.
2. **Auto-Generate PRs**: When a material hits its Minimum Threshold (from the `Material` module), automatically generate a Draft PR to speed up the ordering process for the manager.
