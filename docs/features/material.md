# Material / Raw Material Management

**Layer**: 1 (Master Data - Depends on Location)  
**Status**: MVP - Foundation for inventory and recipes  
**Complexity**: Medium (UOM system, cost tracking, stock thresholds)

---

## 1. Overview

The Material module is the master catalog of every physical item that costs money but is not directly sold to customers (e.g., Coffee Beans, Fresh Milk, Sugar, Cups, Detergent). It is foundational for inventory operations and recipe costing.

**Key Distinction**:
- **Material** (Layer 1): What suppliers deliver (e.g., "Fresh Milk 1L Carton")
- **Product** (Layer 0): What customers buy (e.g., "Iced Latte" - made from milk + espresso)

Materials are used by:
- **Recipes** (Bill of Materials links products to materials: 1 Iced Latte = 18g espresso + 150ml milk)
- **Inventory** (Stock movements tracked by material + location)
- **Purchasing** (Purchase orders specify materials to be received)
- **Dashboard** (COGS calculated from material costs)

---

## 2. Core Objectives

- **Centralized Stock Identity**: Single source of truth for all raw materials, packaging, and supplies
- **UOM Conversion System**: Handle buying (cartons), storage (liters), and consumption (milliliters) in different units
- **Stock Thresholds Per Location**: Define min/max stock guardrails per material per location (warehouse needs 50kg espresso, outlet needs 5kg)
- **Cost Tracking (WAC)**: Track Weighted Average Cost for accurate COGS as supplier prices fluctuate
- **Material-Location Binding**: Assign which materials are used at which locations with specific stock parameters

---

## 3. Key Entities & Relationships

```
Material (Master Data)
├─ sku: "MAT-001" (unique identifier)
├─ name: "Fresh Milk 1L Carton"
├─ category_id: FK → MaterialCategory
├─ base_uom: "L" (liters - immutable)
├─ cost_price: 0.75 (WAC - auto-calculated)
└─ is_active: true

MaterialCategory (Hierarchical)
├─ Raw Ingredients
│  ├─ Dry Goods (coffee, sugar, flour)
│  └─ Wet Goods (milk, eggs, cream)
├─ Packaging
│  ├─ Cups
│  └─ Boxes
└─ Operational Supplies
   ├─ Cleaning
   └─ Paper

UOM Conversion (Unit Conversions)
├─ material_id: FK → Material
├─ from_uom: "Carton" (purchase unit)
├─ to_uom: "L" (base unit)
├─ conversion_factor: 12 (1 carton = 12 liters)
└─ is_standard: true

MaterialLocation (Stock Parameters)
├─ material_id: FK → Material
├─ location_id: FK → Location
├─ min_stock: 50 (kg, liters, etc)
├─ max_stock: 200
├─ reorder_point: 75 (trigger for purchase order)
├─ current_stock: 120 (calculated from inventory)
└─ unit: "L" (same as base_uom for consistency)

Relationships:
- Material → MaterialCategory (many-to-one)
- Material → UOM_Conversion (one-to-many, 1 base + N conversions)
- Material → MaterialLocation (one-to-many, one per location)
- Material → RecipeComponent (one-to-many, used in multiple recipes)
- Material → StockMovement (one-to-many, every movement tracked)
- Material → GRN (one-to-many, received via purchase)
```

---

## 4. Use Cases & Workflows

### UC-001: Setup New Material (Procurement creates material master)

**Actors**: Procurement Manager, Admin  
**Precondition**: Need to purchase a new raw material

**Steps**:
1. Procurement opens Material creation form
2. Enters: SKU ("MAT-045"), Name ("Fresh Milk 1L Carton"), Category ("Wet Goods")
3. Sets: Base UOM ("L" for liters), Cost Price ($0.75 WAC estimate)
4. Defines: Purchase UOM ("Carton"), Conversion Factor (1 carton = 12 liters)
5. Assigns to locations:
   - Warehouse: min_stock=50L, max_stock=300L, reorder_point=100L
   - Ikki Coffee: min_stock=5L, max_stock=30L, reorder_point=15L
   - Ikki Resto: min_stock=3L, max_stock=20L, reorder_point=10L
6. System creates Material record
7. On first GRN (Goods Received Note): Cost price auto-calculated via WAC

**Business Rules**:
- SKU must be unique globally
- Base UOM immutable after first stock movement
- Conversion factors must be positive numbers
- Min stock ≤ Reorder point ≤ Max stock
- Category must exist first

