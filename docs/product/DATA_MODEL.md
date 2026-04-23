# Data Model & Entity Relationship Documentation

> **Version**: 1.0  
> **Last Updated**: 2026-04-24  
> **Purpose**: Define all database entities, relationships, validations, and business constraints

---

## 1. Entity Relationship Diagram (Conceptual)

```
┌─────────────┐
│   User      │  (Authentication & Audit Trail)
├─────────────┤
│ id (PK)     │
│ email       │─────────┐
│ name        │         │
│ password    │         │
│ is_active   │         │
└─────────────┘         │
       ▲                │
       │                │
       │            creates/approves
       │                │
┌──────┴────────┐       │
│ UserAssignment│       │
├────────────────┤      │
│ id (PK)       │       │
│ user_id (FK)──┼───────┘
│ role_id (FK)  │
│ location_id (FK)
│ assigned_at   │
│ assigned_by (FK)
└────────────────┘


┌─────────────────┐
│   Location      │  (Geographic boundaries)
├─────────────────┤
│ id (PK)         │
│ name            │
│ type (W/O/K)    │────┐
│ address         │    │
│ manager_id (FK) │    │
│ is_active       │    │
└─────────────────┘    │
       ▲               │
       │           contains
       │               │
   receives         ┌───▼────────────┐
   from/sends to    │ MaterialLocation│
       │            ├─────────────────┤
       │            │ id (PK)         │
       │            │ location_id (FK)│
       │            │ material_id (FK)│
       │            │ current_stock   │
       │            │ min_stock       │
       │            │ max_stock       │
       │            └─────────────────┘
       │                   ▲
       │                   │
       │              references
       │                   │
       └─────────────────┬─┘
                         │
                    ┌────▼──────────┐
                    │   Material    │  (Extends Product)
                    ├──────────────┤
                    │ id (PK)      │
                    │ sku          │
                    │ name         │
                    │ category_id  │
                    │ type         │
                    │ uom          │
                    │ cost_price   │
                    │ selling_price│
                    │ reorder_pt   │
                    │ reorder_qty  │
                    │ shelf_life   │
                    └──────────────┘
                         ▲
                         │
                    has components
                         │
                    ┌────▼─────────────┐
                    │ RecipeComponent   │
                    ├───────────────────┤
                    │ id (PK)           │
                    │ recipe_id (FK)    │
                    │ material_id (FK)──┼──┘
                    │ quantity          │
                    │ uom               │
                    │ is_optional       │
                    └───────────────────┘
                         ▲
                         │
                    part of
                         │
                    ┌────┴────────┐
                    │   Recipe    │  (Finished Good Definition)
                    ├──────────────┤
                    │ id (PK)      │
                    │ name         │
                    │ product_id   │
                    │ yield        │
                    │ base_cost    │
                    │ version      │
                    │ is_active    │
                    └──────────────┘


┌──────────────────┐
│  StockMovement   │  (All stock transactions)
├──────────────────┤
│ id (PK)          │
│ type (IN/OUT/TRN)│
│ from_location_id │
│ to_location_id   │
│ material_id (FK) │
│ quantity         │
│ cost_per_unit    │
│ reference_id     │
│ created_by (FK)  │
│ created_at       │
└──────────────────┘
       │
       └────────────┐
                    │
           creates  │
                    │
            ┌───────▼───────┐
            │ StockLedger   │  (Append-only journal)
            ├───────────────┤
            │ id (PK)       │
            │ material_id   │
            │ location_id   │
            │ movement_id   │
            │ opening_bal   │
            │ qty_change    │
            │ closing_bal   │
            │ unit_cost     │
            │ created_at    │
            └───────────────┘


┌──────────────────┐
│   SalesOrder     │  (Customer orders)
├──────────────────┤
│ id (PK)          │
│ so_number        │
│ location_id (FK) │
│ customer_type    │
│ order_date       │
│ total_amount     │
│ status           │
│ created_by (FK)  │
└──────────────────┘
       │
       │ contains
       │
       ▼
┌──────────────────┐
│ SalesOrderLine   │  (Line items)
├──────────────────┤
│ id (PK)          │
│ so_id (FK)       │
│ product_id (FK)  │
│ quantity         │
│ unit_price       │
│ status           │
└──────────────────┘


┌──────────────────┐
│  StockOpname     │  (Physical count)
├──────────────────┤
│ id (PK)          │
│ location_id (FK) │
│ cycle_id         │
│ status           │
│ approved_by      │
│ completed_at     │
└──────────────────┘
       │
       │ contains
       │
       ▼
┌──────────────────┐
│ OpnameDetail     │  (Count per material)
├──────────────────┤
│ id (PK)          │
│ opname_id (FK)   │
│ material_id (FK) │
│ expected_qty     │
│ physical_qty     │
│ variance         │
│ verified_by      │
└──────────────────┘
```

