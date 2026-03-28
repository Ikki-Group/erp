# Central Kitchen / Manufacturing

The Central Kitchen module (Layer 2) handles advanced production processing. While the `Recipe` module effortlessly handles direct a-la-carte deductions (like an Iced Latte ordered by a customer), the Central Kitchen module manages scheduled, large-scale batch cooking happening in Gudang Utama or Ikki Resto's main prep kitchen.

## 1. Core Objectives
- **Batch Standardization**: Ensure 50 Liters of signature sauce tastes identical every time by strictly controlling the inputs and outputs.
- **Yield & Shrinkage**: Track exactly how much usable finished product is generated from raw materials (e.g., roasting moisture loss).
- **Process Costing**: Determine the exact HPP of a semi-finished/finished good created in-house.

## 2. Key Features

### Production Work Orders (Perintah Kerja)
- A formal ERP document stating the Production Goal: "Produce 20 kg of Signature Roasted Beans".
- **BOM Allocation**: The system locks 24 kg of *Green Beans* from the warehouse inventory so it cannot be used for anything else during the roasting process.

### Yield Calculation & Shrinkage (Susut)
- F&B production rarely has a 1:1 ratio.
- **Example Flow**:
  1. Input: 24 kg Green Beans (Cost: Rp 100.000/kg $\rightarrow$ Total: Rp 2.400.000).
  2. Roasting Process (Moisture loss ~15-20%).
  3. Output: 20 kg Roasted Beans.
  4. The system calculates the new HPP: Rp 2.400.000 / 20 kg = **Rp 120.000/kg**.
- If shrinkage exceeds standard parameters (e.g., output was only 15 kg), the system flags a "Production Variance" for investigation (burned beans, theft, etc.).

### Automatic Stock Recalibration
- Once the Work Order is marked "Completed" by the Head Roaster/Chef:
  - Raw Materials (`Green Beans`) are permanently deducted.
  - Finished Goods (`Roasted Beans`) are added to the warehouse inventory.

## 3. Technical Architecture (Proposed)
- **Complex Transactions**: Moving raw materials into "Work In Progress (WIP)" and then into "Finished Goods" requires robust SQL Transactions to ensure database states never break mid-process.
- **Integration**: Depends on `Material` (for the BOM) and updates `Inventory` and `Finance`.

## 4. Next Phase Recommendations
- **Overhead Absorption**: Allow the system to add Electricity, Gas, and Labor costs (from HRIS) into the final HPP of the roasted beans, not just the raw ingredient cost.
