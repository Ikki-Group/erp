# Recipe & Bill of Materials (BOM)

**Layer**: 2 (Operations - Depends on Product, Material, Inventory)  
**Status**: MVP - Cost calculation engine  
**Complexity**: Medium (nested recipes, cost rollup, COGS calculation)

---

## 1. Overview

Recipe is the bridge between Products (what customers buy) and Materials (what we purchase). It defines exactly which materials are needed in what quantities to create each menu item, and auto-calculates COGS (Cost of Goods Sold) based on material costs. Every menu item has one recipe; complex items may use sub-recipes.

---

## 2. Core Objectives

- **Standardization**: Enforce consistent portion sizes and cost calculations across all outlets
- **Auto-Deduction**: Enable inventory to auto-deduct materials when items are sold
- **COGS Calculation**: Real-time recipe cost = Σ(component_qty × material_cost)
- **Margin Visibility**: Compare recipe cost vs. selling price for profitability analysis
- **Sub-Recipe Support**: Handle complex items using intermediate prep (sauces, syrups, prepped ingredients)

---

## 3. Use Cases & Workflows

### UC-001: Create Recipe for Product (New menu item launch)

**Actors**: Chef, Product Manager, Manager  
**Precondition**: Product exists, all materials created

**Steps**:
1. Manager launches new product: "Iced Mocha"
2. Product.cost_price currently NULL (waiting for recipe)
3. Chef creates Recipe for Iced Mocha:
   - Product: Iced Mocha
   - Yield: 1 (one serving)
4. Chef adds components:
   - Espresso: 18g @ $0.05/g = $0.90
   - Fresh Milk: 150ml @ $0.80/L = $0.12
   - Chocolate Syrup: 20ml @ $0.10/ml = $0.02
   - Cup: 1 @ $0.02 = $0.02
   - Straw: 1 @ $0.01 = $0.01
   - Lid: 1 @ $0.005 = $0.005
5. System calculates total_cost: $1.065
6. System updates Product.cost_price = $1.065
7. System calculates margin: ($5.00 - $1.065) / $5.00 = 78.7% margin
8. Chef reviews: margin looks healthy
9. Recipe activated, available for sales

**Business Rules**:
- Product must exist before recipe
- All materials must have cost_price (from WAC)
- Quantity must be positive
- At least one component required
- Circular dependencies prevented (Recipe A cannot use Recipe B if B uses A)

---

### UC-002: Update Recipe Cost (Material price changes via GRN)

**Actors**: System (automatic)  
**Precondition**: Material cost updated in Material module

**Steps**:
1. GRN received: Fresh Milk price increased to $0.85/L (from $0.80/L)
2. System updates Material.cost_price to $0.85
3. System triggers: Invalidate all recipe caches using Fresh Milk
4. Next time recipe cost requested:
   - Espresso: 18g @ $0.05/g = $0.90
   - Fresh Milk: 150ml @ $0.85/L = **$0.1275** (updated)
   - Other components unchanged
   - New total_cost: $1.0825 (was $1.065)
5. System updates Recipe.total_cost
6. Product margin recalculated: ($5.00 - $1.0825) / $5.00 = 78.35% (down 0.35%)
7. Dashboard shows margin change
8. Manager alerted: "Milk cost increased, review menu pricing"

**Business Rules**:
- Cost recalculation automatic, no human action needed
- Historical cost snapshot preserved (for past sales COGS)
- Cost update doesn't affect already-shipped orders (COGS locked at time of shipment)

---

### UC-003: Create Sub-Recipe (Prep ingredients for efficiency)

**Actors**: Chef, Kitchen Manager  
**Precondition**: Recipes for base ingredients exist

**Steps**:
1. Chef standardizes: "House Vanilla Syrup" used in 5 drinks
2. Creates sub-recipe:
   - Product: NULL (not a saleable item, just a prep ingredient)
   - Name: "House Vanilla Syrup"
   - Components:
     * Sugar: 1000g @ $0.001/g = $1.00
     * Water: 500ml @ $0.001/ml = $0.50
     * Vanilla Beans: 2 @ $0.50 = $1.00
     * Total sub-recipe cost: $2.50
3. Sub-recipe yield: 500ml (amount produced)
4. Chef uses sub-recipe in "Vanilla Latte":
   - RecipeComponent: Sub-Recipe "House Vanilla Syrup", qty: 20ml
   - System calculates component cost: (20ml / 500ml) × $2.50 = $0.10
5. Final Vanilla Latte recipe cost includes $0.10 for syrup
6. On sales, inventory auto-deducts: syrup ingredients proportionally

**Business Rules**:
- Sub-recipes are internal (not sold directly)
- Sub-recipe cost calculated by yield: cost per unit = total_cost / yield
- Unlimited nesting (recipe can use recipe using recipe...)
- No circular dependencies (detected on save)

---

### UC-004: View Recipe Cost Analysis (Profitability review)

**Actors**: Manager, Owner  
**Precondition**: Recipes created with sales history

**Steps**:
1. Manager opens: Dashboard → Menu Profitability
2. Filters by location: Ikki Coffee
3. Views recipe analysis:
   | Product | Selling Price | Recipe Cost | Margin | Margin % | Sales (30d) | COGS (30d) |
   |---------|--------------|------------|--------|----------|------------|-----------|
   | Iced Latte | $5.00 | $1.065 | $3.935 | 78.7% | 1200 units | $1,278 |
   | Iced Mocha | $6.00 | $1.083 | $4.917 | 81.95% | 800 units | $866 |
   | Espresso Shot | $2.50 | $0.45 | $2.05 | 82% | 500 units | $225 |

4. Manager can:
   - Sort by margin % to find margin leaders
   - Sort by sales volume to find volume leaders
   - Identify "stars" (high margin + high volume)
   - Identify "dogs" (low margin + low volume)
5. Manager decides to increase Iced Latte price to $5.50 (margin too good, underselling)

**Business Rules**:
- COGS calculated from actual inventory deductions (not estimated)
- Recipe cost = current material costs (real-time)
- Margin analysis based on sales orders shipped (not pending)

---

## 4. Recommended Enhancements (Phase 2+)

- **Recipe Versioning**: Track cost history and changes over time
- **Menu Engineering**: Stars/Dogs analysis (margin vs volume)
- **Ingredient Substitutions**: Alternative materials with cost impact
- **Batch Scaling**: Calculate cost/yield for different batch sizes
- **Allergen Tracking**: Link allergens from materials to products

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: Product (Layer 0), Material (Layer 1)  
**Estimated Implementation**: 8-10 hours
