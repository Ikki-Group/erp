# Inventory Operations

**Layer**: 2 (Operations - Depends on Product, Location, Material, IAM)  
**Status**: MVP - Core transactional engine  
**Complexity**: High (ledger system, stock movements, opname, ACID transactions)

---

## 1. Overview

The Inventory module is the transactional heart of the ERP. It tracks every physical movement of materials (ingredients, packaging) and finished goods—from supplier delivery to consumption at each location. It provides:
- Accurate stock tracking via append-only ledger
- Waste and spoilage logging
- Monthly stock opname (physical count reconciliation)
- FIFO/WAC cost valuation
- Reserved stock for pending sales orders

---

## 2. Core Objectives

- **Complete Traceability**: Audit trail of every stock movement (in/out/transfer/waste)
- **Accurate Stock Balance**: Current stock = sum of all ledger transactions
- **Waste Management**: Log spoilage, breakage, waste to prevent profit leakage
- **Opname Reconciliation**: Monthly physical count validates system accuracy
- **COGS Accuracy**: Stock movements linked to sales for exact margin calculation
- **Location Isolation**: Prevent stock from one outlet mixing with another

---

## 3. Key Entities & Relationships

```
StockMovement (Transaction Record)
├─ id: 1
├─ material_id: FK → Material
├─ from_location_id: FK → Location (nullable for inbound)
├─ to_location_id: FK → Location (nullable for outbound)
├─ type: "inbound" | "transfer" | "waste" | "recipe_deduction"
├─ quantity: 50 (in base_uom: liters, kg, etc)
├─ reference_id: "GRN-001" or "SO-042" (PO, SO, etc)
├─ notes: "Received from supplier" or "Spoiled milk"
├─ created_by: FK → User
├─ created_at: 2026-04-24T15:00:00Z
└─ status: "pending" | "approved" | "rejected"

StockLedger (Append-Only Journal)
├─ id: 1
├─ material_id: FK → Material
├─ location_id: FK → Location
├─ movement_id: FK → StockMovement
├─ quantity_change: +50 or -10 (signed)
├─ balance_after: 150 (running balance)
├─ unit: "L" (base_uom)
├─ cost_per_unit: 0.75 (WAC at time of transaction)
├─ total_cost: 37.50 (qty × cost, for COGS)
├─ created_at: 2026-04-24T15:00:00Z
└─ [Immutable once created]

StockOpname (Monthly Physical Count)
├─ id: 1
├─ location_id: FK → Location
├─ period: "2026-04" (monthly)
├─ status: "draft" | "in_progress" | "submitted" | "approved"
├─ total_variance: 2.5 (total % difference)
├─ created_by: FK → User
├─ submitted_by: FK → User
├─ approved_by: FK → User
├─ created_at: 2026-04-24T09:00:00Z
└─ completed_at: 2026-04-30T17:00:00Z

OpnameLineItem (Physical Count Detail)
├─ opname_id: FK → StockOpname
├─ material_id: FK → Material
├─ expected_stock: 120.5 (from ledger)
├─ physical_count: 118.0 (what was counted)
├─ variance: -2.5 (physical - expected)
├─ variance_pct: -2.07%
├─ variance_reason: "Spillage" (damage, expiry, theft, error)
├─ approval_required: false (if variance < 5%)
├─ status: "approved" | "rejected" | "pending_approval"
└─ notes: "Found 2.5L milk spilled in storage"

Relationships:
- StockMovement → Material (many-to-one)
- StockMovement → Location (from/to, two foreign keys)
- StockMovement → User (who created movement)
- StockMovement → StockLedger (one-to-one when created)
- StockLedger → Material + Location (composite key for current stock query)
- StockOpname → Location (one-to-many, one opname per location per month)
- StockOpname → OpnameLineItem (one-to-many, one per material)
```

---

## 4. Use Cases & Workflows

### UC-001: Receive Stock from Supplier (GRN creation)

**Actors**: Warehouse Manager, Receiving Staff  
**Precondition**: Material exists, supplier sent goods, GRN generated

**Steps**:
1. Supplier delivers 50 cartons Fresh Milk to Gudang Utama
2. Warehouse staff creates GRN (Good Received Note):
   - Material: Fresh Milk (base_uom: L)
   - Quantity: 50 cartons = 600L (conversion applied)
   - Cost per unit: $0.80/carton = $40 total
   - Date received: 2026-04-24T14:00:00Z
   - Reference: "PO-123" or supplier invoice
3. System creates StockMovement:
   - type: "inbound"
   - from_location_id: NULL (external supplier)
   - to_location_id: 1 (Gudang Utama)
   - quantity: 600 (in liters)
   - status: "pending"