**Error Scenarios**:
- SKU already exists → ConflictError "SKU_EXISTS"
- Category not found → NotFoundError
- Invalid UOM → BadRequestError
- Invalid conversion factor (≤0) → BadRequestError

---

### UC-002: Check Low Stock Alert (Daily outlet manager task)

**Actors**: Outlet Manager  
**Precondition**: Material assigned to location with min_stock threshold

**Steps**:
1. Manager opens Dashboard → Inventory section
2. Filters by location: "Ikki Coffee"
3. System shows stock status for each material:
   - Signature Espresso: 3kg (min: 5kg) → **RED ALERT**
   - Fresh Milk: 8L (min: 5L) → OK (YELLOW if ≤ 7L)
   - Sugar: 15kg (min: 10kg) → OK (GREEN)
4. Manager clicks on Espresso → sees details:
   - Current: 3kg
   - Min threshold: 5kg
   - Suggested order: 20kg (to reach max_stock)
   - Last received: 2026-04-22 (25kg purchased)
5. Manager can:
   - Create manual stock request to warehouse
   - Create purchase order (if authority)
   - Or wait for automatic reorder (Phase 2)

**Business Rules**:
- Stock status calculated from latest StockMovement records
- RED: Below min_stock
- YELLOW: Between min and (min + 5 units)
- GREEN: Healthy level
- Only assigned materials shown per user's location

---

### UC-003: Adjust Material Cost (Supplier price change via GRN)

**Actors**: Warehouse Manager, Procurement  
**Precondition**: New GRN received at different price

**Steps**:
1. Supplier invoice: 10 cartons Fresh Milk at $0.80/carton (up from $0.75)
2. Warehouse Manager creates GRN:
   - Material: Fresh Milk
   - Qty: 10 cartons = 120 liters
   - Cost: $96 total ($0.80 per carton)
3. System calculates new WAC:
   - Old: 150L @ $0.75/L = $112.50 (held at warehouse)
   - New: 120L @ $0.80/L = $96.00 (incoming)
   - Combined: 270L for $208.50 = **$0.7722/L** (new WAC)
4. System updates Material.cost_price to $0.7722
5. All recipes using Fresh Milk auto-recalculate COGS
6. Dashboard COGS charts reflect new margin impact

**Business Rules**:
- WAC = (existing_qty × existing_cost + new_qty × new_cost) / (existing_qty + new_qty)
- Cost price recalculated on every GRN
- Historical prices preserved (for COGS snapshot at sale time)
- Manual cost adjustment only by Admin (audit trail required)

---

### UC-004: Convert Between UOM (Recipe uses different unit than purchase)

**Actors**: Chef, Barista  
**Precondition**: Material has UOM conversion defined

**Steps**:
1. Material: Fresh Milk (base_uom = "L")
   - Purchase UOM: Carton (1 carton = 12L)
   - Recipe consumption: Milliliters (1L = 1000ml)
2. Recipe: "Iced Latte" requires 150ml milk
3. System internally converts:
   - 150ml → 0.15L (recipe uses liters)
   - 0.15L ÷ 12 = 0.0125 cartons (procurement sees cartons)
4. When sale happens:
   - Deduct 0.15L from Ikki Coffee stock
   - Warehouse can order in cartons (1, 2, 5, etc.)
5. Monthly opname: Count physical cartons, system converts to liters for accuracy check

**Business Rules**:
- Base UOM immutable to prevent historical data corruption
- Conversions always go through base UOM as bridge
- Conversion factors stored with precision (4 decimal places)
- System validates conversions don't result in fractional base units where not allowed

---

## 5. Data Model

### Material Table

```sql
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES material_categories(id),
  base_uom VARCHAR(20) NOT NULL, -- Immutable after first transaction
  cost_price DECIMAL(10, 4), -- WAC, calculated from GRN
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  CONSTRAINT positive_cost CHECK (cost_price > 0)
)

CREATE UNIQUE INDEX idx_materials_sku ON materials(sku);
CREATE INDEX idx_materials_category ON materials(category_id);
```

### MaterialLocation Table

```sql
CREATE TABLE material_locations (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  min_stock DECIMAL(12, 4) NOT NULL,
  max_stock DECIMAL(12, 4) NOT NULL,
  reorder_point DECIMAL(12, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- Must match material.base_uom
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_material_location UNIQUE(material_id, location_id),
  CONSTRAINT valid_thresholds CHECK (min_stock > 0 AND min_stock <= reorder_point AND reorder_point <= max_stock)
)

CREATE INDEX idx_material_locations_location ON material_locations(location_id);
```

### UOM Conversion Table

