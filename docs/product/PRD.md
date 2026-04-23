# Product Requirements Document (PRD): Ikki ERP

> **Version**: 2.0  
> **Last Updated**: 2026-04-24  
> **Audience**: Product Managers, Developers, Stakeholders  
> **Changelog**:
>
> - `v2.0` (2026-04-24) — Major revision: Enhanced business context, detailed feature specifications, use case documentation, comprehensive scope definition
> - `v1.2` (2026-04-03) — Architectural Reboot: Switched to Serial Integer IDs globally, enforced Dto suffix naming, and transitioned to Functional Router patterns (Golden Path 2.1)
> - `v1.1` (2026-03-26) — Added Product module separation, Moka POS integration section, architecture diagram, refined module scoping
> - `v1.0` (Initial) — Original draft with core module definitions

## 1. Executive Summary

### Purpose
This document defines all functional and non-functional requirements for the Ikki ERP system—a purpose-built enterprise resource planning platform for multi-location F&B operations with integrated warehouse management.

### Target Customer Profile
- **Primary**: Mid-scale restaurant & coffee chains (2-10 locations) with centralized warehouse
- **Example**: Ikki Group operating Ikki Resto + Ikki Coffee with shared Gudang Utama (Central Warehouse)
- **Complexity**: Multi-outlet inventory coordination, recipe standardization, supplier relationships, profitability tracking

### Core Problems Solved

| Current State (Pain) | Desired State (Solution) |
|---|---|
| Manual spreadsheet-based inventory tracking | Real-time centralized inventory dashboard with location-specific views |
| Outlet A doesn't know warehouse stock level | Live sync: Warehouse stock visible to all outlets instantly |
| Stock-outs due to poor visibility and manual ordering | Automated stock requests with intelligent reorder points and alerts |
| Unknown recipe costs and COGS per menu item | Auto-calculated COGS with waste tracking and margin analysis |
| Supplier orders tracked via WhatsApp/email | Structured purchasing workflow (PR → PO → GRN) with supplier performance tracking |
| Physical counts never match system records | Systematic opname process with digital sheets and variance reconciliation |
| No visibility into profitability by outlet | Real-time dashboards showing revenue, COGS, waste, and margins by location |

### Business Impact (12-Month Goals)
- **Efficiency**: Reduce manual data entry by 80%, cut order-to-fulfillment cycle by 50%
- **Accuracy**: Achieve 98%+ system-to-physical inventory accuracy
- **Cost Control**: Identify and eliminate waste, optimize recipe costs, improve gross margins by 2-5%
- **Scale**: Enable seamless addition of new outlets (0-6 hour onboarding)
- **Insights**: Enable data-driven decisions on menu engineering, purchasing, and staffing

---

## 2. Problem Definition & Business Context

### 2.1 Current State Analysis

**Fragmented Operations**
- Ikki Coffee, Ikki Resto, and Gudang Utama operate with minimal data integration
- Inventory levels tracked manually or via disconnected systems
- Stock requests via WhatsApp/verbal communication prone to misalignment
- No centralized source of truth for product availability

**Operational Inefficiencies**
- Stock opname (physical count) requires manual tallying—error-prone and labor-intensive
- Outlet managers have no real-time visibility into warehouse stock levels
- Purchasing decisions lack visibility into location-specific demand patterns
- Recipe costs estimated manually; actual COGS unknown until month-end analysis

**Cost Leakage & Visibility Gaps**
- Waste (spoilage, incorrect handling) not systematically tracked
- Price variance between locations due to independent purchasing
- Inability to identify underperforming menu items
- Supplier performance metrics (reliability, pricing) maintained informally

**Decision Delays**
- Monthly reporting is 3-5 days late (manual reconciliation)
- Profitability insights only available after month-close
- Reactive vs. proactive purchasing (no demand forecasting)
- Trend analysis impossible with disconnected data

### 2.2 Target Users & Use Cases

#### User Type 1: Outlet Manager (Ikki Coffee / Ikki Resto)
**Daily Tasks**:
- Check available stock in kitchen (morning stock check)
- Submit stock request to warehouse when low
- Log waste/spoilage during service
- Approve staff stock opname entries (end-of-shift)
- View outlet-specific profitability dashboard

**Pain Points**: 
- Currently takes 15-20 min to call warehouse for stock check
- Stock requests via WhatsApp with no confirmation
- Waste not tracked—no visibility into loss
- Profitability reports come weeks later

#### User Type 2: Warehouse Manager (Gudang Utama)
**Daily Tasks**:
- Receive incoming stock from suppliers
- Process stock transfer requests from outlets
- Conduct warehouse-level stock opname
- Track inventory levels (stock velocity, reorder triggers)
- Manage warehouse locations and organization

**Pain Points**:
- Manual receipt processing (30-40 min per shipment)
- Stock transfers tracked via clipboard—high error rate
- No visibility into which outlets need what, when
- Stock opname requires full day count; system doesn't auto-detect discrepancies

#### User Type 3: Procurement Officer (Head Office)
**Tasks**:
- Review stock velocity across all locations
- Create purchase orders to suppliers
- Track supplier delivery performance
- Monitor purchase costs vs. budget
- Approve high-variance or unusual orders

**Pain Points**:
- Demand forecast done manually (Excel-based)
- No supplier performance visibility
- Frequent duplicate orders or stockouts
- Price negotiation data incomplete

