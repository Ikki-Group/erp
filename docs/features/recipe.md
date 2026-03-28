# Recipe & Bill of Materials (BOM)

The Recipe & Bill of Materials (BOM) module (Layer 2) bridges the gap between Inventory (Raw Materials) and Sales (Finished Goods/Target Menu). In the F&B industry (Ikki Coffee & Ikki Resto), it serves as the definitive guide to exactly how a menu item is constructed and provides automatic, real-time calculation of Food & Beverage Cost (HPP/COGS).

## 1. Core Objectives
- **Standardization**: Enforce strict portion control and standardized taste profiles across outlets.
- **Auto-Deduction Engine**: Enable the Inventory module to deduct the precise amount of raw materials when an item is sold via the POS.
- **Margin Visibility**: Provide owners with real-time gross profit margins by comparing the Recipe Cost against the Selling Price.

## 2. Key Features

### Exact Material Composition
- **Ingredient Mapping**: Define exact quantities of raw materials needed for each finished product. 
  - *Example (Iced Mocha):* 18g Espresso Beans + 150ml Fresh Milk + 20ml Chocolate Syrup + 1 Plastic Cup + 1 Straw + 1 Lid.
- **Yields & Portions**: Manage batch recipes where 1 production step serves multiple portions (e.g., Cooking 5kg of Rice yields 25 plates).

### Multi-Level (Sub-Recipes)
- Support for intermediate prep tasks (Half-Finished Goods / *Bahan Setengah Jadi*).
- **Example**: 
  - Sub-Recipe (Prep): "House-made Vanilla Syrup" = 1kg Sugar + 500ml Water + 2 Vanilla Beans.
  - Final Recipe: "Vanilla Latte" uses 20ml of the "House-made Vanilla Syrup" sub-recipe.
- This is critical for kitchen efficiency in Ikki Resto (e.g., marinades, sauces, prepped doughs).

### Real-Time Cost Calculation (HPP Viewer)
- The system automatically rolls up the Weighted Average Cost (WAC) of each raw material to determine the total **Recipe Cost** of the final dish.
- If the price of Fresh Milk rises from your supplier (logged via Purchasing), the Recipe Cost for *every* milk-based coffee drink auto-updates instantly, allowing quick pricing decisions by management.

## 3. Technical Architecture (Proposed)

### Database Structure
- **Many-to-Many Relationship**: Links the `Products` table (the menu item sold on POS) to the `Materials` table (the raw ingredient in the warehouse) via a `Recipe_Lines` join table.
- **Recursive Sub-Recipes**: `Recipe_Lines` can reference another `Recipe` to support unlimited depths of sub-components (marinades inside a burger inside a combo meal).

### Calculation Optimization
- **Trigger/Event-based Rebuilds**: Because calculating deep, multi-level recipe costs across an entire menu is heavy, the system should cache the total Recipe Cost. The cache is only invalidated and recalculated when a corresponding Material's cost price changes or the recipe structure is modified by a Head Chef.
- **Strict Validations**: Prevent infinite loops (Circular Dependencies) in sub-recipes (e.g., Recipe A cannot require Recipe B if Recipe B requires Recipe A).

## 4. Next Phase Recommendations
1. **Menu Engineering (Stars & Dogs Analysis)**: Visual charts plotting Recipe Profit Margin vs Sales Volume to help management identify what items to promote or remove.
2. **Version Control**: Keep a history of recipe changes (e.g., "We reduced sugar from 20g to 15g on August 1st") to track how flavor modifications affected costs or sales.
