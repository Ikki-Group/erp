# Location Management

**Layer**: 0 (Core System - No Dependencies)  
**Status**: MVP - Foundation for all inventory operations  
**Complexity**: Low (CRUD + simple tree)

---

## 1. Overview

The Location module defines the physical boundaries of operations in the ERP. Every stock movement, user assignment, and inventory count is scoped to a location. Locations form the backbone of Location-Based Access Control (LBAC) - the primary security model.

**Location Types**:
- **Warehouse** (Gudang Utama): Central inventory hub, receives from suppliers, distributes to outlets
- **Outlet** (Ikki Coffee, Ikki Resto): Customer-facing locations with POS, holds display/operating inventory
- **Kitchen**: Food preparation area, receives materials from warehouse, produces finished goods

**Design Philosophy**: Flat structure (no nested zones/racks/bins) for operational speed in F&B environment.

---

## 2. Core Objectives

- **Operational Clarity**: Mirror actual business structure (2 outlets + central warehouse)
- **Inventory Scoping**: All stock movements tied to locations for accurate traceability
- **Access Control**: Primary dimension for role-based access (user → location → permissions)
- **Transfer Paths**: Define allowed stock movement routes (warehouse ↔ outlet, warehouse ↔ kitchen)
- **Organizational Context**: Serve as context for all transactional queries (sales, opname, transfers)

---

## 3. Key Entities & Relationships

```
Location (Foundation)
├─ Gudang Utama (Warehouse)
│  ├─ type: "warehouse"
│  ├─ can_receive_from_supplier: true
│  └─ can_transfer_to: [outlet, kitchen]
├─ Ikki Coffee (Outlet)
│  ├─ type: "outlet"
│  ├─ manager_id: FK → User (who manages this location?)
│  └─ can_receive_from: [warehouse]
├─ Ikki Coffee - Kitchen (Kitchen)
│  ├─ type: "kitchen"
│  └─ can_receive_from: [warehouse]
└─ Ikki Resto (Outlet)
   ├─ type: "outlet"
   ├─ manager_id: FK → User
   └─ can_receive_from: [warehouse]

Relationships:
- Location → User (many-to-many via UserAssignment)
  [User assigned to location with role + permissions]
- Location → MaterialLocation (one-to-many)
  [Each material can exist at multiple locations with different stock levels]
- Location → StockMovement (one-to-many)
  [Every stock movement from_location or to_location]
- Location → StockOpname (one-to-many)
  [Each location has separate monthly opname]

Transfer Path Rules (MVP):
✓ warehouse ↔ kitchen (internal redistribution)
✓ warehouse ↔ outlet (delivery to store)
✗ outlet ↔ outlet (not allowed - must go through warehouse)
✗ kitchen ↔ outlet (not allowed - must go through warehouse)
```

---

## 4. Use Cases & Workflows

### UC-001: Setup New Outlet (Opening Ikki Coffee - Bali)

**Actors**: Manager, System Admin  
**Precondition**: Business decision made to open new outlet

**Steps**:
1. Admin creates Location: "Ikki Coffee - Bali"
   - Type: "outlet"
   - Address: "Jl. Raya Ubud, Bali"
   - Manager ID: Budi (user_id=5)
   - Status: Active
2. System generates location_id: 4
3. Admin assigns materials to this location
   - For each material (coffee, milk, cups, etc):
   - Create MaterialLocation(material=coffee, location=4, min_stock=50kg, max_stock=200kg)
4. Admin assigns staff users to location
   - Barista (role=staff) → location 4
   - Chef (role=staff) → location 4
5. Manager Budi can now:
   - Request stock from warehouse
   - Track inventory at Bali outlet
   - Approve monthly opname
6. Moka POS configured to sync sales to this location

**Business Rules**:
- Location name must be unique
- Manager must be existing user
- Cannot create outlet without warehouse having materials
- All active materials must be assigned to new location

---

### UC-002: Request Stock From Warehouse (Daily morning)

**Actors**: Barista/Chef (at outlet), Warehouse Manager  
**Precondition**: Location has materials assigned with reorder_point set

**Steps**:
1. Barista at Ikki Coffee checks stock: Milk = 45L (threshold: 100L)
2. Milk status: YELLOW (low)
3. Barista clicks "Request Stock" → selects Milk
4. System shows: current 45L, suggests qty: 200L (2x reorder qty)
5. Barista submits request
6. Warehouse Manager receives notification
7. Warehouse packs 200L milk
8. Updates system: StockTransfer from warehouse to Ikki Coffee
9. Stock updated:
   - Warehouse: -200L
   - Ikki Coffee: +200L
10. Barista confirms receipt

**Business Rules**:
- Only warehouse can send to outlet
- Only outlet can request from warehouse
- Transfer path must be pre-defined (valid)
- Cannot transfer more than warehouse available stock

---

### UC-003: Inter-Location Stock Check (Inventory manager's daily task)