#### User Type 4: Head Chef / Line Cook
**Tasks**:
- Check stock availability before service starts
- Log waste/spoilage (broken items, expired goods, test tastings)
- Contribute to end-of-shift stock opname

**Pain Points**:
- Manual stock checks time-consuming
- Waste tracking sporadic—no accountability
- Opname sheets error-prone (illegible handwriting)

### 2.3 Success Criteria (Business Metrics)

**Operational KPIs**
- Inventory accuracy: 98%+ (system count vs. physical count)
- Stock-out incidents: < 5 per location per month
- Order-to-fulfillment time: < 4 hours for stock transfers
- Manual data entry time: < 15 min per day per outlet

**Financial KPIs**
- COGS accuracy: 95%+
- Gross margin improvement: +2-5% per location (via cost control)
- Waste as % of COGS: < 3%
- Purchasing efficiency: 100% PO fulfillment on-time

**User Adoption KPIs**
- Daily active users: 100% of relevant staff
- Feature adoption rate: > 80% for all major features
- User satisfaction: ≥ 4.2/5.0
- Support ticket volume: < 2 per week

---

## 3. Core Modules & Detailed Specifications (MVP Phase 1)

This section describes all functional modules included in the MVP release. Each module specifies use cases, business flows, and technical constraints. Modules are assigned **Layer** (0-3) to enforce strict dependency boundaries.

### 3.1 Layer 0 (Core System) — Zero Dependencies

#### 3.1.1 Location Management (Layer 0)

**Purpose**: Establish the geographic boundaries of operations. Every stock transaction is location-specific.

**Data Model**:
```
Location
├─ id: integer (PK)
├─ name: string (e.g., "Ikki Coffee - Bar", "Gudang Utama")
├─ type: enum ['warehouse', 'outlet', 'kitchen']
├─ address: string
├─ manager_id: integer (FK → User)
├─ is_active: boolean
├─ created_at: timestamp
└─ updated_at: timestamp
```

**Core Features**:
1. **Hierarchical Structure** (Flat for MVP)
   - `Gudang Utama` (Central Warehouse) — Parent
   - `Ikki Coffee - Bar` (Outlet/Display)
   - `Ikki Coffee - Kitchen` (Production/Storage)
   - `Ikki Resto - Bar` (Outlet/Display)
   - `Ikki Resto - Kitchen` (Production/Storage)

2. **Location Types**
   - `warehouse`: Central inventory storage
   - `outlet`: POS/customer-facing area
   - `kitchen`: Food production area
   
3. **Stock Ledger Scope**: Each location maintains separate stock ledger

4. **Transfer Paths** (Allowed location transitions):
   - `warehouse` ↔ `kitchen` (internal transfer)
   - `warehouse` ↔ `outlet` (delivery)

**Business Rules**:
- Only `warehouse` locations can receive goods from suppliers
- `outlet` locations cannot directly transfer to each other (must go through warehouse)
- Each location has a designated manager
- Location cannot be deleted if active stock exists

**APIs**:
- `GET /locations/list` — All locations (with manager info)
- `GET /locations/:id` — Location detail + current stock summary
- `POST /locations` — Create location (admin only)
- `PUT /locations/:id` — Update location settings

**UI Requirements**:
- Location dropdown in header (fast switching)
- Location-scoped views for all lists
- Location-based permissions enforcement

---

#### 3.1.2 Product Catalog Management (Layer 0)

**Purpose**: Central registry of all sellable/storable items. The foundation for all transactional operations.

**Data Model**:
```
Product
├─ id: integer (PK)
├─ sku: string (unique, e.g., "PROD-001")
├─ name: string (e.g., "Arabica Coffee Beans")
├─ category_id: integer (FK → Category)
├─ type: enum ['raw_material', 'packaging', 'finished_good']
├─ unit_of_measure: enum ['kg', 'liter', 'piece', 'box']
├─ cost_price: decimal (last known cost)
├─ selling_price: decimal (base price for POS)
├─ moka_sku: string (nullable, for POS mapping)
├─ is_active: boolean
├─ created_at: timestamp
└─ updated_at: timestamp

ProductCategory
├─ id: integer (PK)
├─ name: string (e.g., "Coffee Beans", "Packaging", "Dairy")
├─ parent_id: integer (FK, nullable, for hierarchy)
└─ ...
```

**Core Features**:
1. **Product Registry**
   - SKU auto-generation or manual entry
   - Categorization (for reporting and organization)
   - Cost tracking with change history
   - External POS mapping (Moka SKU)

2. **Product Types**
   - `raw_material`: Ingredients (coffee, milk, sugar)
   - `packaging`: Cups, lids, napkins, boxes
   - `finished_good`: Pre-packaged products, recipes

3. **Pricing Strategy**
   - Base selling price (can be overridden per outlet in Phase 2)
   - Cost price updated on each receiving
   - Margin calculation: (selling - cost) / selling

**Business Rules**:
- SKU must be unique within system
- Cost price can only be updated via goods receipt (GRN) transactions
- Product cannot be deleted; only marked inactive
- Category is required; hierarchy optional for MVP