---

## 2. Core Entities (Detailed Specifications)

### 2.1 User

**Purpose**: Authentication and audit trail. Tracks who performed each action.

**Table Definition**:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

**Attributes**:
- `id`: Auto-increment, PK
- `email`: Unique, indexed (login identifier)
- `name`: Display name
- `phone`: Contact number (optional)
- `password_hash`: Bcrypt hash (never plain text)
- `is_active`: Soft-delete flag
- `last_login`: Track engagement
- `created_at / updated_at`: Audit timestamps

**Business Rules**:
- Email must be unique, lowercase
- Password hash must be Bcrypt ($2a or $2b), salt rounds ≥ 12
- Inactive users cannot log in
- User cannot be hard-deleted (only marked inactive)
- At least one Admin user must exist at all times

**Related Tables**:
- UserAssignment (one-to-many: one user can have multiple role+location combinations)
- StockMovement.created_by (many: user creates many movements)

---

### 2.2 UserAssignment

**Purpose**: Bind user to role(s) and location(s). Implement RBAC.

**Table Definition**:
```sql
CREATE TABLE user_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  
  UNIQUE(user_id, role_id, location_id) -- User cannot have same role at same location twice
);

CREATE INDEX idx_user_assignments_user ON user_assignments(user_id);
CREATE INDEX idx_user_assignments_location ON user_assignments(location_id);
```

**Attributes**:
- `user_id`: FK to User
- `role_id`: FK to Role
- `location_id`: FK to Location (scope of access)
- `assigned_at`: When assignment created
- `assigned_by`: FK to User (audit trail: who assigned?)

**Business Rules**:
- User must have ≥1 assignment to be active
- Role must exist before assignment
- Location must exist before assignment
- Cannot assign same role at same location twice
- Admin role: can override location scope (access all)

**Examples**:
- Outlet Manager: UserAssignment(user=John, role=Manager, location=Ikki Coffee)
- Warehouse Manager: UserAssignment(user=Ahmed, role=Manager, location=Gudang Utama)
- System Admin: UserAssignment(user=Admin, role=Admin, location=Ikki Coffee) + (location=Gudang Utama)

---

### 2.3 Location

**Purpose**: Geographic boundaries of operations. All stock movements are location-scoped.

**Table Definition**:
```sql
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('warehouse', 'outlet', 'kitchen')),
  address TEXT,
  manager_id INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_is_active ON locations(is_active);
```

**Attributes**:
- `id`: Serial PK
- `name`: e.g., "Gudang Utama", "Ikki Coffee - Bar"
- `type`: 'warehouse' | 'outlet' | 'kitchen'
- `address`: Physical location
- `manager_id`: FK to User (who manages this location)
- `is_active`: Soft-delete flag

**Location Types**:
- **warehouse**: Central inventory storage (e.g., Gudang Utama)
- **outlet**: Customer-facing area with register (e.g., Ikki Coffee Bar)
- **kitchen**: Production/storage area (e.g., Ikki Resto Kitchen)

**Business Rules**:
- Location type determines allowed transfer paths:
  - warehouse ↔ kitchen (internal)
  - warehouse ↔ outlet (delivery)
  - kitchen ↔ outlet (prohibited directly; must go through warehouse)
- Only warehouse locations can receive from suppliers (GRN)
- Location cannot be deleted if active stock exists
- Each location must have a manager assigned

**Stock Transfer Rules**:
```
ALLOWED:
  warehouse  <--> kitchen   (e.g., Gudang Utama <-> Ikki Resto Kitchen)
  warehouse  <--> outlet    (e.g., Gudang Utama -> Ikki Coffee Bar)

NOT ALLOWED:
  outlet     <--> outlet    (e.g., Ikki Coffee -> Ikki Resto)
  kitchen    <--> outlet    (e.g., Ikki Resto Kitchen -> Ikki Coffee Bar)
  kitchen    <--> kitchen   (e.g., Ikki Resto Kitchen <-> Ikki Coffee Kitchen)
```