4. Warehouse Manager reviews + approves
5. System creates StockLedger entry:
   - Warehouse milk: +600L
   - Balance after: 1200L (was 600L before)
   - Cost per unit: $0.80/L (recalculated WAC)
   - Total cost: $480
6. System updates Material.cost_price (if first time or significant change)
7. Warehouse can now transfer milk to outlets

**Business Rules**:
- GRN can only be created by warehouse staff
- Quantity in base_uom (conversions applied)
- Cost per unit locked at receipt (WAC calculation)
- Approval triggers ledger creation (not before)
- Material-Location thresholds checked (alert if exceeds max_stock)

---

### UC-002: Transfer Stock Between Locations (Outlet requests from warehouse)

**Actors**: Outlet Manager, Warehouse Manager  
**Precondition**: Warehouse has stock, outlet has min_stock threshold

**Steps**:
1. Barista at Ikki Coffee checks stock: 3L milk (min: 5L) → RED ALERT
2. Outlet Manager creates StockRequest:
   - Material: Fresh Milk
   - Requested Qty: 20L
   - Reason: "Low stock, need for today"
3. Warehouse Manager sees request, approves
4. Warehouse staff packs 20L milk, updates system: StockMovement:
   - type: "transfer"
   - from_location_id: 1 (Gudang Utama)
   - to_location_id: 2 (Ikki Coffee)
   - quantity: 20L
   - reference_id: "REQUEST-456"
5. System processes in transaction:
   ```
   BEGIN TRANSACTION
     DEDUCT 20L from warehouse ledger (Gudang Utama)
     ADD 20L to outlet ledger (Ikki Coffee)
     Record movement as approved
   COMMIT (if both succeed) or ROLLBACK (if either fails)
   ```
6. Ledgers updated:
   - Warehouse: 1200L → 1180L
   - Ikki Coffee: 3L → 23L (healthy level)
7. Outlet Manager receives notification: "Stock received"

**Business Rules**:
- Transfer must respect valid transfer paths (warehouse ↔ outlet/kitchen)
- Cannot transfer more than source location has
- Both locations must be active
- Transaction wrapping prevents partial updates
- Ledger entries created simultaneously (atomic)

---

### UC-003: Log Waste / Spoilage (Manual stock deduction)

**Actors**: Barista, Kitchen Manager  
**Precondition**: Stock exists at location

**Steps**:
1. Barista discovers 2L milk is expired, cannot use
2. Opens Waste Entry form:
   - Material: Fresh Milk
   - Quantity: 2L
   - Reason: "Expiration date passed"
   - Notes: "Batch from 2026-04-10"
3. System creates StockMovement:
   - type: "waste"
   - from_location_id: 2 (Ikki Coffee)
   - to_location_id: NULL (consumed/destroyed)
   - quantity: 2L
   - reference_id: "WASTE-789"
4. Manager approves (if configured as required)
5. System creates StockLedger:
   - Ikki Coffee milk: 23L → 21L
   - Cost deducted: 2L × $0.80/L = $1.60
6. Dashboard shows waste accumulation:
   - Daily waste: $12.50
   - Weekly waste: $87.30
   - Waste %: 2.1% of COGS (alert if > 3%)

**Business Rules**:
- Waste can be logged by barista/chef but must be tracked
- Reason required (expiry, damage, spillage, taste test, other)
- Waste movements typically don't require approval (quick log)
- Waste aggregated per location for variance analysis
- Large waste amounts (>10% of monthly) require manager review

---

### UC-004: Recipe Deduction (Auto-deduct on sale)

**Actors**: System (automatic on sale)  
**Precondition**: Sales order created, recipe exists, stock reserved

**Steps**:
1. Customer orders: 1 Iced Latte + 1 Espresso Shot
2. Sales order created (status: "draft")
3. System reserves stock (not yet deducted):
   - Milk: 150ml reserved
   - Espresso: 18g + 20g = 38g reserved
   - Cup: 1 reserved
4. Order confirmed → Status: "confirmed"
5. Sales order shipped (delivered to customer)
6. System auto-creates StockMovements:
   - Milk: -150ml (recipe deduction)
   - Espresso: -38g (recipe deduction)
   - Cup: -1 (recipe deduction)
7. Creates StockLedger entries:
   - Ikki Coffee milk: 21L → 20.85L
   - Espresso: 5kg → 4.962kg
   - Cups: 500 → 499
8. Updates SalesOrderLine with actual cost:
   - COGS per latte = (0.15L × $0.80) + (38g × $0.05) + (1 × $0.02) = $0.14