**APIs**:
- `GET /products/list` — All active products (paginated, searchable)
- `GET /products/:id` — Product detail + current stock across locations
- `POST /products` — Create product (purchasing officer)
- `PUT /products/:id` — Update name, category, status
- `GET /products/by-category/:category_id` — Filter by category

**UI Requirements**:
- Product search with autocomplete
- Quick edit: cost price, status
- Category filter sidebar
- Stock status per location (mini table)

---

### 3.2 Layer 1 (Master Data) — Depends on Layer 0

#### 3.2.1 Material / Raw Material Data (Layer 1)

**Purpose**: Extend Product with inventory-specific attributes. Define stock keeping unit (SKU) behavior per location.

**Data Model**:
```
Material (extends Product)
├─ id: integer (PK, FK → Product)
├─ unit_conversion: JSON (e.g., {"1_box": "12_pcs", "1_liter": "1000_ml"})
├─ reorder_point: integer (trigger auto-alert when stock falls below)
├─ reorder_quantity: integer (suggested order qty when reordering)
├─ shelf_life_days: integer (nullable, for spoilage tracking)
└─ ...

MaterialLocation (junction table)
├─ id: integer (PK)
├─ material_id: integer (FK → Material)
├─ location_id: integer (FK → Location)
├─ current_stock: decimal (always ≥ 0)
├─ reserved_stock: decimal (allocated but not yet consumed)
├─ min_stock: integer (location-specific minimum)
├─ max_stock: integer (storage capacity)
├─ is_active: boolean
└─ ...
```

**Core Features**:

1. **Unit of Measure (UOM) System**
   - Flexible conversion: 1 Box = 12 Pieces; 1 Liter = 1000 ML
   - All stock movements internally converted to base unit
   - Transaction display shows user-friendly units

2. **Stock Alerts**
   - Auto-alert when stock < reorder_point
   - Push notification to Outlet Manager
   - Recommendation: reorder reorder_quantity units

3. **Material-Location Binding**
   - Not all materials available at all locations (e.g., whole milk only at Ikki Resto)
   - Each location has independent min/max stock thresholds
   - Reserved stock (allocated but unconsumed) tracked separately

4. **Expiration Tracking** (Phase 2)
   - Shelf life configured per material
   - Batch tracking for FIFO compliance
   - Alert 3 days before expiration

**Business Rules**:
- Material must have reorder_point ≤ max_stock
- Current_stock + reserved_stock cannot exceed max_stock
- Reorder_quantity is a suggestion; actual order is discretionary
- Material cannot be assigned to location if category mismatch

**APIs**:
- `GET /materials/list` — All materials with location-specific stock
- `GET /materials/:id` — Detail + stock across all locations + reorder settings
- `POST /materials/:id/assign-location` — Add material to location with min/max
- `PUT /materials/:id/reorder-settings` — Update reorder_point, reorder_qty

**UI Requirements**:
- Materials list with stock levels per location
- Reorder point threshold visualization (progress bar: red/yellow/green)
- Quick reorder: suggests reorder_quantity
- Expiration alerts (future phase)

---

#### 3.2.2 Identity & Access Management (IAM) (Layer 1)

**Purpose**: Centralized user, role, and permission management. Controls who can do what.

**Data Model**:
```
User
├─ id: integer (PK)
├─ email: string (unique)
├─ name: string
├─ phone: string (nullable)
├─ password_hash: string
├─ is_active: boolean
├─ last_login: timestamp
├─ created_at: timestamp
└─ updated_at: timestamp

Role
├─ id: integer (PK)
├─ name: enum ['admin', 'manager', 'staff', 'viewer']
├─ description: string
└─ ...

UserAssignment (junction)
├─ id: integer (PK)
├─ user_id: integer (FK → User)
├─ role_id: integer (FK → Role)
├─ location_id: integer (FK → Location)
├─ assigned_at: timestamp
└─ assigned_by: integer (FK → User, who assigned)

Permission
├─ id: integer (PK)
├─ role_id: integer (FK → Role)
├─ resource: string (e.g., 'inventory', 'material')
├─ action: enum ['create', 'read', 'update', 'delete', 'approve']
└─ ...
```

**Core Features**:

1. **Role-Based Access Control (RBAC)**
   - **Admin**: Full system access, user management, settings
   - **Manager** (Outlet/Warehouse): Full access to assigned location + read-only elsewhere
   - **Staff**: Limited to daily operations (stock check, waste log, opname entry)
   - **Viewer**: Read-only dashboard, reports

2. **Location-Based Permissions**
   - User assigned to specific location(s)
   - Manager of Ikki Coffee cannot modify Gudang Utama data
   - Can view cross-location analytics (with permission)

3. **Audit Trail**
   - Every write includes createdBy / updatedBy (user ID)
   - Soft deletes preserve historical data
   - Change log for sensitive operations (user creation, role change)

**Business Rules**:
- Email must be unique
- User cannot be assigned same role at same location twice
- At least one Admin user must exist at all times
- Inactive users cannot log in
- Deleted users marked soft-delete (not removed from DB)

**APIs**:
- `POST /auth/login` — Authenticate (email/password) → JWT token
- `POST /auth/refresh` — Refresh expired JWT
- `POST /auth/logout` — Invalidate token
- `GET /users/list` — All users (admin only)
- `POST /users` — Create user (admin)
- `PUT /users/:id` — Update user (admin/self)
- `POST /users/:id/assign-role` — Assign role + location