---

### 2.4 Product & Material

**Purpose**: Product = base catalog; Material = inventory-tracked variant.

**Product Table Definition**:
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('raw_material', 'packaging', 'finished_good')),
  unit_of_measure VARCHAR(20),
  cost_price DECIMAL(10, 4),
  selling_price DECIMAL(10, 2),
  moka_sku VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(type);
```

**Material Table Definition** (extends Product):
```sql
CREATE TABLE materials (
  id SERIAL PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  unit_conversion JSONB DEFAULT '{}', -- e.g., {"1_box": "12_pieces", "1_liter": "1000_ml"}
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  shelf_life_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Product Attributes**:
- `sku`: Unique identifier (e.g., "PROD-001")
- `name`: Display name
- `category_id`: FK to Category (for reporting)
- `type`: 'raw_material' | 'packaging' | 'finished_good'
- `unit_of_measure`: 'kg' | 'liter' | 'piece' | 'box'
- `cost_price`: Last known cost (updated via GRN)
- `selling_price`: Base price (can vary per location in Phase 2)
- `moka_sku`: External POS mapping

**Material Attributes** (extends Product):
- `unit_conversion`: JSON map of unit conversions (e.g., `{"1_liter": "1000_ml"}`)
- `reorder_point`: Qty threshold (triggers alert)
- `reorder_quantity`: Suggested order qty
- `shelf_life_days`: Days until expiration (nullable)

**Business Rules**:
- SKU must be unique globally
- Product cannot be deleted; only marked inactive
- Cost price can only be updated via GRN (Goods Receipt Note)
- Reorder_point < max_stock (configured per location)
- Material must have ≥1 location assignment

**Examples**:
```
Product:
  id: 1, sku: "PROD-001", name: "Arabica Coffee Beans", type: "raw_material"
  category: "Coffee", uom: "kg", cost_price: $8.50, selling_price: $15.00

Material (extends above):
  reorder_point: 50kg, reorder_qty: 100kg, shelf_life: 180 days
  unit_conversion: {"1_box": "5kg", "1_sachet": "250g"}
```

---

### 2.5 MaterialLocation

**Purpose**: Bind material to location with location-specific stock & thresholds.

**Table Definition**:
```sql
CREATE TABLE material_locations (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  current_stock DECIMAL(12, 4) DEFAULT 0,
  reserved_stock DECIMAL(12, 4) DEFAULT 0, -- Allocated but not yet consumed
  min_stock INTEGER,
  max_stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(material_id, location_id),
  CONSTRAINT positive_stock CHECK (current_stock >= 0),
  CONSTRAINT positive_reserved CHECK (reserved_stock >= 0)
);

CREATE INDEX idx_material_locations_material ON material_locations(material_id);
CREATE INDEX idx_material_locations_location ON material_locations(location_id);
```

**Attributes**:
- `material_id`: FK to Material
- `location_id`: FK to Location
- `current_stock`: On-hand quantity (always ≥ 0)
- `reserved_stock`: Allocated to pending sales (not yet shipped)
- `min_stock`: Location-specific minimum threshold
- `max_stock`: Storage capacity
- `is_active`: Can be deactivated (material no longer used at location)

**Calculated Fields** (not stored, computed on-read):
- `available_stock = current_stock - reserved_stock` (can allocate)
- `days_to_stockout = available_stock / (daily_consumption_rate)`

**Business Rules**:
- min_stock ≤ max_stock
- current_stock + reserved_stock ≤ max_stock
- Cannot reserve stock if available_stock < reservation_qty
- Reservation auto-released if sales order cancelled
- Not all materials exist at all locations

**Example**:
```
Material "Milk" at Ikki Coffee Kitchen:
  current_stock: 150L
  reserved_stock: 50L (in pending sales orders)
  available_stock: 100L
  min_stock: 100L
  max_stock: 300L
  Status: Green (available > min)

Material "Milk" at Ikki Coffee Bar (outlet):
  current_stock: 50L
  min_stock: 30L
  max_stock: 100L
  Status: Green (available > min)

Material "Milk" not assigned to Warehouse (type=warehouse):
  (No MaterialLocation record)
  Cannot be assigned here (warehouse use different tracking)
```

---

### 2.6 StockMovement

**Purpose**: Record all inventory transactions (universal journal).

**Table Definition**:
```sql
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('inbound', 'outbound', 'transfer', 'adjustment')),
  reference_id INTEGER, -- FK to PO, Sales Order, etc.
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  quantity DECIMAL(12, 4) NOT NULL,
  unit_of_measure VARCHAR(20),
  cost_per_unit DECIMAL(10, 4), -- Snapshot at time of transaction
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  transaction_date DATE DEFAULT CURRENT_DATE,
  
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT inbound_no_from CHECK (type != 'inbound' OR from_location_id IS NULL),
  CONSTRAINT outbound_no_to CHECK (type != 'outbound' OR to_location_id IS NULL)
);

CREATE INDEX idx_movements_material ON stock_movements(material_id);
CREATE INDEX idx_movements_location_from ON stock_movements(from_location_id);
CREATE INDEX idx_movements_location_to ON stock_movements(to_location_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at);
```

**Movement Types**:

| Type | From | To | Purpose | Example |
|------|------|----|---------|---------| 
| `inbound` | NULL | Warehouse | Supplier delivery (GRN) | 100kg coffee from supplier → Gudang Utama |
| `outbound` | Outlet/Kitchen | NULL | Consumption/waste/sale | 18g espresso from Ikki Coffee → consumed |
| `transfer` | Warehouse/Kitchen | Kitchen/Outlet | Internal movement | 50L milk from Gudang → Ikki Coffee Kitchen |
| `adjustment` | NULL | Location | Opname variance reconciliation | +2L milk (found extra during count) |

**Business Rules**:
- Quantity always positive (sign determines direction)
- Inbound: from_location_id must be NULL
- Outbound: to_location_id must be NULL
- Transfer: both from and to must be specified
- Adjustment: from is NULL, to is the location being adjusted
- cost_per_unit snapshot prevents historical cost changes
- User (created_by) required for audit trail

**Data Flows**:
```
INBOUND (supplier delivery):
  StockMovement(type=inbound, to=Warehouse, material=Milk, qty=1000L)
  → Updates: MaterialLocation(Gudang Utama, Milk).current_stock += 1000L

OUTBOUND (sales/waste):
  StockMovement(type=outbound, from=Outlet, material=Milk, qty=150ml)
  → Updates: MaterialLocation(Ikki Coffee, Milk).current_stock -= 150ml

TRANSFER (warehouse to outlet):
  StockMovement(type=transfer, from=Warehouse, to=Outlet, material=Milk, qty=200L)
  → Updates:
      MaterialLocation(Gudang, Milk).current_stock -= 200L
      MaterialLocation(Ikki Coffee, Milk).current_stock += 200L

ADJUSTMENT (opname variance):
  StockMovement(type=adjustment, to=Kitchen, material=Espresso, qty=+2kg)
  → Updates: MaterialLocation(Ikki Resto Kitchen, Espresso).current_stock += 2kg
```

---

### 2.7 StockLedger

**Purpose**: Append-only journal. Source of truth for all account balances.

**Table Definition**:
```sql
CREATE TABLE stock_ledger (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  movement_id INTEGER REFERENCES stock_movements(id),
  opening_balance DECIMAL(12, 4),
  quantity_change DECIMAL(12, 4), -- + or -
  closing_balance DECIMAL(12, 4),
  unit_cost DECIMAL(10, 4), -- For WAC (Weighted Average Cost) calculation
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_opening CHECK (opening_balance >= 0),
  CONSTRAINT positive_closing CHECK (closing_balance >= 0)
);

CREATE INDEX idx_ledger_material_location ON stock_ledger(material_id, location_id);
CREATE INDEX idx_ledger_created_at ON stock_ledger(created_at);
```

**Attributes**:
- `material_id`: What material moved
- `location_id`: Where it moved to/from
- `movement_id`: FK to StockMovement (link to transaction)
- `opening_balance`: Stock before this transaction
- `quantity_change`: +/- quantity moved
- `closing_balance`: Stock after this transaction
- `unit_cost`: Cost snapshot for WAC calculation
- `created_at`: When recorded (immutable)

**Immutability**: Ledger entries can never be modified or deleted. This ensures 100% auditability.

**Use Cases**:
1. **Stock Balance Verification**: Select max(closing_balance) where material_id=X and location_id=Y
2. **COGS Calculation**: Sum(quantity_change × unit_cost) where type='outbound' and created_at in [start, end]
3. **Stock Trend**: Group by date, sum(quantity_change) for trend analysis
4. **Audit Trail**: Join with StockMovement to see full history with user context

**Example Ledger Sequence** (for 1L Milk at Ikki Coffee):
```
Date       Movement_Type    Qty    Opening  Change  Closing  Unit_Cost
2026-04-24 inbound (+trans) 200L   50L      +200    250L     $0.08
2026-04-24 outbound (sale)  1.5L   250L     -1.5    248.5L   $0.08
2026-04-24 outbound (waste) 0.5L   248.5L   -0.5    248L     $0.08
2026-04-24 adjustment (opt) +2L    248L     +2      250L     $0.08

Final balance: 250L at Ikki Coffee
Total consumed today: 2L (qty_change -1.5L sales -0.5L waste)
COGS for milk today: (1.5 + 0.5) × $0.08 = $0.16
```

---

### 2.8 Recipe & RecipeComponent

**Purpose**: Define how raw materials → finished goods. Auto-calculate COGS.

**Recipe Table Definition**:
```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  yield INTEGER DEFAULT 1, -- Number of servings per recipe batch
  base_cost DECIMAL(10, 4), -- Auto-calculated
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipes_product ON recipes(product_id);
CREATE INDEX idx_recipes_is_active ON recipes(is_active);
```

**RecipeComponent Table Definition**:
```sql
CREATE TABLE recipe_components (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  quantity DECIMAL(12, 4) NOT NULL,
  unit_of_measure VARCHAR(20),
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_components_recipe ON recipe_components(recipe_id);
CREATE INDEX idx_components_material ON recipe_components(material_id);
```

**Recipe Attributes**:
- `name`: e.g., "Iced Latte"
- `product_id`: The finished product being created
- `yield`: Number of servings (1 = single serving, 5 = batch of 5)
- `base_cost`: Σ (material_qty × current_material_cost) - auto-calculated
- `version`: Track recipe changes (Phase 2)

**RecipeComponent Attributes**:
- `recipe_id`: Which recipe?
- `material_id`: Which material?
- `quantity`: How much? (in base UOM)
- `unit_of_measure`: Display UOM (e.g., "grams", "ml")
- `is_optional`: Garnish, seasonal add-on, etc.

**Business Rules**:
- Recipe must have ≥1 component
- Recipe cannot be deleted (version history maintained)
- Base cost recalculated daily (using current material costs)
- Recipe cost snapshot preserved monthly (for historical accuracy)
- Finished product must exist before recipe creation

**COGS Calculation**:
```
Recipe: Iced Latte (product_id=1)
Components:
  - Espresso: 18g (material_id=5, cost=$0.50/g)    → 18 × $0.50 = $9.00
  - Milk: 150ml (material_id=8, cost=$0.08/ml)     → 150 × $0.08 = $12.00
  - Cup: 1pc (material_id=20, cost=$0.15/pc)      → 1 × $0.15 = $0.15
  - Lid: 1pc (material_id=21, cost=$0.05/pc)      → 1 × $0.05 = $0.05
  - Straw: 1pc (material_id=22, cost=$0.02/pc)    → 1 × $0.02 = $0.02
  
Total COGS: $9.00 + $12.00 + $0.15 + $0.05 + $0.02 = $21.22

Selling Price (from Product): $5.00
Margin: ($5.00 - $2.22) / $5.00 = 55.6%

Note: COGS > selling price! This recipe is unprofitable.
Action: Reduce portion size, find cheaper materials, or increase price.
```

**Recipe-Driven Inventory Deduction**:
```
Event: Customer buys Iced Latte (POS)
  → StockMovement created: type=outbound, material=Espresso, qty=18g, location=Ikki Coffee
  → StockMovement created: type=outbound, material=Milk, qty=150ml, location=Ikki Coffee
  → StockMovement created: type=outbound, material=Cup, qty=1, location=Ikki Coffee
  → (Lid, Straw similarly)
  → StockLedger updated for each material
  → COGS recorded: $2.22 (corrected example with realistic costs)
  → Gross profit: $5.00 - $2.22 = $2.78
```

---

### 2.9 SalesOrder & SalesOrderLine

**Purpose**: Customer orders with inventory allocation.

**SalesOrder Table Definition**:
```sql
CREATE TABLE sales_orders (
  id SERIAL PRIMARY KEY,
  so_number VARCHAR(50) UNIQUE NOT NULL,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  customer_type VARCHAR(50), -- 'walk_in' | 'corporate' | 'delivery_partner'
  order_date TIMESTAMP DEFAULT NOW(),
  delivery_date DATE,
  total_amount DECIMAL(12, 2),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_so_number ON sales_orders(so_number);
CREATE INDEX idx_so_location ON sales_orders(location_id);
CREATE INDEX idx_so_status ON sales_orders(status);
```

**SalesOrderLine Table Definition**:
```sql
CREATE TABLE sales_order_lines (
  id SERIAL PRIMARY KEY,
  so_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL, -- Snapshot at order time
  line_total DECIMAL(12, 2), -- qty × unit_price
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reserved', 'shipped', 'cancelled')),
  
  CONSTRAINT positive_qty CHECK (quantity > 0)
);

CREATE INDEX idx_so_lines_so ON sales_order_lines(so_id);
CREATE INDEX idx_so_lines_product ON sales_order_lines(product_id);
```

**SalesOrder Attributes**:
- `so_number`: Unique identifier (auto-generated)
- `location_id`: Where order placed (outlet/warehouse)
- `customer_type`: walk_in | corporate | delivery_partner
- `order_date`: When ordered
- `delivery_date`: When to deliver (optional)
- `total_amount`: Sum of all line totals
- `status`: draft | confirmed | shipped | delivered | cancelled
- `created_by`: Which user created order?

**SalesOrderLine Attributes**:
- `product_id`: What product?
- `quantity`: How many?
- `unit_price`: Price snapshot at order time (prevents disputes)
- `line_total`: qty × unit_price
- `status`: pending (created) → reserved (confirmed) → shipped → cancelled?

**Status Workflow**:
```
draft
  ↓ [Confirm]
confirmed (stock reserved)
  ↓ [Ship]
shipped (inventory deducted, COGS recorded)
  ↓ [Deliver]
delivered

Alternative: [Cancel] → cancelled (reserved stock released)
```

**Inventory Allocation Rules**:
- On SO confirmation: reserve qty from available_stock
- Prevent: SO confirmation if available_stock < requested_qty
- On SO ship: deduct reserved stock (create StockMovement)
- On SO cancel: release reserved stock

**Example**:
```
SalesOrder SO-2026-04-24-001:
  location: Ikki Coffee
  customer: walk_in
  status: draft

Lines:
  1. Iced Latte (product_id=1), qty=3, unit_price=$5.00 → line_total=$15.00
  2. Espresso (product_id=2), qty=1, unit_price=$4.00 → line_total=$4.00
  
Total: $19.00

[Confirm] → status: confirmed
  → Reserve: 3 Iced Lattes, 1 Espresso from Ikki Coffee stock
  → MaterialLocation updates: reserved_stock += qty for each component

[Ship] → status: shipped
  → StockMovements created for all recipe components:
      - Espresso: -54g (18g × 3 lattes)
      - Milk: -450ml (150ml × 3 lattes)
      - ...
  → COGS: (3 × $2.22) + (1 × $1.80) = $8.46
  → Gross profit: $19.00 - $8.46 = $10.54
```

---

### 2.10 StockOpname & OpnameDetail

**Purpose**: Systematic physical inventory count with variance reconciliation.

**StockOpname Table Definition**:
```sql
CREATE TABLE stock_opnames (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  cycle_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "OPN-2026-04-24-001"
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved')),
  expected_stock JSONB, -- Full system snapshot at start (optional, for analysis)
  physical_count JSONB, -- User-entered counts
  variance JSONB, -- Auto-calculated diff
  variance_approved_by INTEGER REFERENCES users(id),
  completed_at TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_opname_location ON stock_opnames(location_id);
CREATE INDEX idx_opname_created_at ON stock_opnames(created_at);
```

**OpnameDetail Table Definition** (one row per material counted):
```sql
CREATE TABLE opname_details (
  id SERIAL PRIMARY KEY,
  opname_id INTEGER NOT NULL REFERENCES stock_opnames(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  expected_qty DECIMAL(12, 4), -- From system
  physical_qty DECIMAL(12, 4), -- Entered by staff
  variance DECIMAL(12, 4), -- Calculated: physical - expected
  variance_percent DECIMAL(5, 2), -- For quick sorting: variance / expected × 100
  verified_by INTEGER REFERENCES users(id), -- Who counted this material?
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_opname_details_opname ON opname_details(opname_id);
CREATE INDEX idx_opname_details_variance_pct ON opname_details(variance_percent);
```

**StockOpname Attributes**:
- `location_id`: Which location being counted?
- `cycle_id`: Unique cycle (e.g., "OPN-2026-04-24-001")
- `status`: draft | in_progress | completed | approved
- `expected_stock`: System snapshot (JSONB - optional)
- `physical_count`: User entries (JSONB - optional)
- `variance`: Auto-calculated differences
- `variance_approved_by`: Manager who approved adjustments
- `created_by`: Who initiated count?

**OpnameDetail Attributes**:
- `expected_qty`: System says this should exist
- `physical_qty`: Staff counted this amount
- `variance`: physical_qty - expected_qty (positive=extra, negative=missing)
- `variance_percent`: (variance / expected) × 100 (for filtering)
- `verified_by`: Which staff member counted?

**Opname Workflow**:
```
1. Draft
   - Manager clicks "Start Stock Opname"
   - System generates sheet: all active materials at location
   - Shows: Material | Expected (from system) | [Physical (input)]
   - Status: draft

2. In Progress
   - Staff enters physical count for each material
   - System auto-calculates variance
   - Flags: variance > 5% OR variance > 10 units (visual alert)
   - Status: in_progress

3. Completed
   - All materials counted
   - Manager reviews variances (filter by > 5%)
   - Investigates high variances (enter notes/root cause)
   - Manager clicks "Approve"
   - Status: completed

4. Approved (Final)
   - Adjustment movements auto-created for all variances
   - Ledger finalized (locked, cannot modify)
   - Accuracy %: (materials with 0 variance) / total materials
   - Report: OPN summary, accuracy, major discrepancies
   - Status: approved
```

**High Variance Handling**:
```
OpnameDetail for Espresso:
  expected_qty: 12kg
  physical_qty: 10kg
  variance: -2kg (-16.7%)
  
Status: RED (>5% variance)

Manager action options:
  a) Accept variance: "Espresso grinder recalibrated, lost 2kg"
  b) Recount: "Please recount this material"
  c) Investigate: "Missing 2kg inventory needs investigation"

If accepted: Adjustment movement created:
  StockMovement(type=adjustment, to=location, material=Espresso, qty=-2kg)
  Ledger entry: closing_balance -= 2kg

If approved by Finance: Variance accepted, ledger finalized.
```

---

## 3. Validation & Business Constraints

### 3.1 Data Type Constraints

| Field | Type | Min | Max | Notes |
|-------|------|-----|-----|-------|
| Stock Qty | DECIMAL(12,4) | 0 | Unlimited | 4 decimal places for precision |
| Price | DECIMAL(10,2) | 0 | 9,999,999.99 | 2 decimal places (currency) |
| Unit Cost | DECIMAL(10,4) | 0 | 9,999.9999 | 4 decimals for detailed costs |
| Email | VARCHAR | 5 | 255 | RFC 5322 compliant |
| SKU | VARCHAR | 3 | 50 | Alphanumeric + hyphen |

### 3.2 Relationships & Referential Integrity

| Relationship | Rule | Violation Handling |
|--------------|------|-------------------|
| User → UserAssignment | One-to-many | Cascade delete assignments if user deleted |
| Location → MaterialLocation | One-to-many | Cascade delete material bindings if location deleted |
| Material → RecipeComponent | One-to-many | Cascade delete BOM if material deleted (CARE: verify no recipes depend) |
| Recipe → RecipeComponent | One-to-many | Cascade delete components if recipe deleted |
| SalesOrder → SalesOrderLine | One-to-many | Cascade delete lines if SO deleted |
| StockOpname → OpnameDetail | One-to-many | Cascade delete details if opname deleted |

### 3.3 Business Logic Validations

**Location Constraints**:
- Warehouse must receive before outlet receives
- Cannot transfer between outlets directly
- Kitchen must have warehouse as source

**Material Constraints**:
- Current_stock ≥ 0 (no negative inventory)
- current_stock + reserved_stock ≤ max_stock
- reorder_point ≥ 0 and < max_stock
- shelf_life > 0 (if applicable)

**Recipe Constraints**:
- ≥1 component required
- Component qty > 0
- Cannot change recipe if active sales depend on it (Phase 2)

**Opname Constraints**:
- Cannot start opname if pending transfers exist
- Cannot approve opname with >10% total variance (requires Finance approval)
- Opname locked after approval (immutable)

---

## 4. Indexes & Performance Optimization

### 4.1 Recommended Indexes

```sql
-- User lookup (authentication)
CREATE INDEX idx_users_email ON users(email);

-- Location queries
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_manager ON locations(manager_id);

-- Material location queries (critical for stock checks)
CREATE INDEX idx_material_locations_material ON material_locations(material_id);
CREATE INDEX idx_material_locations_location ON material_locations(location_id);
CREATE INDEX idx_material_locations_active ON material_locations(is_active);

-- Stock movement filtering
CREATE INDEX idx_movements_material ON stock_movements(material_id);
CREATE INDEX idx_movements_location_from ON stock_movements(from_location_id);
CREATE INDEX idx_movements_location_to ON stock_movements(to_location_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_movements_type ON stock_movements(type);

-- Ledger queries (CRITICAL: append-only, frequent reads)
CREATE INDEX idx_ledger_material_location_date ON stock_ledger(material_id, location_id, created_at);
CREATE INDEX idx_ledger_created_at ON stock_ledger(created_at);

-- Opname variance filtering
CREATE INDEX idx_opname_variance_pct ON opname_details(variance_percent);
CREATE INDEX idx_opname_status ON stock_opnames(status);

-- Sales order lookups
CREATE INDEX idx_so_location ON sales_orders(location_id);
CREATE INDEX idx_so_status ON sales_orders(status);
CREATE INDEX idx_so_created_at ON sales_orders(created_at);
```

### 4.2 Query Performance Targets

| Query Type | Max Response | Notes |
|-----------|--------------|-------|
| Stock balance lookup | <50ms | MaterialLocation single row |
| Location inventory summary | <200ms | Join MaterialLocation + Products (50-100 materials) |
| Monthly ledger query | <500ms | All movements for location in month |
| Opname report | <1s | Generate variance report for location (50-200 materials) |
| Dashboard metrics | <2s | Aggregations across 3 months, all locations |

---

## 5. Migration & Data Integrity

### 5.1 Initial Data Setup

**Phase 1 Onboarding** (for Ikki Coffee + Ikki Resto):

1. **Create locations**:
   - Gudang Utama (warehouse)
   - Ikki Coffee (outlet)
   - Ikki Coffee Kitchen (kitchen)
   - Ikki Resto (outlet)
   - Ikki Resto Kitchen (kitchen)

2. **Create users**:
   - System Admin (email: admin@ikki.com)
   - Warehouse Manager (email: warehouse@ikki.com)
   - Ikki Coffee Manager (email: coffee-manager@ikki.com)
   - Ikki Resto Manager (email: resto-manager@ikki.com)
   - Finance (email: finance@ikki.com)

3. **Assign roles**:
   - Create role assignments per user + location

4. **Import products & materials** (from existing catalog):
   - Raw materials (coffee, milk, sugar, etc.)
   - Packaging (cups, lids, straws, napkins)
   - Finished goods (recipes)

5. **Setup material-location bindings**:
   - Assign each material to its locations (warehouse, kitchens, outlets)
   - Set min/max stock thresholds per location

6. **Setup recipes**:
   - Define Bill of Materials for each menu item
   - Verify COGS calculations

### 5.2 Data Validation Checks

```sql
-- Check for orphaned records
SELECT * FROM user_assignments WHERE user_id NOT IN (SELECT id FROM users);
SELECT * FROM material_locations WHERE material_id NOT IN (SELECT id FROM materials);

-- Check for invalid states
SELECT * FROM material_locations WHERE current_stock < 0 OR reserved_stock < 0;
SELECT * FROM stock_opnames WHERE status = 'approved' AND variance_approved_by IS NULL;

-- Check data consistency
SELECT ml.location_id, ml.material_id, 
       SUM(qty) as ledger_balance,
       ml.current_stock,
       (SUM(qty) - ml.current_stock) as discrepancy
FROM stock_ledger sl
JOIN material_locations ml ON sl.material_id = ml.material_id AND sl.location_id = ml.location_id
GROUP BY ml.location_id, ml.material_id
HAVING ABS(SUM(qty) - ml.current_stock) > 0; -- Should return 0 rows
```

---

**Data Model Owner**: Database Architect  
**Last Reviewed**: 2026-04-24  
**Version**: 1.0 (MVP)