**Business Rules**:
- Deductions happen only after order shipped (not on draft)
- Quantities converted from recipe consumption units to material base_uom
- Cost snapshot taken at deduction time (for COGS accuracy)
- Cannot deduct if stock insufficient (should be reserved earlier)
- All deductions logged as single recipe_deduction movement

---

### UC-005: Monthly Stock Opname (Physical count & reconciliation)

**Actors**: Barista, Kitchen Manager, Location Manager, Admin  
**Precondition**: Month-end reached, locations need reconciliation

**Steps**:
1. **System prepares opname**:
   - Creates StockOpname record (period: "2026-04", location: Ikki Coffee)
   - Generates list of expected stock (from latest ledger balance)
   - Expected: Milk 21.5L, Espresso 4.9kg, Cups 480
2. **Barista performs physical count**:
   - Downloads opname form
   - Counts each material physically
   - Enters actual counts: Milk 21.0L, Espresso 4.9kg, Cups 475
3. **System calculates variances**:
   - Milk variance: -0.5L (-2.3%) [spillage expected]
   - Espresso: 0.0kg (perfect!) [0%]
   - Cups: -5 units (-1.0%) [breakage expected]
4. **Review & Approval**:
   - Small variances (< 5%) auto-approved
   - Large variances flagged for manager review
   - Manager approves: "Milk spillage OK, Cups breakage normal"
5. **System posts adjustments**:
   - Creates adjustment StockMovements (type: "opname_adjustment")
   - Updates ledgers to match physical count:
     * Milk: 21.5L → 21.0L (deduct 0.5L variance)
     * Cups: 480 → 475 (deduct 5 unit variance)
6. **Dashboard updated**:
   - Stock accuracy: 98.2% (2 items matched, 1 variance)
   - Last opname date: 2026-04-30
   - Monthly waste attributed: $0.40 (milk) + $0.10 (cups) = $0.50

**Business Rules**:
- Opname once per month per location (configurable period)
- Only active materials appear on opname list
- Physical count in original units (not base_uom conversions)
- Variances must be explained (reason field)
- Large variances (>10%) require admin approval
- Approved adjustments are immutable (audit trail)

---

## 5. Data Model

### StockMovement Table

```sql
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('inbound', 'transfer', 'outbound', 'waste', 'recipe_deduction', 'opname_adjustment')),
  quantity DECIMAL(12, 4) NOT NULL,
  reference_id VARCHAR(100), -- GRN, SO, PO, WASTE, etc
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  CONSTRAINT check_locations CHECK (
    (type = 'inbound' AND from_location_id IS NULL AND to_location_id IS NOT NULL) OR
    (type = 'transfer' AND from_location_id IS NOT NULL AND to_location_id IS NOT NULL) OR
    (type IN ('outbound', 'waste', 'recipe_deduction') AND from_location_id IS NOT NULL AND to_location_id IS NULL) OR
    (type = 'opname_adjustment' AND from_location_id IS NOT NULL AND to_location_id IS NULL)
  )
)

CREATE INDEX idx_stock_movements_material ON stock_movements(material_id);
CREATE INDEX idx_stock_movements_from_location ON stock_movements(from_location_id);
CREATE INDEX idx_stock_movements_to_location ON stock_movements(to_location_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
```

### StockLedger Table (Immutable)

```sql
CREATE TABLE stock_ledger (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  movement_id INTEGER NOT NULL REFERENCES stock_movements(id),
  quantity_change DECIMAL(12, 4) NOT NULL, -- Signed (+/-)
  balance_after DECIMAL(12, 4) NOT NULL, -- Running balance
  unit VARCHAR(20) NOT NULL, -- base_uom
  cost_per_unit DECIMAL(10, 4), -- WAC at transaction time
  total_cost DECIMAL(12, 2), -- qty_change × cost_per_unit
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT immutable_ledger CHECK (1=1) -- Conceptual; enforce in app layer
)

CREATE INDEX idx_stock_ledger_material_location ON stock_ledger(material_id, location_id);
CREATE INDEX idx_stock_ledger_created_at ON stock_ledger(created_at);

-- Current stock query (fast via indexed composite key)
SELECT 
  material_id,
  location_id,
  balance_after as current_stock,
  unit
FROM stock_ledger
WHERE (material_id, location_id, created_at) IN (
  SELECT material_id, location_id, MAX(created_at)
  FROM stock_ledger
  GROUP BY material_id, location_id
)
```

### StockOpname Table