**UI Requirements**:
- Login page (email/password)
- User management grid (admin only): create, edit, assign roles
- Role assignment modal: select role + location
- Current user info in header

---

### 3.3 Layer 1.5 (Security) — Authentication

#### 3.3.1 Authentication (JWT-based)

**Purpose**: Secure API access with stateless JWT tokens.

**Mechanism**:
1. User logs in with email/password
2. Backend validates credentials
3. Backend generates JWT (access + refresh tokens)
4. Client stores token in localStorage (Phase 2: httpOnly cookie)
5. Client includes token in Authorization header for all requests
6. Backend validates token on each request

**Token Format**:
```
ACCESS TOKEN (expires in 1 hour):
{
  "sub": 1,           // user ID
  "email": "manager@ikki.com",
  "roles": ["manager"],
  "locations": [2, 3], // assigned locations
  "exp": 1640000000
}

REFRESH TOKEN (expires in 30 days):
{
  "sub": 1,
  "type": "refresh",
  "exp": 1642592000
}
```

**Security Best Practices**:
- Passwords hashed with bcrypt (salt rounds ≥ 12)
- No password logging or transmission in plain text
- Tokens never logged in audit trail
- HTTPS mandatory in production

---

### 3.4 Layer 2 (Operations) — Transactional Modules

#### 3.4.1 Inventory Operations (Layer 2)

**Purpose**: Manage stock movements, ensure accuracy, enable real-time visibility.

**Data Model**:
```
StockMovement
├─ id: integer (PK)
├─ type: enum ['inbound', 'outbound', 'transfer', 'adjustment']
├─ reference_id: integer (FK → Purchase, Recipe, etc.)
├─ from_location_id: integer (FK, nullable)
├─ to_location_id: integer (FK)
├─ material_id: integer (FK → Material)
├─ quantity: decimal
├─ unit_of_measure: string (e.g., "kg")
├─ cost_per_unit: decimal (snapshot of cost at time of transaction)
├─ notes: string
├─ created_by: integer (FK → User)
├─ created_at: timestamp
└─ transaction_date: date

StockLedger (append-only log)
├─ id: integer (PK)
├─ material_id: integer (FK → Material)
├─ location_id: integer (FK → Location)
├─ movement_id: integer (FK → StockMovement)
├─ opening_balance: decimal
├─ quantity_change: decimal (+ or -)
├─ closing_balance: decimal
├─ unit_cost: decimal (for WAC calculation)
├─ created_at: timestamp
└─ ...

StockOpname (Physical Count)
├─ id: integer (PK)
├─ location_id: integer (FK → Location)
├─ cycle_id: string (e.g., "OPN-2026-04-24-001")
├─ status: enum ['draft', 'in_progress', 'completed', 'approved']
├─ expected_stock: JSON (system state at start)
├─ physical_count: JSON (actual counted)
├─ variance: JSON (diff, auto-calculated)
├─ variance_approved_by: integer (FK → User, nullable)
├─ completed_at: timestamp
├─ created_by: integer (FK → User)
└─ ...

StockOpnameDetail
├─ id: integer (PK)
├─ opname_id: integer (FK → StockOpname)
├─ material_id: integer (FK → Material)
├─ expected_qty: decimal
├─ physical_qty: decimal (entered by user)
├─ variance: decimal (auto-calculated)
├─ verified_by: integer (FK → User, who counted)
└─ notes: string
```

**Core Features**:

1. **Stock Movement Types**

   **a) Inbound (Receiving)**
   - Supplier → Warehouse (via GRN)
   - Update material cost_price based on invoice
   - Create StockMovement: from=null, to=warehouse
   - Auto-update MaterialLocation.current_stock

   **b) Outbound (Consumption)**
   - Warehouse/Outlet → Void (sold, used, wasted)
   - Create StockMovement: from=outlet, to=null
   - Triggers from: POS sales (via Recipe), manual waste entry
   - Cost recorded (for COGS calculation)

   **c) Internal Transfer**
   - Warehouse → Outlet (stock request fulfillment)
   - Warehouse → Kitchen (production consumption)
   - Two-step process: create, then confirm receipt
   - If receipt not confirmed in 24h, alert manager

   **d) Adjustment (Opname)**
   - System → Warehouse (reconciliation after stock opname)
   - Only created after opname completion + manager approval
   - Records variance (physical - system count)
   - High variance (>5%) requires additional approval

2. **Stock Opname (Physical Count Workflow)**

   **a) Preparation Phase**
   - System generates opname sheet with: Material, Expected Qty, UOM, Location
   - Include item photos for barcode/visual verification
   - Export to PDF for printing (or use tablet)

   **b) Counting Phase**
   - Staff enters physical count for each material
   - Counting location locked during opname (prevent movements)
   - Multi-user: each staff member counts separately
   - System identifies discrepancies in real-time

   **c) Resolution Phase**
   - Manager reviews variances
   - Large variances (>5% or >10 units): investigate + adjust reason
   - Manager approves adjustments
   - System creates AdjustmentMovements to align system with physical

   **d) Closure Phase**
   - Opname marked completed
   - Ledger finalized for period
   - Report available showing accuracy %

3. **Real-Time Stock Visibility**
   - Stock on-hand: current_stock - reserved_stock
   - Available for sale: on-hand minus safety minimum
   - Reserved stock: allocated to pending orders
   - Color-coded status: Green (ok) / Yellow (low) / Red (critical)