```sql
CREATE TABLE uom_conversions (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  from_uom VARCHAR(20) NOT NULL, -- Purchase/alternative unit (e.g., "Carton")
  to_uom VARCHAR(20) NOT NULL, -- Base unit (e.g., "L")
  conversion_factor DECIMAL(12, 4) NOT NULL, -- e.g., 1 carton = 12 liters
  is_standard BOOLEAN DEFAULT true, -- Standard purchase unit
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_factor CHECK (conversion_factor > 0)
)

CREATE INDEX idx_uom_conversions_material ON uom_conversions(material_id);
```

### Key Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `sku` | VARCHAR(50) | Unique identifier | MAT-001 |
| `name` | VARCHAR(255) | Display name | Fresh Milk 1L Carton |
| `category_id` | INTEGER | Material classification | 3 (Wet Goods) |
| `base_uom` | VARCHAR(20) | Storage/base unit (immutable) | L (liters) |
| `cost_price` | DECIMAL(10,4) | Weighted Average Cost | 0.7722 |
| `min_stock` | DECIMAL(12,4) | Minimum threshold per location | 50.0000 |
| `reorder_point` | DECIMAL(12,4) | Trigger for low-stock alert | 75.0000 |
| `max_stock` | DECIMAL(12,4) | Maximum safe level | 200.0000 |
| `conversion_factor` | DECIMAL(12,4) | UOM multiplier | 12.0000 (1 carton = 12L) |

---

## 6. Business Rules & Validations

**Creation Rules**:
- SKU must be unique (case-insensitive)
- SKU format: alphanumeric + hyphen, 3-50 chars
- Category must exist first
- Base UOM must be valid (L, kg, units, etc.)
- Cost price optional on creation (filled on first GRN)

**Update Rules**:
- Cannot change SKU after creation (immutable)
- Cannot change base_uom after first stock movement (prevents conversion chaos)
- Can update: name, category, is_active status
- Cost price is auto-calculated (read-only by user, writable by system via GRN)

**Deletion Rules**:
- Materials never hard-deleted
- Mark as `is_active = false` (soft-delete)
- Inactive materials excluded from recipes and purchases
- Preserved for historical inventory reporting

**Stock Threshold Rules**:
- min_stock ≤ reorder_point ≤ max_stock (enforced by constraint)
- Min stock triggers RED alert in UI
- Reorder point triggers automatic PO creation (Phase 2)
- Max stock prevents over-ordering
- Per-location thresholds allow flexibility (warehouse ≠ outlet)

**UOM Conversion Rules**:
- Conversion factors must be positive (≥ 0.0001)
- At least one conversion must exist for purchase unit
- All internal calculations use base_uom
- Conversions bridge between purchase ↔ storage ↔ consumption units

---

## 7. API Endpoints & Routes

### GET `/materials/list`
**Description**: List all materials with optional filters  
**Auth**: Required (users at assigned locations)  
**Query Params**:
```typescript
{
  page?: number (1-1000),
  limit?: number (1-100, default 20),
  search?: string (searches name, SKU),
  category_id?: number,
  location_id?: number,
  is_active?: boolean (default true)
}
```
**Response**:
```json
{
  "success": true,
  "code": "OK",
  "data": [
    {
      "id": 1,
      "sku": "MAT-001",
      "name": "Fresh Milk 1L Carton",
      "category_id": 3,
      "category_name": "Wet Goods",
      "base_uom": "L",
      "cost_price": 0.7722,
      "is_active": true
    }
  ],
  "meta": { "total": 156, "page": 1, "limit": 20, "pages": 8 }
}
```