```sql
CREATE TABLE stock_opname (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  period VARCHAR(10) NOT NULL, -- "2026-04" (YYYY-MM format)
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'approved', 'rejected')),
  total_variance DECIMAL(5, 2), -- Total % variance
  created_by INTEGER NOT NULL REFERENCES users(id),
  submitted_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  CONSTRAINT unique_period_location UNIQUE(location_id, period)
)

CREATE INDEX idx_stock_opname_location_period ON stock_opname(location_id, period);
```

### OpnameLineItem Table

```sql
CREATE TABLE opname_line_items (
  id SERIAL PRIMARY KEY,
  opname_id INTEGER NOT NULL REFERENCES stock_opname(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  expected_stock DECIMAL(12, 4) NOT NULL,
  physical_count DECIMAL(12, 4) NOT NULL,
  variance DECIMAL(12, 4), -- physical - expected
  variance_pct DECIMAL(5, 2),
  variance_reason VARCHAR(100), -- "damage", "expiry", "spillage", "error", "theft"
  approval_required BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'rejected', 'pending_approval')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_opname_line_items_opname ON opname_line_items(opname_id);
```

---

## 6. Business Rules & Validations

**Stock Movement Rules**:
- Inbound (supplier): from_location_id NULL, to_location_id required
- Transfer: both from/to locations required, must respect transfer paths
- Waste: from_location_id required, to_location_id NULL
- Recipe deduction: from_location_id required, quantity from recipe
- Quantity must be positive (signed in ledger)
- Cannot transfer more than source location has

**Ledger Rules**:
- Immutable once created (no updates, only new inserts)
- balance_after = previous balance + quantity_change
- cost_per_unit taken at transaction time (WAC snapshot)
- total_cost = quantity × cost_per_unit (for revenue recognition)
- One ledger entry per movement (not split)

**Opname Rules**:
- One opname per location per month
- Expected stock from latest ledger balance
- Physical count entered manually (not system-generated)
- Variance = physical - expected (negative = shortage)
- Variance % calculated: variance / expected × 100
- Variances < 5% auto-approved
- Variances ≥ 5% require manager approval

**ACID Compliance**:
- Transfer movements wrapped in transaction (both deduct and add must succeed)
- If either fails, entire transfer rolled back
- Ledger consistency guaranteed by constraints
- No partial updates possible (atomicity)

---

## 7. API Endpoints & Routes

### POST `/inventory/stock-movements/create`
**Description**: Create inbound stock movement (GRN)  
**Auth**: Required (Warehouse Manager)  
**Body**:
```typescript
{
  material_id: 1,
  to_location_id: 1,
  type: "inbound",
  quantity: 600,
  reference_id: "PO-123",
  cost_per_unit: 0.80,
  notes: "Fresh milk delivery"
}
```
**Response**: 201 Created with StockMovement

### POST `/inventory/transfers/create`
**Description**: Create transfer between locations  
**Auth**: Required (Location Manager)  
**Body**:
```typescript
{
  material_id: 1,
  from_location_id: 1,
  to_location_id: 2,
  type: "transfer",
  quantity: 20,
  reference_id: "REQUEST-456",
  notes: "Outlet stock replenishment"
}
```
**Response**: 201 Created + auto-approval (or pending based on config)

### POST `/inventory/waste-entries/create`
**Description**: Log waste/spoilage  
**Auth**: Required (Staff+)  
**Body**:
```typescript
{
  material_id: 1,
  location_id: 2,
  type: "waste",
  quantity: 2,
  reason: "expiration_date_passed",
  notes: "Batch from 2026-04-10"
}
```
**Response**: 201 Created (auto-approved)

