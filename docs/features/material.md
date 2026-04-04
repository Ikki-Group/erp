# Material / Raw Material Management

The Material / Raw Material Management module is a master data foundation (Layer 1) built specifically for the needs of F&B. It acts as the definitive catalog of every physical item that costs money but is not directly sold as a final product to a customer (e.g., Coffee Beans, Sugar, Cups, Detergent).

## 1. Core Objectives
- **Centralized Stock Identity**: Manage the name, category, and standard costing of all raw materials, packaging, and basic supplies.
- **Unit Conversions (UOM)**: Seamlessly handle the difference between how items are bought, how they are stored, and how they are consumed in a recipe.
- **Stock Guardrails**: Define safety thresholds to prevent Ikki Coffee and Ikki Resto from running out of essential ingredients.

## 2. Key Features

### Categories & Classifications
- Group materials into logical F&B categories to make purchasing and stock opname easier:
  - **Raw Ingredients** (Dry Goods, Wet Goods, Meats, Vegetables)
  - **Packaging/Consumables** (Cups, Lids, Straws, Takeaway Boxes)
  - **Operational Supplies** (Cleaning chemicals, Paper towels)

### Advanced Unit of Measure (UOM) System
- A robust conversion engine is mandatory because restaurants rarely consume items in the exact unit they buy them in.
- **Base Unit vs. Purchase Unit**:
  - Example 1: Buy Fresh Milk in **Carton (12 Liters)** -> Store & Count in **Liters** -> Consume in recipes by **Milliliters (ml)**.
  - Example 2: Buy Coffee Beans by **Karung (50kg)** -> Distribute to outlets by **Pack (1kg)** -> Grind and brew by **Grams (g)**.
- The system must define these conversion multipliers (e.g., 1 Liters = 1000 ml) linked directly to the Material profile.

### Minimum Stock Alerts (Safety Stock)
- **Outlet-Specific Thresholds**: Ikki Coffee might need a minimum of 5kg of Signature Espresso beans on hand at all times, but the Central Warehouse needs a minimum of 50kg.
- When physical stock (managed in the Inventory module) drops below these predefined material thresholds, visual alerts trigger on the dashboard or via notification.

### Cost Tracking (WAC/FIFO)
- The baseline Cost Price of the material is tracked here. As new purchase orders arrive at varying prices (e.g., egg prices going up), the system automatically adjusts the Weighted Average Cost (WAC) per unit for accurate COGS reporting.

## 3. Technical Architecture (Proposed)

### Database Foundations
- `Materials` table stores core static data (Name, Base UOM, Category).
- `Material_Locations` table defines dynamic data (Current Stock, Min Stock Threshold) per location (Gudang Utama vs. Ikki Coffee).
- `UOM_Conversions` table links Base Units to alternative metrics (e.g., 1 Box = 12 Bottles).

### Validation & Integrity
- **Immutability of Base Units**: Once a Material's Base UOM is set and a transaction has occurred (e.g., you received Milk in "Liters"), the Base UOM cannot be changed. This prevents catastrophic conversion math errors across historical inventory ledgers.

## 4. Next Phase Recommendations
1. **Vendor Linking**: Map specific raw materials to preferred suppliers to auto-generate Purchase Orders with 1 click when stock goes low.
2. **Shelf-Life Tracking (FEFO)**: First-Expired-First-Out logic for highly perishable materials like fresh milk, meats, or baked goods.
