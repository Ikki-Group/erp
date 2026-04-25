# Material Master Data

**Layer**: 1 (Master Data) | **Status**: MVP | **Priority**: Critical | **Estimate**: 8 hours

---

## 1. Overview

Materials are ingredients and packaging: Fresh Milk, Espresso Beans, Paper Cups, Napkins. Material module tracks cost per unit, base unit of measure (liters, kg, pieces), reorder points, and supplier info. All inventory movements and recipe costs calculated from material master.

---

## 2. Core Objectives

- **Ingredient Registry**: Define all materials used (name, type, supplier, cost)
- **Unit Standardization**: Specify base unit (liters for milk, kg for beans, pieces for cups)
- **Cost Tracking**: Lock-in cost per unit (used for inventory valuation, COGS calculation)
- **Reorder Points**: Set min/max stock levels (trigger auto-reorder in Phase 2)
- **Supplier Mapping**: Link materials to preferred supplier (for purchasing)
- **Waste Category Tracking**: Different handling for spoilage vs. usage waste

---

## 3. Use Cases & Workflows

### UC-001: Create Material (Add new ingredient)

**Who**: Admin / Procurement  
**When**: New ingredient used (new coffee supplier)  
**Goal**: Add "Arabica Beans Grade A" to system

**Steps**:
1. Admin opens "Create Material"
2. Enters:
   - Name: "Arabica Beans Grade A"
   - Type: "Raw Material" (vs "Packaging", "Supplies")
   - Base Unit: "kg" (all quantities stored in kg)
   - Cost per unit: "$8.50/kg"
   - Preferred Supplier: "Coffee Supplies Ltd"
3. Sets thresholds:
   - Min stock: "20 kg" (reorder when below this)
   - Max stock: "100 kg" (warehouse capacity)
4. Saves → Available for use in recipes, purchases, inventory

**Why it matters**: 
- Standardized unit (all costs & qty in kg, not mixed units)
- Cost locked (COGS accurate, not fluctuating)
- Supplier linked (purchasing knows who to buy from)
- Thresholds set (prevent stockouts)

---

### UC-002: Update Material Cost (Price negotiation)

**Who**: Procurement  
**When**: Supplier raises/lowers price  
**Goal**: Update cost for next purchases/recipes

**Steps**:
1. Procurement negotiates with supplier: "Fresh Milk going from $1.50/L to $1.40/L"
2. Procurement updates Material: "Fresh Milk" cost to "$1.40/L"
3. Next recipe costing uses new cost
4. Next PO reflects new price
5. Historical COGS stays with old cost (past transactions immutable)

**Why it matters**: 
- Price changes reflected in forecasts/recipes
- New purchases use current market cost
- Historical accuracy preserved (old sales show old cost)

---

### UC-003: Check Stock Level Alert (Inventory visibility)

**Who**: Warehouse Manager  
**When**: During shift  
**Goal**: Know which materials need reordering

**Steps**:
1. Manager opens "Inventory" → "Materials"
2. System shows:
   - Fresh Milk: 8L (Min: 20L) ⚠️ RED - TOO LOW
   - Arabica Beans: 45kg (Min: 20kg) ✓ OK
   - Paper Cups: 500 pcs (Min: 1000) ⚠️ RED - TOO LOW
3. Manager clicks "Create Request" for low items
4. System creates purchase request → sent to procurement

**Why it matters**: 
- Visual alerts (red/yellow/green status)
- Proactive reordering (don't wait for stockout)
- Prevents emergency rush orders (cheaper to plan)

---

## 4. Recommended Enhancements (Phase 2+)

- **Material Variants**: Track same milk from different suppliers separately
  - Priority: Nice-to-have (supplier switching)
  - Why: Compare quality/cost across suppliers
  - Estimate: 8 hours

- **Expiration Tracking**: FIFO management, expiration alerts
  - Priority: Important (food safety, prevent spoilage)
  - Why: Dairy/bakery items expire, need tracking
  - Estimate: 12 hours

- **Material Substitutes**: If A not available, use B (with cost adjustment)
  - Priority: Nice-to-have (supply chain resilience)
  - Why: Handle supplier issues without stopping production
  - Estimate: 10 hours

- **Supplier Scorecard**: Track quality, delivery, pricing from each supplier
  - Priority: Nice-to-have (procurement optimization)
  - Why: Data-driven supplier decisions
  - Estimate: 8 hours