### GET `/inventory/current-stock`
**Description**: Get current stock for location  
**Auth**: Required (LBAC filtered)  
**Query Params**:
```typescript
{
  location_id: 1,
  material_id?: 1,
  search?: "milk"
}
```
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "material_id": 1,
      "material_name": "Fresh Milk",
      "current_stock": 21.0,
      "unit": "L",
      "min_stock": 5.0,
      "max_stock": 30.0,
      "status": "OK",
      "cost_per_unit": 0.80,
      "total_value": 16.80
    }
  ]
}
```

### GET `/inventory/ledger`
**Description**: Get stock ledger (audit trail) for material+location  
**Auth**: Required  
**Query Params**:
```typescript
{
  material_id: 1,
  location_id: 2,
  from_date?: "2026-04-01",
  to_date?: "2026-04-30"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "material": "Fresh Milk",
    "location": "Ikki Coffee",
    "entries": [
      {
        "id": 100,
        "date": "2026-04-24T14:00:00Z",
        "movement_type": "transfer",
        "quantity_change": "+20.0",
        "balance_after": "23.0",
        "cost_per_unit": "0.80",
        "total_cost": "16.00",
        "reference": "REQUEST-456"
      }
    ]
  }
}
```

### POST `/inventory/opname/create`
**Description**: Create monthly stock opname  
**Auth**: Required (Manager)  
**Body**:
```typescript
{
  location_id: 2,
  period: "2026-04"
}
```
**Response**: 201 Created with OpnameLineItems pre-populated

### PUT `/inventory/opname/:id/submit-count`
**Description**: Submit physical counts for opname  
**Auth**: Required (Staff counting)  
**Body**:
```typescript
{
  line_items: [
    { material_id: 1, physical_count: 21.0, reason: "spillage" },
    { material_id: 5, physical_count: 4.9, reason: "accurate" }
  ]
}
```
**Response**: 200 OK, calculates variances

### PUT `/inventory/opname/:id/approve`
**Description**: Approve opname and post adjustments  
**Auth**: Required (Admin/Location Manager)  
**Response**: 200 OK, creates adjustment movements

---

## 8. Integration Points

### Upstream Dependencies:
- **Product** (Layer 0): Recipe defines consumption
- **Location** (Layer 0): Stock scoped to locations
- **Material** (Layer 1): Materials being tracked
- **IAM** (Layer 1): LBAC filtering, user audit
- **Recipe** (Layer 2): Auto-deduction on sale

### Downstream Dependencies:
- **Sales** (Layer 2): Deducts materials on order shipment
- **Dashboard** (Layer 3): Stock value, waste, accuracy metrics

### Data Flow:
```
Material + Location (master data)
  ├─ GRN Inbound (supplier delivery) → StockMovement
  ├─ Transfer (warehouse ↔ outlet) → StockMovement
  ├─ Recipe Deduction (on sale) → StockMovement
  ├─ Waste Entry (manual) → StockMovement
  └─ All → StockLedger (immutable journal)
      ├─ Current Stock (latest balance per material+location)
      ├─ Stock Value (qty × WAC cost)
      └─ COGS (for profit calculations)

Monthly:
  └─ Opname (physical count) → OpnameLineItem
     ├─ Compare expected vs. actual
     ├─ Identify variances
     └─ Post adjustments → StockMovement
```

---

## 9. Implementation Notes

### Caching Strategy
```typescript
const INVENTORY_CACHE_KEYS = {
  CURRENT_STOCK: (locationId: number, materialId: number) => `inventory.stock.${locationId}.${materialId}`,
  LOCATION_SUMMARY: (locationId: number) => `inventory.summary.${locationId}`,
  LEDGER: (materialId: number, locationId: number) => `inventory.ledger.${locationId}.${materialId}`,
}

// Cache TTL: 5 minutes (stock changes frequently during day)
// Invalidate on: any StockMovement creation
```

### ACID Transaction Pattern
```typescript
// Transfer between locations must be atomic
await db.transaction(async (tx) => {
  // 1. Deduct from source
  await tx.insert(stock_ledger).values({
    material_id, location_id: from_location_id,
    quantity_change: -qty,
    balance_after: sourceBalance - qty,
  })

  // 2. Add to destination
  await tx.insert(stock_ledger).values({
    material_id, location_id: to_location_id,
    quantity_change: +qty,
    balance_after: destBalance + qty,
  })

  // 3. If either fails, entire transaction rolled back
  // Both succeed together, or neither succeeds
})
```

### Current Stock Query (Fast Composite Index)
```typescript
// Get latest balance per material+location
SELECT 
  material_id,
  location_id,
  balance_after
FROM stock_ledger
WHERE (material_id, location_id, created_at) IN (
  SELECT material_id, location_id, MAX(created_at)
  FROM stock_ledger
  GROUP BY material_id, location_id
)
```

---

## 10. Future Enhancements (Phase 2+)

- **Cycle Counting**: Continuous spot checks instead of month-end opname
- **Shelf-Life Tracking (FEFO)**: Auto-deduct expired materials
- **Stock Forecasting**: Predict stock needs based on sales trends
- **Low Stock Alerts**: Push notifications when below thresholds
- **Variance Analysis**: Root cause analysis for large discrepancies
- **Stock Adjustments**: Admin override for manual corrections
- **Batch Tracking**: Lot numbers for recalls and expiry management

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: Product (Layer 0), Location (Layer 0), Material (Layer 1), Recipe (Layer 2), IAM (Layer 1)  
**Estimated Implementation**: 15-18 hours