4. **Waste & Spoilage Tracking**
   - Staff logs waste during shift: material, qty, reason (spoiled, dropped, test taste, etc.)
   - Each waste entry: createdBy user, location, timestamp
   - Waste aggregated in dashboard: cost per day, % of revenue
   - Trend analysis: identify patterns (e.g., high spoilage on certain items)

**Business Rules**:
- Stock movements must have positive quantity
- Cost snapshot recorded at time of transaction (no retroactive cost changes)
- Reserved stock prevents over-allocation
- Opname cannot proceed if pending stock movements exist
- Waste entries must include reason code
- No negative stock (safety constraint)

**APIs**:
- `GET /inventory/stock-summary` — All materials + current stock by location
- `GET /inventory/stock/:material_id` — Stock history + movements for specific material
- `POST /inventory/transfer` — Create inter-location transfer
- `PUT /inventory/transfer/:id/confirm` — Confirm receipt at destination
- `POST /inventory/waste` — Log waste entry
- `GET /inventory/opname/prepare` — Generate opname sheet
- `POST /inventory/opname` — Start physical count
- `PUT /inventory/opname/:id/entry` — Enter physical count for material
- `PUT /inventory/opname/:id/approve` — Approve variances + finalize
- `GET /inventory/ledger` — Stock ledger query (filtered by material/location/date)

**UI Requirements**:
- **Stock Dashboard**: Material list with real-time stock levels, reorder status, location filter
- **Transfer Form**: From/to location, material select, qty, confirm
- **Waste Logger**: Quick-entry form (material, qty, reason dropdown)
- **Opname Sheet**: Two-column layout (Expected | Physical), count verification
- **Ledger View**: Chronological stock movements with drill-down detail
- **Analytics**: Waste trend chart, stock turnover, accuracy %

---

#### 3.4.2 Recipe & Bill of Materials (Layer 2)

**Purpose**: Define how raw materials transform into finished goods. Calculate COGS automatically.

**Data Model**:
```
Recipe
├─ id: integer (PK)
├─ name: string (e.g., "Iced Latte")
├─ product_id: integer (FK → Product, the finished good)
├─ yield: integer (1 = single serving, 5 = batch)
├─ base_cost: decimal (auto-calculated from BOM)
├─ is_active: boolean
├─ version: integer (for recipe updates over time)
├─ created_at: timestamp
└─ updated_at: timestamp

RecipeComponent (Bill of Materials)
├─ id: integer (PK)
├─ recipe_id: integer (FK → Recipe)
├─ material_id: integer (FK → Material)
├─ quantity: decimal (e.g., 18 for grams of espresso)
├─ unit_of_measure: string (e.g., "grams")
├─ is_optional: boolean (garnish, seasonal ingredient)
└─ ...

RecipeCostHistory
├─ id: integer (PK)
├─ recipe_id: integer (FK → Recipe)
├─ calculated_cost: decimal
├─ cost_snapshot: JSON (material costs at time of calculation)
├─ calculated_at: date
└─ ...
```

**Core Features**:

1. **Bill of Materials (BOM)**
   - Define exact materials + quantities for each recipe
   - Support variable yield (1 serving vs. batch of 5)
   - Optional components (e.g., whipped cream, extra espresso shot)
   - Link to finished product (for inventory tracking)

2. **Auto Cost Calculation**
   - COGS = Σ (material_qty × material_unit_cost)
   - Recalculated daily based on latest material costs
   - Cost snapshot preserved for historical accuracy
   - Gross margin = (selling_price - COGS) / selling_price

3. **Version Control** (Phase 2)
   - Track recipe changes over time (ingredient swap, qty update)
   - Revert to previous version if needed
   - Impact analysis: which products affected?

4. **Recipe-Driven Inventory Deduction**
   - When recipe is sold (via POS or Sales Order):
   - System auto-deducts all BOM components from location stock
   - Reserves stock first (prevent oversell)
   - Logs stock movement with recipe reference

**Business Rules**:
- Recipe cannot be deleted (version history maintained)
- Recipe cost recalculated when material cost changes
- Finished product must exist before recipe creation
- Recipe must include ≥1 BOM component
- Yield must be ≥1

**APIs**:
- `GET /recipes/list` — All recipes + current COGS
- `GET /recipes/:id` — Recipe detail + BOM components + cost trend
- `POST /recipes` — Create recipe
- `PUT /recipes/:id` — Update name, yield, status
- `POST /recipes/:id/component` — Add material to BOM
- `DELETE /recipes/:id/component/:component_id` — Remove material from BOM
- `GET /recipes/:id/cost-history` — Cost trend over time

**UI Requirements**:
- Recipe builder: select product, add materials with qty
- BOM table: Material | Qty | UOM | Unit Cost | Total Cost
- COGS snapshot: current cost + 30-day trend chart
- Drag-to-reorder BOM components
- Optional toggle for seasonal ingredients
- Cost history chart

---

#### 3.4.3 Sales & Distribution (Layer 2)

**Purpose**: Manage customer orders, allocate inventory, and track fulfillment.

