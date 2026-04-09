# Product Data Management

The Product Data Management module (Layer 0) is the foundational master data for all finished goods. In the context of Ikki Coffee and Ikki Resto, a "Product" represents the menu items sold to customers via the POS system.

## 1. Core Objectives

- **Centralized Menu Catalog**: Serve as the single source of truth for all menu items across the Ikki Group (Coffee & Resto).
- **POS Synchronization Foundation**: Act as the anchor point where external data (from Moka POS) maps to internal data (Recipes & Inventory).
- **Sales Structuring**: Manage categories, variants, and pricing tiers required for analytical reporting.

## 2. Key Features

### Product Registry

- **Menu Items**: Core products like "Iced Caramel Macchiato" or "Nasi Goreng Spesial".
- **SKU/Item Codes**: Unique identifiers to prevent duplication during POS synchronization.
- **Selling Price Management**: Base price definitions (Note: Real-time dynamic pricing might still reside in the POS, but the ERP needs a benchmark to calculate expected profit margins).

### Categories & Structuring

- Organize the menu to match the POS layout:
  - _Categories_: Beverages, Main Course, Pastries.
  - _Sub-categories_: Coffee, Non-Coffee, Rice Bowls.
- This categorization is crucial for the Dashboard module to show charts like "Top Performing Categories".

### Variants & Modifiers

- Manage product options that affect the recipe and inventory:
  - **Size Variants**: (e.g., Regular vs. Large) -> _Large uses more milk and needs a different Recipe mapping._
  - **Add-on Modifiers**: (e.g., Extra Espresso Shot, Extra Cheese) -> _Extra Shot deducts +18g of Coffee Beans._

## 3. The Core Concept: Products vs. Materials

To understand the ERP's architecture, one must strictly differentiate between Layer 0 (Products) and Layer 1 (Materials):

- **Product (`Layer 0`)**: "Iced Latte" (What the customer buys / What Moka POS tracks).
- **Material (`Layer 1`)**: "Roasted Espresso Beans", "Fresh Milk", "Plastic Cup" (What you buy from suppliers / What the Gudang tracks).
- _The `Recipe` module connects these two._

## 4. Technical Architecture (Proposed)

### Database Foundations

- `Products` table: Basic details (Name, SKU, Base Price).
- `Product_Categories` table: Parent-child category tree.
- `Product_Variants` table: Links a base product to its actionable variants (e.g., linking "Hot Latte" to "Oat Milk option").
- **Zero External Dependencies**: Because this is Layer 0, the `Products` table cannot import or depend on Inventory or Materials. It only holds the Menu definitions.

## 5. Next Phase Recommendations

1. **Promotional Bundles**: Support for bundling products (e.g., "Paket Hemat: Kopi + Roti") which forces the POS integration to unpack the bundle and deduct recipes for both items.
2. **Sales Target Definition**: Allow management to set monthly sales volume targets per Product Category to track performance on the dashboard.