**Actors**: Warehouse Manager  
**Precondition**: User has manager role at warehouse location

**Steps**:
1. Manager opens Dashboard
2. Selects location: "Gudang Utama"
3. Views summary: 
   - Total materials: 47 types
   - Stock value: Rp 125,000,000
   - Low-stock items: 5 (below minimum)
   - Stock accuracy: 97.2% (from last opname)
4. Drills down to low-stock items:
   - Espresso: 12kg (min: 50kg) - CRITICAL
   - Milk: 45L (min: 100L) - CRITICAL
   - Cups: 150 (min: 500) - CRITICAL
5. Manager decides: 
   - Order espresso from supplier (via purchasing module Phase 2)
   - Transfer milk from backup stock
   - Order cups immediately

**Business Rules**:
- Only users assigned to location can see its data
- Admin can view all locations
- Stock queries by location are cached (refresh every 15 min)

---

### UC-004: Location-Based Access Control (Permission scoping)

**Actors**: System Admin  
**Precondition**: User created, location created

**Steps**:
1. Staff "Adi" hired at Ikki Coffee
2. Admin creates: UserAssignment
   - User: Adi
   - Role: "Staff"
   - Location: Ikki Coffee
3. Adi logs into system
4. System loads: user permissions scoped to Ikki Coffee
5. Adi can access:
   - Stock check at Ikki Coffee ✓
   - Waste entry at Ikki Coffee ✓
   - Opname at Ikki Coffee ✓
   - Stock check at Ikki Resto ✗ (denied)
   - Warehouse inventory ✗ (denied)
6. Adi cannot:
   - View other location's stock
   - Create purchase orders (manager only)
   - Approve opname variance (manager only)
   - Delete locations (admin only)

**Business Rules**:
- Users can have multiple location assignments
- Role determines actions, location determines scope
- Admin/Owner can bypass location filters
- All queries auto-filtered by user's assigned locations

---

## 5. Data Model

### Location Table

```sql
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('warehouse', 'outlet', 'kitchen')),
  address TEXT,
  phone VARCHAR(20),
  manager_id INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
)

CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_manager ON locations(manager_id);
CREATE INDEX idx_locations_is_active ON locations(is_active);
```

### Key Fields:

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | SERIAL | Unique identifier | 1 |
| `name` | VARCHAR(255) | Display name | Gudang Utama |
| `type` | VARCHAR(50) | warehouse/outlet/kitchen | outlet |
| `address` | TEXT | Physical location | Jl. Raya Ubud |
| `phone` | VARCHAR(20) | Contact number | 081234567890 |
| `manager_id` | INTEGER | Who manages (FK User) | 3 |
| `is_active` | BOOLEAN | Soft-delete flag | true |

### Transfer Path Logic

```typescript
const TRANSFER_PATHS = {
  warehouse: ['outlet', 'kitchen'],  // warehouse can send to outlet/kitchen
  outlet: ['warehouse'],              // outlet can receive from warehouse
  kitchen: ['warehouse'],             // kitchen can receive from warehouse
  // Blocked: outlet ↔ outlet, kitchen ↔ outlet, kitchen ↔ kitchen
}

// Validation in StockMovement creation:
if (!TRANSFER_PATHS[fromLocation.type]?.includes(toLocation.type)) {
  throw new ConflictError('Invalid transfer path', 'INVALID_TRANSFER_PATH')
}
```

---

## 6. Business Rules & Validations

**Creation Rules**:
- Name must be unique (case-insensitive)
- Type must be one of: warehouse, outlet, kitchen
- Manager must exist (if provided)
- At least one warehouse must exist

**Update Rules**:
- Can update: name, address, phone, manager_id, status
- Cannot change type (immutable after creation)
- Cannot deactivate if active stock exists (prevents orphaning inventory)

**Deletion Rules**:
- Locations never hard-deleted
- Mark as `is_active = false` (soft-delete)
- Inactive locations:
  - Excluded from list views
  - Excluded from stock transfers
  - Preserved for historical reporting

**Stock Transfer Rules**:
- Only valid transfer paths allowed (see Transfer Path Logic)
- Cannot transfer more qty than source location has
- From and to must be different locations
- Both locations must be active

---

## 7. API Endpoints & Routes

### GET `/locations/list`
**Description**: List all locations (optionally filtered by type)  
**Auth**: Optional (some views public)  
**Query Params**:
```typescript
{
  type?: 'warehouse' | 'outlet' | 'kitchen',
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
      "name": "Gudang Utama",
      "type": "warehouse",
      "address": "Jl. Warehouse No. 1",
      "phone": "081234567890",
      "manager_id": 2,
      "manager_name": "Warehouse Manager",
      "is_active": true,
      "stock_count": 47,
      "stock_value_rp": 125000000,
      "user_count": 8
    }
  ]
}
```