**Data Model**:
```
SalesOrder
├─ id: integer (PK)
├─ so_number: string (unique, e.g., "SO-2026-04-24-001")
├─ location_id: integer (FK → Location, where order placed)
├─ customer_type: enum ['walk_in', 'corporate', 'delivery_partner']
├─ order_date: timestamp
├─ delivery_date: date (nullable)
├─ total_amount: decimal
├─ status: enum ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled']
├─ notes: string
├─ created_by: integer (FK → User)
├─ created_at: timestamp
└─ updated_at: timestamp

SalesOrderLine
├─ id: integer (PK)
├─ so_id: integer (FK → SalesOrder)
├─ product_id: integer (FK → Product)
├─ quantity: integer
├─ unit_price: decimal (snapshot at time of order)
├─ line_total: decimal (qty × unit_price)
├─ status: enum ['pending', 'reserved', 'shipped', 'cancelled']
└─ ...

DeliveryOrder (future)
├─ id: integer (PK)
├─ do_number: string (unique)
├─ so_id: integer (FK → SalesOrder)
├─ from_location_id: integer (FK → Location)
├─ to_location_id: integer (FK → Location, delivery address)
├─ status: enum ['draft', 'ready', 'picked', 'shipped', 'delivered']
├─ shipped_at: timestamp (when goods left warehouse)
├─ delivered_at: timestamp (when customer received)
└─ ...
```

**Core Features**:

1. **Sales Order (SO)**
   - Customer places order (walk-in, phone, delivery partner)
   - Salesperson enters into system or syncs from POS
   - Items allocated from outlet stock (via Recipe components)
   - SO can be modified until confirmed

2. **Inventory Allocation**
   - On SO confirmation: system reserves stock quantities
   - Reserved stock = allocated but not yet shipped
   - Prevents oversell (system blocks if insufficient stock)
   - Reserved qty released if SO cancelled

3. **Fulfillment Workflow** (simplified for MVP)
   - SO Confirmed → Stock reserved
   - Stock ready → Status: "ready to ship"
   - Goods packed → Status: "shipped"
   - Delivery completion → Status: "delivered"
   - Inventory cost recognized

4. **Integration with Recipe/Inventory**
   - Finished goods: sold from inventory (recipe-produced items)
   - Raw orders: customer buys raw materials (e.g., coffee beans for corporate)
   - Mixed orders: combination of both

**Business Rules**:
- SO cannot be confirmed if insufficient reserved stock
- SO number auto-generated, unique per system
- Unit price snapshot to prevent price disputes
- Cancelled orders release reserved stock
- No negative quantities

**APIs**:
- `POST /sales/orders` — Create sales order
- `PUT /sales/orders/:id` — Update order (if not shipped)
- `POST /sales/orders/:id/confirm` — Confirm + allocate inventory
- `PUT /sales/orders/:id/ship` — Mark as shipped (deduct final inventory)
- `PUT /sales/orders/:id/cancel` — Cancel order + release reserved stock
- `GET /sales/orders/list` — Filtered list (location, date range, status)
- `GET /sales/orders/:id` — Order detail + lines + fulfillment status

**UI Requirements**:
- SO creation form: location, customer info, add items (product search)
- Line item entry: product, qty, auto-populate unit price, line total
- Stock availability check: shows real-time qty available vs. ordered
- SO list: filter by location, date, status
- Quick view: order summary, lines, total amount

---

### 3.5 Layer 2 (Operations) — Purchasing Module (MVP Phase 2 / Extended Scope)

#### 3.5.1 Purchasing & Procurement (Layer 2)

**Purpose**: Structure supplier acquisition from requisition through goods receipt.

**Data Model** (Planned for Phase 2, but documented for architectural alignment):
```
PurchaseRequisition
├─ id: integer (PK)
├─ pr_number: string (unique)
├─ location_id: integer (FK, originating location)
├─ required_date: date
├─ status: enum ['draft', 'submitted', 'approved', 'rejected', 'ordered']
├─ created_by: integer (FK → User)
└─ ...

PurchaseOrder
├─ id: integer (PK)
├─ po_number: string (unique)
├─ supplier_id: integer (FK → Supplier, TBD)
├─ po_date: date
├─ expected_delivery: date
├─ status: enum ['draft', 'sent', 'acknowledged', 'partial', 'complete', 'cancelled']
├─ total_amount: decimal
├─ created_by: integer (FK → User)
└─ ...

GoodsReceiptNote
├─ id: integer (PK)
├─ grn_number: string (unique)
├─ po_id: integer (FK → PurchaseOrder)
├─ warehouse_id: integer (FK → Location)
├─ received_date: date
├─ status: enum ['draft', 'confirmed', 'invoiced']
├─ received_by: integer (FK → User)
└─ ...

GoodsReceiptLine
├─ id: integer (PK)
├─ grn_id: integer (FK → GoodsReceiptNote)
├─ po_line_id: integer (FK → POLine)
├─ material_id: integer (FK → Material)
├─ ordered_qty: decimal
├─ received_qty: decimal
├─ unit_price: decimal (from PO)
├─ batch_number: string (nullable)
├─ expiry_date: date (nullable)
└─ ...
```

**Core Features** (Phase 2):
1. Purchase Requisition (PR) with multi-tier approval
2. Purchase Order (PO) creation from approved PRs
3. Supplier performance tracking (on-time delivery %, price variance %)
4. Goods Receipt (GRN) workflow with quality inspection
5. Three-way match: PO ↔ GRN ↔ Invoice (fraud prevention)