### GET `/materials/:id`
**Description**: Get material detail with location-specific stock parameters  
**Auth**: Required (user assigned to location or Admin)  
**Response**:
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "id": 1,
    "sku": "MAT-001",
    "name": "Fresh Milk 1L Carton",
    "base_uom": "L",
    "cost_price": 0.7722,
    "category_id": 3,
    "category_name": "Wet Goods",
    "is_active": true,
    "created_at": "2026-04-01T10:00:00Z",
    "conversions": [
      {
        "from_uom": "Carton",
        "to_uom": "L",
        "conversion_factor": 12.0,
        "is_standard": true
      },
      {
        "from_uom": "L",
        "to_uom": "ml",
        "conversion_factor": 1000.0,
        "is_standard": false
      }
    ],
    "location_parameters": [
      {
        "location_id": 1,
        "location_name": "Gudang Utama",
        "min_stock": 50.0,
        "max_stock": 300.0,
        "reorder_point": 100.0,
        "current_stock": 120.5
      }
    ]
  }
}
```

### POST `/materials/create`
**Description**: Create new material  
**Auth**: Required (Manager+)  
**Body**:
```typescript
{
  sku: "MAT-046",
  name: "Fresh Eggs (Dozen)",
  category_id: 3,
  base_uom: "dozen",
  cost_price?: 2.50
}
```
**Response**: 201 Created with new material data

### PUT `/materials/:id`
**Description**: Update material  
**Auth**: Required (Manager+)  
**Body** (all optional):
```typescript
{
  name?: "Fresh Organic Eggs",
  category_id?: 4,
  is_active?: false
  // Cannot change: sku, base_uom (after transactions)
}
```
**Response**: 200 OK with updated material

### POST `/materials/:id/location-params`
**Description**: Set or update stock parameters for material at specific location  
**Auth**: Required (Admin or Manager at location)  
**Body**:
```typescript
{
  location_id: 1,
  min_stock: 50.0,
  max_stock: 300.0,
  reorder_point: 100.0
}
```
**Response**: 200 OK with updated MaterialLocation record

### GET `/materials/:id/cost-history`
**Description**: Get WAC history (for auditing cost changes)  
**Auth**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "material_id": 1,
    "cost_history": [
      {
        "date": "2026-04-22T14:00:00Z",
        "cost_price": 0.7722,
        "reason": "GRN #456 received at $0.80/carton",
        "qty_affected": 120
      },
      {
        "date": "2026-04-01T10:00:00Z",
        "cost_price": 0.75,
        "reason": "Initial cost (estimated)"
      }
    ]
  }
}
```

---

## 8. Integration Points

### Upstream Dependencies:
- **Location** (Layer 0): Materials assigned to specific locations

### Downstream Dependencies:
- **Recipe** (Layer 2): Recipes map products to materials via components
- **Inventory** (Layer 2): Stock movements tracked by material + location
- **Purchasing** (Phase 2): POs specify materials to purchase
- **Dashboard** (Layer 3): COGS calculated from material costs

### Data Flow:
```
Location (scoping)
  ↓
Material Master (what we buy)
  ├─ UOM Conversions (how we buy vs. use)
  ├─ Cost Price (WAC from supplier)
  └─ Stock Thresholds per location
      ↓
    Recipe (product = materials + conversion)
      ↓
    Inventory (deduct from stock on sale)
      ↓
    Dashboard (COGS = qty used × material cost)
```

---

## 9. Implementation Notes

### Caching Strategy
```typescript
const MATERIAL_CACHE_KEYS = {
  LIST: 'material.list',
  DETAIL: (id: number) => `material.detail.${id}`,
  BY_CATEGORY: (categoryId: number) => `material.category.${categoryId}`,
  CONVERSIONS: (materialId: number) => `material.conversions.${materialId}`,
}

// Cache TTL: 2 hours (materials rarely change, cost changes via GRN only)
// Invalidate on: create, update, delete, GRN receipt (for cost changes)
```

### WAC Calculation Pattern
```typescript
// When GRN received at new cost:
// WAC = (existing_qty × existing_cost + new_qty × new_cost) / total_qty
function calculateWAC(
  existingQty: number,
  existingCost: number,
  newQty: number,
  newCost: number
): number {
  return (existingQty * existingCost + newQty * newCost) / (existingQty + newQty)
}
```

### UOM Conversion Pattern
```typescript
// Always convert through base_uom:
// Target Unit ← Base UOM ← Source Unit

// Example: 150ml to cartons (base=L)
// ml → L: 150ml ÷ 1000 = 0.15L
// L → Carton: 0.15L ÷ 12 = 0.0125 cartons
```

### Performance Considerations
- Materials typically 50-200 items (small dataset)
- Index on `category_id` and `sku` for fast lookup
- MaterialLocation indexed by location for per-outlet views
- WAC recalculation (via GRN) triggers cache invalidation for recipes

---

## 10. Future Enhancements (Phase 2+)

- **Vendor Linking**: Map materials to preferred suppliers for 1-click PO generation
- **Shelf-Life Tracking (FEFO)**: First-Expired-First-Out for perishables
- **Bulk UOM Management**: Import conversion tables from supplier specs
- **Cost Variance Analysis**: Track price fluctuations for budgeting
- **Material Alternatives**: Map substitute materials (if espresso unavailable, use local roast)
- **Supplier Performance**: Track delivery times, quality, price history

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: Location (Layer 0)  
**Estimated Implementation**: 10-12 hours