### GET `/locations/:id`
**Description**: Get location detail with stock summary  
**Auth**: User must have access to location (or Admin)  
**Response**:
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "id": 1,
    "name": "Gudang Utama",
    "type": "warehouse",
    "address": "Jl. Warehouse No. 1",
    "phone": "081234567890",
    "manager_id": 2,
    "manager_name": "Warehouse Manager",
    "is_active": true,
    "created_at": "2026-04-01T10:00:00Z",
    "created_by": 1,
    "updated_at": "2026-04-24T15:30:00Z",
    "updated_by": 3,
    "stock_summary": {
      "total_materials": 47,
      "low_stock_count": 5,
      "total_stock_value_rp": 125000000,
      "last_opname_accuracy": 97.2,
      "last_opname_date": "2026-04-20T18:00:00Z"
    },
    "users_assigned": [
      { "id": 2, "name": "Warehouse Manager", "role": "manager" },
      { "id": 5, "name": "Staff A", "role": "staff" }
    ]
  }
}
```

### POST `/locations/create`
**Description**: Create new location  
**Auth**: Required (Admin)  
**Body**:
```typescript
{
  name: "Ikki Coffee - Bali",
  type: "outlet",
  address: "Jl. Raya Ubud, Bali",
  phone: "0361-123456",
  manager_id: 5
}
```
**Response**: 201 Created with new location data

### PUT `/locations/:id`
**Description**: Update location  
**Auth**: Required (Admin or Manager of location)  
**Body** (all optional):
```typescript
{
  name?: "Ikki Coffee - Ubud",
  address?: "New address",
  phone?: "0361-999999",
  manager_id?: 6,
  is_active?: false
}
```
**Response**: 200 OK with updated location

### GET `/locations/:id/stock-summary`
**Description**: Get detailed stock analysis for location  
**Auth**: Required (User assigned to location or Admin)  
**Response**:
```json
{
  "success": true,
  "data": {
    "location_id": 1,
    "location_name": "Gudang Utama",
    "total_materials": 47,
    "materials": [
      {
        "material_id": 5,
        "name": "Espresso Beans",
        "current_stock": 12,
        "min_stock": 50,
        "max_stock": 200,
        "status": "CRITICAL",
        "unit": "kg"
      }
    ],
    "low_stock_items": [...]
  }
}
```

### GET `/locations/:from/transfer-paths`
**Description**: Get valid transfer destination locations  
**Auth**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "from_location": "Gudang Utama",
    "valid_destinations": [
      { "id": 2, "name": "Ikki Coffee", "type": "outlet" },
      { "id": 3, "name": "Ikki Resto", "type": "outlet" },
      { "id": 5, "name": "Ikki Coffee - Kitchen", "type": "kitchen" }
    ]
  }
}
```

---

## 8. Integration Points

### Upstream Dependencies:
- **None** (Layer 0, no external dependencies)

### Downstream Dependencies:
- **Material** (Layer 1): Materials assigned to locations via MaterialLocation
- **IAM** (Layer 1): Users assigned to locations for access control
- **Inventory** (Layer 2): All stock movements scoped to locations
- **Sales** (Layer 2): Sales orders belong to specific outlet location
- **Dashboard** (Layer 3): Aggregations filtered by location

### Data Flow:
```
Location (Foundation)
  ├─ MaterialLocation (material at location)
  ├─ UserAssignment (user at location with role)
  └─ All transactions scoped to location
       ├─ StockMovement (from/to locations)
       ├─ StockOpname (per location)
       ├─ SalesOrder (at location)
       └─ Dashboard (filtered by location)
```

---

## 9. Implementation Notes

### Caching Strategy
```typescript
// Cache locations (rarely change)
const LOCATION_CACHE_KEYS = {
  LIST: 'location.list',
  DETAIL: (id: number) => `location.detail.${id}`,
  TREE: 'location.tree', // For dropdown in UI
  BY_TYPE: (type: string) => `location.type.${type}`,
}

// Cache TTL: 1 hour (low volatility)
// Invalidate on: create, update, deactivate
```

### LBAC Implementation Pattern
```typescript
// In router/service, get user context:
const userLocations = await getUserAssignedLocations(auth.userId)

// Filter queries by location:
const result = await repo.getList({
  ...filter,
  location_ids: userLocations  // Auto-scoped
})

// Or explicit check:
if (!userLocations.includes(locationId)) {
  throw new ForbiddenError('Not authorized for this location')
}
```

### Performance Considerations
- Typically 3-10 locations (small dataset)
- Index on `type` for filtering (warehouse vs. outlets)
- Location list cached for UI dropdowns
- All user queries auto-filtered by location

---

## 10. Future Enhancements (Phase 2+)

- **Nested Locations**: Support zone/section/aisle breakdown in warehouse
- **Location Groups**: Group locations for bulk reporting
- **Transfer Scheduling**: Pre-schedule recurring transfers (e.g., daily 3pm)
- **Location Capabilities**: Define what operations each location supports
- **Territory Management**: Sales rep territory assignments per location

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: None (Layer 0)  
**Estimated Implementation**: 6-8 hours