---

### 3.6 Layer 3 (Aggregators) — Cross-Module Features

#### 3.6.1 Dashboard & Analytics

**Purpose**: High-level KPI visibility across all operations.

**Data Model**:
```
DashboardMetric
├─ id: integer (PK)
├─ location_id: integer (FK, nullable for system-wide)
├─ metric_type: enum ['revenue', 'cogs', 'waste', 'stock_value', 'turnover']
├─ value: decimal
├─ period: date (daily, weekly, monthly)
└─ ...
```

**KPI Cards** (Real-time):
1. **Revenue (Today/This Month)**
   - Total sales by location
   - Trend vs. same period last month
   - Top products (by revenue)

2. **COGS & Gross Margin**
   - Current day COGS
   - Margin % (= (revenue - COGS) / revenue)
   - Target vs. actual comparison

3. **Inventory Health**
   - Stock value (inventory × current cost)
   - Items in low stock (red zone)
   - Stock turnover ratio (= COGS / avg inventory)

4. **Waste & Loss**
   - Waste cost (today, MTD, YTD)
   - Waste % of revenue
   - Top waste categories

5. **Stock Accuracy**
   - Last opname variance %
   - Trend: improving or declining?
   - Locations with high discrepancies

**Charts** (Trend Analysis):
- Revenue trend (30-day line chart)
- COGS % trend (stacked area)
- Stock movement (inbound vs. outbound)
- Material usage frequency (top 10 items consumed)
- Waste breakdown (pie chart: spoilage, dropped, test, etc.)

**Location Filtering**:
- System-wide view (consolidated)
- Single location view (Ikki Coffee or Ikki Resto)
- Comparative view (side-by-side location stats)

**UI Requirements**:
- Dashboard uses Recharts for visualization
- Responsive: works on desktop and tablet
- Real-time updates (WebSocket polling every 5 min)
- Date range picker (1 week, 1 month, YTD, custom)
- Export to PDF (for presentations)

---

#### 3.6.2 Moka POS Integration (Layer 3 / Future Phase)

**Purpose**: Sync sales from external POS system into ERP for inventory-recipe deduction.

**Integration Points** (Phase 2):
1. **Product Sync**: Pull Moka product list → verify mapping to ERP product registry
2. **Sales Sync**: Pull daily sales → auto-deduct recipe components from inventory
3. **Scrap/Waste Sync**: POS "void" transactions → record as waste in inventory
4. **Category Sync**: Moka categories → report grouping in analytics

**Technical Approach**:
- OAuth authentication to Moka API
- Scheduled sync every 15 minutes (configurable)
- Conflict resolution: if POS differs from ERP, log discrepancy + alert manager
- Audit log: every sync event recorded

---

## 4. Design & User Experience

### 4.1 Interface Principles

**Design Philosophy**:
- **Density Over Aesthetics**: Optimize for information density on desktop; compact data visualization
- **Keyboard-First**: Support extensive keyboard navigation for data entry speed
- **Minimal Clicks**: 2-click rule for common operations (e.g., stock check → add to cart)
- **Mobile-Friendly**: Responsive design supports tablet use in warehouse/kitchen

**Accessibility**:
- WCAG 2.1 AA compliance (keyboard navigation, color contrast, screen readers)
- Touch-target size: ≥44x44px (for warehouse/kitchen usage with gloved hands)

### 4.2 UI Technology Stack

- **Framework**: React 19 (Vite bundler)
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn/UI + Base UI
- **Data Tables**: TanStack Table (for complex inventory lists)
- **Forms**: TanStack Form (with Zod validation)
- **Charts**: Recharts
- **Icons**: Lucide React + Huge Icons

### 4.3 Wireframe Examples

*[Wireframes to be created separately in Figma/design tool]*

Key screens:
1. Login
2. Dashboard (KPI cards + charts)
3. Inventory (stock summary, search, filters)
4. Material details (stock, ledger, opname history)
5. Stock transfer (form, confirmation)
6. Waste logger (quick entry)
7. Opname sheet (count entry)
8. Sales order creation
9. User management (admin only)

---

## 5. Data Model & Architecture Overview

(Refer to ARCHITECTURE.md for detailed schema, database patterns, and performance optimization)

### 5.1 Core Entities Relationship

```
Location
  ├─ has many MaterialLocation
  ├─ has many StockMovement (as to_location)
  └─ has many User (as manager)

Material (extends Product)
  ├─ has many MaterialLocation
  ├─ has many RecipeComponent
  ├─ has many StockLedger
  └─ has many StockMovement

Recipe
  ├─ has many RecipeComponent
  └─ links to Product (finished good)

StockMovement
  ├─ references Material
  ├─ references from/to Location
  └─ creates StockLedger entry

User
  ├─ has many UserAssignment (Role + Location)
  └─ audit trail: createdBy, updatedBy

...and more (see ARCHITECTURE.md for complete schema)
```

### 5.2 Key Database Patterns

- **Append-Only Ledger**: StockLedger records all transactions (immutable)
- **Soft Deletes**: Users, Materials marked inactive (never hard-deleted)
- **Audit Trail**: Every write includes createdBy, updatedBy, timestamps
- **Transactions**: Multi-step operations (transfers, opname approval) wrapped in DB transactions

