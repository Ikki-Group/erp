# Inventory Operations

The Inventory Operations module is a transactional engine (Layer 2) that manages the physical movement of raw materials (ingredients, packaging) and finished goods across Ikki Group's central warehouses and active outets (Ikki Coffee & Ikki Resto).

## 1. Core Objectives

- **Accurate Traceability**: Track stock movements accurately from the moment goods arrive at the central storage until they are consumed or sold at the outlet.
- **Waste Management**: Specifically handle F&B realities like spoilage, expired ingredients, and accidental waste.
- **Stock Opname (Cycle Count)**: Facilitate fast End-of-Shift (EoS) or End-of-Day (EoD) stock taking for baristas and chefs.

## 2. Key Transaction Types

### 2.1 Inbound (Stock In)

- **Receiving from Suppliers**: Goods Receipt Notes (GRN) when bulk ingredients (e.g., 50kg Coffee Beans, 100 boxes of Milk) arrive at _Gudang Utama_.
- **Direct to Outlet**: Occasional direct deliveries from suppliers straight to _Ikki Resto_ or _Ikki Coffee_ kitchens.

### 2.2 Internal Transfers

- **Stock Request (Permintaan Barang)**: A simple digital form where an Outlet Manager or Head Chef requests ingredients from the Central Warehouse.
- **Stock Transfer (Pengiriman Barang)**: The actual movement of goods from `Gudang Utama` $\rightarrow$ `Ikki Coffee (Bar)`. Stock is deducted from the warehouse and added to the outlet's active inventory.

### 2.3 Outbound (Stock Out & Consumption)

- **Recipe Deductions (Auto-Deduct)**: Integration with POS sales or Sales Orders causes automatic reduction of raw materials based on the Bill of Materials/Recipe (e.g., selling 1 Iced Latte auto-deducts 18g espresso, 150ml milk, 1 cup, 1 straw).
- **Waste & Spoilage (Manual Deduct)**: Logging broken items (e.g., dropped glass), expired merchandise (e.g., spoiled milk), or kitchen test-tastings to ensure accurate COGS (Cost of Goods Sold).

## 3. Stock Opname (Physical Count)

Given the fast-paced nature of F&B, opname is handled pragmatically:

- **Sheet Generation**: System generates a digital checklist of expected stock for a specific location (e.g., _Ikki Coffee - Bar Area_).
- **Data Entry**: Baristas input the _actual_ physical count.
- **Discrepancy Resolution**: The system highlights variances (Expected vs. Actual). Large variances require Supervisor/Manager approval before adjusting the final database records (Adjustment Hub).

## 4. Technical Architecture (Proposed)

### Performance & Safety

- **Database Transactions (ACID)**: Movement between locations (Transfer from Warehouse to Outlet) must be wrapped in strict database transactions. If the `ADD` query inside the Outlet fails, the `DEDUCT` query in the Warehouse must roll back.
- **FIFO/WAC Valuation**: System dynamically calculates the Weighted Average Cost (WAC) per ingredient to provide accurate gross profit margins on daily sales dashboards.
- **Historical Ledgers**: Use an append-only `inventory_ledger` table to write every single transaction (In, Out, Transfer, Waste). The current stock balance is an aggregation of this ledger, ensuring 100% auditability.

## 5. Next Phase Recommendations

1. **Low Stock Push Notifications**: Push alerts to the Outlet Manager's phone when critical items (like Signature Coffee Beans or Milk) fall below the daily minimum threshold.
2. **Predictive Ordering**: Suggesting stock request quantities based on historical sales data (e.g., ordering more cups before the weekend).
