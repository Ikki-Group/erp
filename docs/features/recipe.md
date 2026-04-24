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

## 3. Key Entities & Relationships

```
Recipe (BOM Header)
├─ id: 15
├─ product_id: FK → Product (Iced Latte)
├─ yield: 1 (servings per recipe)
├─ total_cost: 2.20 (auto-calculated COGS)
├─ cost_updated_at: 2026-04-24T15:00:00Z
├─ is_active: true
└─ version: 1 (for future version tracking)

RecipeComponent (BOM Line Items)
├─ recipe_id: FK → Recipe
├─ material_id: FK → Material (or FK → Recipe for sub-recipe)
├─ quantity: 18 (in material's base_uom: grams)
├─ is_sub_recipe: false (or true if references recipe_id)
├─ cost_per_unit: 0.05 (material WAC at component creation)
├─ total_cost: 0.90 (qty × cost)
├─ sort_order: 1
└─ notes: "Shots for iced latte"

Sub-Recipe Example:
Recipe: "House Vanilla Syrup"
├─ RecipeComponent: Material Sugar, qty=1000g
├─ RecipeComponent: Material Water, qty=500ml
└─ RecipeComponent: Material Vanilla Beans, qty=2

Recipe: "Vanilla Latte"
├─ RecipeComponent: Material Espresso, qty=18g
├─ RecipeComponent: Sub-Recipe "House Vanilla Syrup", qty=20ml
├─ RecipeComponent: Material Milk, qty=150ml
└─ RecipeComponent: Material Cup, qty=1

Relationships:
- Recipe → Product (one-to-one)
- Recipe → RecipeComponent (one-to-many)
- RecipeComponent → Material (many-to-one)
- RecipeComponent → Recipe (many-to-one, for sub-recipes)
```

---

## 4. Use Cases & Workflows

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

## 5. Data Model

### Recipe Table

```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE REFERENCES products(id),
  yield DECIMAL(12, 4) DEFAULT 1.0, -- Servings or batch size
  total_cost DECIMAL(10, 4), -- Sum of all components
  cost_updated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
)

CREATE UNIQUE INDEX idx_recipes_product ON recipes(product_id);
```

### RecipeComponent Table

```sql
CREATE TABLE recipe_components (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL, -- NULL if sub-recipe
  sub_recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL, -- NULL if material
  quantity DECIMAL(12, 4) NOT NULL,
  cost_per_unit DECIMAL(10, 4), -- Snapshot of material cost at component creation
  total_cost DECIMAL(10, 4), -- qty × cost_per_unit
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT material_or_recipe CHECK (
    (material_id IS NOT NULL AND sub_recipe_id IS NULL) OR
    (material_id IS NULL AND sub_recipe_id IS NOT NULL)
  )
)

CREATE INDEX idx_recipe_components_recipe ON recipe_components(recipe_id);
```

---

## 6. Business Rules & Validations

**Recipe Rules**:
- One recipe per product (one-to-one)
- At least one component required
- Yield must be positive (> 0)
- Cannot delete product after recipe created (marks inactive instead)

**Component Rules**:
- Component quantity must be positive
- Either material_id OR sub_recipe_id (not both, not neither)
- Material cost snapshot taken at component creation
- Circular dependencies prevented (Recipe A ↔ B ↔ A blocked)

**Cost Calculation**:
- total_cost = Σ(component.quantity × component.cost_per_unit)
- cost_updated_at tracks when cost last recalculated
- Cost recalculation triggered by: material cost change, recipe structure change

**Sub-Recipe Rules**:
- Sub-recipe cost = total component cost
- Usage cost = (usage_qty / sub_recipe_yield) × sub_recipe.total_cost
- Unlimited nesting depth (but validate for cycles)

---

## 7. API Endpoints & Routes

### POST `/recipes/create`
**Body**:
```typescript
{
  product_id: 1,
  yield: 1,
  components: [
    { material_id: 5, quantity: 18, notes: "Espresso shots" },
    { material_id: 1, quantity: 150, notes: "Fresh milk" }
  ]
}
```
**Response**: 201 Created with calculated total_cost

### PUT `/recipes/:id`
**Body**:
```typescript
{
  components: [
    { material_id: 5, quantity: 20 }, // Updated qty
    { material_id: 1, quantity: 150 }
  ]
}
```
**Response**: 200 OK, recalculates cost

### GET `/recipes/:id`
**Response**:
```json
{
  "id": 15,
  "product_id": 1,
  "product_name": "Iced Latte",
  "total_cost": 1.065,
  "selling_price": 5.00,
  "margin": 3.935,
  "margin_pct": 78.7,
  "components": [
    { "material_id": 5, "material_name": "Espresso", "quantity": 18, "unit": "g", "cost": 0.90 }
  ]
}
```

### GET `/recipes/profitability-analysis`
**Query**: `?location_id=1&period=2026-04`
**Response**: Margin analysis with sales volume

---

## 8. Integration Points

### Upstream Dependencies:
- **Product** (Layer 0): Recipe attached to product
- **Material** (Layer 1): Components are materials
- **IAM** (Layer 1): User audit trail

### Downstream Dependencies:
- **Inventory** (Layer 2): Auto-deduction when items sold
- **Sales** (Layer 2): COGS calculated from recipe
- **Dashboard** (Layer 3): Profitability metrics

---

## 9. Implementation Notes

### Caching Strategy
```typescript
const RECIPE_CACHE_KEYS = {
  DETAIL: (recipeId: number) => `recipe.detail.${recipeId}`,
  COST: (recipeId: number) => `recipe.cost.${recipeId}`,
}

// Invalidate on: material cost change, recipe component change
```

### Circular Dependency Detection
```typescript
// When adding sub-recipe component:
function detectCycles(recipeId, subRecipeId, visited = new Set()) {
  if (visited.has(recipeId)) return true // Cycle found
  visited.add(recipeId)
  
  const components = await getRecipeComponents(recipeId)
  for (const comp of components) {
    if (comp.sub_recipe_id && detectCycles(comp.sub_recipe_id, subRecipeId, visited)) {
      return true
    }
  }
  return false
}
```

---

## 10. Future Enhancements (Phase 2+)

- **Recipe Versioning**: Track cost history and changes over time
- **Menu Engineering**: Stars/Dogs analysis (margin vs volume)
- **Ingredient Substitutions**: Alternative materials with cost impact
- **Batch Scaling**: Calculate cost/yield for different batch sizes
- **Allergen Tracking**: Link allergens from materials to products

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: Product (Layer 0), Material (Layer 1)  
**Estimated Implementation**: 8-10 hours