---

## 6. Non-Functional Requirements

### 6.1 Performance

- **API Response Time**: < 200ms (p95) for all endpoints
- **Page Load Time**: < 2 seconds (first paint)
- **Concurrent Users**: Support 50+ simultaneous users
- **Database Query**: All queries < 1 second (with proper indexing)
- **Pagination**: Default 20 items/page, max 100

### 6.2 Reliability

- **Uptime SLA**: 99.5% (monthly)
- **MTTR** (Mean Time To Recovery): < 30 minutes
- **Data Backup**: Daily backups, point-in-time recovery

### 6.3 Security

- **Authentication**: JWT tokens (1-hour expiry, 30-day refresh)
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **RBAC**: Location-based access control
- **Audit Logging**: All mutations logged with user context
- **Password Policy**: Bcrypt hashing, min 8 characters, no reuse of last 5 passwords

### 6.4 Scalability

- **Database**: PostgreSQL (Neon serverless) with read replicas
- **Caching**: Redis for session store + frequently accessed data (inventory summary)
- **CDN**: Static assets (JS, CSS) served via CDN
- **Horizontal Scaling**: Stateless server design enables load balancing

### 6.5 Maintainability

- **Code Quality**: Strict TypeScript, Oxlint + Oxfmt
- **Testing**: Unit tests for services, integration tests for APIs
- **Documentation**: Clear code comments, API specs via OpenAPI
- **Versioning**: Semantic versioning for releases

---

## 7. Success Criteria & Launch Readiness

### Phase 1 MVP Launch Gates

**Pre-Launch Checklist**:
- [ ] All 4 core modules implemented (Location, Material, Inventory, Recipe)
- [ ] Ikki Coffee + Ikki Resto fully onboarded (100% staff trained)
- [ ] System-to-physical accuracy ≥ 95% (4 consecutive weeks)
- [ ] Zero critical bugs; <5 medium bugs
- [ ] User satisfaction ≥ 4.0/5.0

**Acceptance Criteria**:
- **Functionality**: All documented features working as designed
- **Performance**: All API endpoints <200ms, page loads <2s
- **Security**: Passed security audit, RBAC enforced
- **Data Integrity**: No lost transactions, audit trail complete

---

## 8. Out of Scope (MVP Phase 1)

The following features are explicitly excluded from MVP but planned for Phase 2+:

- **Purchasing Module**: PO, GRN, supplier management (Phase 2)
- **Financial Integration**: Accounting system export, profit/loss statements (Phase 2)
- **Mobile Apps**: Native Android/iOS apps (Phase 2)
- **Advanced Forecasting**: Predictive ordering, demand sensing (Phase 2)
- **Multi-Warehouse Hierarchy**: Only flat structure in MVP (Phase 2)
- **Batch/Serial Tracking**: FIFO/expiration by batch (Phase 2)
- **Menu Engineering**: Profitability analysis per menu item (Phase 2)
- **Supplier Portal**: External supplier access (Phase 2)

---

## 9. Glossary & Terminology

| Term | Definition |
|------|-----------|
| **COGS** | Cost of Goods Sold = sum of material costs for products sold |
| **Opname** | Physical inventory count; reconciliation of system vs. actual |
| **Gross Margin** | (Revenue - COGS) / Revenue; profitability per sale |
| **Stock Velocity** | How fast inventory is consumed/sold (units per day) |
| **Reorder Point** | Inventory level that triggers auto-alert to replenish |
| **Reserved Stock** | Inventory allocated to pending orders (not yet shipped) |
| **Scrap/Waste** | Items discarded (spoilage, dropped, test tasting) |
| **UOM** | Unit of Measure (kg, liter, piece, box) |
| **WAC** | Weighted Average Cost; cost calculation method |
| **POS** | Point of Sale; physical checkout system |
| **SKU** | Stock Keeping Unit; product identifier |

---

## 10. Appendices

### A. User Stories (MVP Phase 1)

**As a Warehouse Manager**:
- I want to see real-time stock levels across all outlet locations so I know what to prioritize for replenishment
- I want to process stock transfer requests in <5 minutes so outlets don't wait long
- I want to conduct monthly stock opname with digital sheets so accuracy improves and manual errors disappear

**As an Outlet Manager**:
- I want to check stock availability at central warehouse from my phone so I can quickly submit requests
- I want to see my outlet's profitability dashboard so I understand which items are profitable
- I want waste to be automatically tracked so we can identify where losses occur

**As a Procurement Officer**:
- I want to see stock velocity trends so I can optimize reorder quantities
- I want supplier performance metrics so I can negotiate better terms
- I want purchasing visibility across all locations so I avoid duplicate orders

**As System Administrator**:
- I want strict role-based access so staff can't access data outside their location
- I want complete audit trails so I can investigate discrepancies
- I want easy user onboarding so new outlets can go live in <1 day

### B. Sample Data Model (Partial Schema)

*[See ARCHITECTURE.md for complete database schema and migration files]*

### C. API Contract Examples

*[See OpenAPI specs / Swagger documentation (Phase 2)]*

### D. Deployment Checklist

*[See DEPLOYMENT.md (Phase 2)]*

---

**Document Owner**: [Name]  
**Last Reviewed**: 2026-04-24  
**Next Review**: 2026-05-24

