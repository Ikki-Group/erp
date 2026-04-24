# Product Data Management

**Layer**: 0 (Core System - No Dependencies)  
**Status**: MVP - Foundational module  
**Complexity**: Low (CRUD + categorization)

---

## 1. Overview

The Product module is the foundational master data for all sellable items in the ERP. Products represent menu items sold to customers via POS or direct sales orders.

**Key Distinction**: 
- **Product** (Layer 0): What customers buy (e.g., "Iced Latte" - menu item)
- **Material** (Layer 1): What suppliers deliver (e.g., "Fresh Milk", "Cup") - purchased inventory

Products are used by:
- **Recipes** (maps products to materials: 1 Iced Latte = 18g espresso + 150ml milk)
- **Sales Orders** (customers order products)
- **Dashboard** (revenue reporting by product)
- **Moka POS** (product sync for point-of-sale)

---

## 2. Core Objectives

- **Centralized Menu Catalog**: Single source of truth for all menu items across all outlets
- **POS Integration Foundation**: Map internal products to external Moka POS SKUs
- **Sales Analytics**: Enable reporting by product, category, profitability
- **Recipe Linking**: Associate products with ingredient recipes for COGS calculation
- **Category Organization**: Structure menu for dashboard reporting and operational clarity

---

## 3. Key Entities & Relationships

```
Product (Core)
├─ name: "Iced Latte"
├─ sku: "PROD-001" (unique identifier)
├─ category_id: FK → Category
├─ type: "finished_good"
├─ selling_price: 5.00
├─ cost_price: 2.20 (from recipe)
└─ moka_sku: "LATTE-COLD" (POS mapping)

Category (Hierarchical)
├─ Coffee
│  ├─ Hot Coffee
│  └─ Cold Coffee
├─ Non-Coffee
│  ├─ Tea
│  └─ Juice
└─ Food
   ├─ Pastry
   └─ Sandwich

Relationships:
- Product → Category (many-to-one)
- Product → Recipe (one-to-one) [via Recipe.product_id]
- Product → SalesOrder (one-to-many) [via SalesOrderLine]
```

---

## 4. Use Cases & Workflows

### UC-001: Create New Menu Item (Barista adds new drink recipe)

**Actors**: Manager, Barista  
**Precondition**: Recipe ingredients already defined as Materials

**Steps**:
1. Manager opens Product creation form
2. Enters: Name ("New Cold Brew"), SKU ("PROD-045"), Category ("Cold Coffee")
3. Sets: Selling Price ($6.50), Status (Active)
4. (Optional) Maps Moka SKU if syncing to POS
5. System generates: cost_price TBD (will be calculated from recipe)
6. Creates Product record
7. Barista creates Recipe for this product (links ingredients)
8. Recipe auto-calculates cost_price: $3.00
9. Product now ready for sales

**Business Rules**:
- SKU must be unique globally
- Category must exist first
- Selling price ≥ cost price recommended (profit margin check)
- Category hierarchy prevents duplicate nested categories

**Error Scenarios**:
- SKU already exists → ConflictError "SKU_EXISTS"
- Category not found → NotFoundError
- Invalid price (negative) → BadRequestError

---

### UC-002: Update Product Price (Seasonal adjustment)

**Actors**: Manager  
**Precondition**: Product exists with current price

**Steps**:
1. Manager searches for product: "Iced Latte"
2. Finds product with current selling_price: $5.00
3. Changes price to: $5.50
4. System calculates new margin: (5.50 - 2.20) / 5.50 = 60%
5. Saves updated product
6. Invalidates product cache (Dashboard will refresh)
7. Historical price tracking (optional Phase 2)

**Business Rules**:
- Price updates don't affect historical sales (COGS locked at sale time)
- Can update price anytime (no approval needed for MVP)
- Margin display helps manager validate reasonableness

**Error Scenarios**:
- Negative price → BadRequestError
- Product not found → NotFoundError

---

### UC-003: Categorize Products for Dashboard

**Actors**: Manager  
**Precondition**: Categories defined (Coffee, Non-Coffee, Food)

**Steps**:
1. System auto-groups all products by category
2. Dashboard shows revenue breakdown: Coffee $8,400 (52%), Non-Coffee $5,200 (32%), Food $2,600 (16%)
3. Manager clicks "Coffee" to drill down
4. Shows sub-categories: Hot ($3,200), Cold ($5,200)
5. Can drill down further to individual products

**Business Rules**:
- Only active products counted
- Revenue calculated from ShippedSalesOrderLines (COGS excluded)
- Categories are read-only in MVP (admin defines)

---

### UC-004: Map Product to Moka POS (Integration preparation)

**Actors**: System Admin  
**Precondition**: Product exists, Moka SKUs known

**Steps**:
1. Admin opens product: "Iced Latte" (PROD-001)
2. Sees field: moka_sku (currently empty)
3. Maps to Moka: "LATTE-COLD"
4. On sync, if Moka sales received with SKU "LATTE-COLD", maps to PROD-001
5. Recipe auto-deducts ingredients

**Business Rules**:
- Many Ikki products might map to same Moka SKU (variants not yet separated)
- Unmapped products not synced from Moka (ignored)
- Moka SKU can be unique or shared (flexible mapping)

---

## 5. Data Model

### Product Table

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  type VARCHAR(50) CHECK (type IN ('finished_good', 'raw_material', 'packaging')),
  selling_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 4), -- Calculated from recipe
  moka_sku VARCHAR(50), -- Optional POS mapping
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
)

CREATE UNIQUE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_moka_sku ON products(moka_sku);
```

### Category Table

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES categories(id), -- Null for top-level
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Key Fields:

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `sku` | VARCHAR(50) | Unique identifier | PROD-001 |
| `name` | VARCHAR(255) | Display name | Iced Latte |
| `category_id` | INTEGER | Product classification | 5 (Coffee → Cold) |
| `type` | VARCHAR(50) | Product type classification | finished_good |
| `selling_price` | DECIMAL(10,2) | Menu price | 5.00 |
| `cost_price` | DECIMAL(10,4) | From recipe | 2.2000 |
| `moka_sku` | VARCHAR(50) | External POS identifier | LATTE-COLD |
| `is_active` | BOOLEAN | Soft-delete flag | true |

---

## 6. Business Rules & Validations

**Creation Rules**:
- SKU must be unique (case-insensitive)
- SKU format: alphanumeric + hyphen, 3-50 chars
- Category must exist
- Selling price must be > 0
- Name must be non-empty, < 255 chars

**Update Rules**:
- Cannot change SKU after creation (immutable)
- Can update: name, category, selling_price, status
- Changing category affects dashboard grouping
- Cost price is auto-calculated (read-only)

**Deletion Rules**:
- Products never hard-deleted
- Mark as `is_active = false` (soft-delete)
- Inactive products excluded from POS sync
- Inactive products excluded from sales order creation

**Cost Price Calculation**:
- `cost_price = Σ (recipe_component_qty × material_cost_price)`
- Recalculated when:
  - Recipe components changed
  - Material cost changed (via GRN)
  - Manual recalc trigger (admin)
- Snapshot preserved at sale time (for COGS)

---

## 7. API Endpoints & Routes

### GET `/products/list`
**Description**: List all products with pagination and filters  
**Auth**: Optional (public dashboard might need)  
**Query Params**:
```typescript
{
  page?: number (1-1000),
  limit?: number (1-100, default 20),
  search?: string (searches name, SKU),
  category_id?: number,
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
      "sku": "PROD-001",
      "name": "Iced Latte",
      "category_id": 5,
      "category_name": "Coffee - Cold",
      "selling_price": 5.00,
      "cost_price": 2.20,
      "margin_percent": 56,
      "is_active": true
    }
  ],
  "meta": { "total": 245, "page": 1, "limit": 20, "pages": 13 }
}
```

### GET `/products/:id`
**Description**: Get product detail  
**Auth**: Optional  
**Response**:
```json
{
  "success": true,
  "code": "OK",
  "data": {
    "id": 1,
    "sku": "PROD-001",
    "name": "Iced Latte",
    "category_id": 5,
    "category_name": "Coffee - Cold",
    "selling_price": 5.00,
    "cost_price": 2.20,
    "moka_sku": "LATTE-COLD",
    "is_active": true,
    "created_at": "2026-04-20T10:30:00Z",
    "created_by": 1,
    "recipe_id": 15,
    "recipe_components": 5,
    "sales_this_month": 342,
    "revenue_this_month": 1710.00
  }
}
```

### POST `/products/create`
**Description**: Create new product  
**Auth**: Required (Manager+)  
**Body**:
```typescript
{
  sku: "PROD-046",
  name: "Cold Brew",
  category_id: 5,
  selling_price: 6.50,
  moka_sku?: "BREW-COLD"
}
```
**Response**: 201 Created with new product data

### PUT `/products/:id`
**Description**: Update product  
**Auth**: Required (Manager+)  
**Body** (all optional):
```typescript
{
  name?: "New Name",
  category_id?: 6,
  selling_price?: 7.00,
  moka_sku?: "NEW-SKU",
  is_active?: false
}
```
**Response**: 200 OK with updated product

### DELETE `/products/:id`
**Description**: Soft-delete (mark inactive)  
**Auth**: Required (Admin)  
**Response**: 204 No Content

### GET `/categories/tree`
**Description**: Get category hierarchy  
**Auth**: Optional  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Coffee",
      "children": [
        {
          "id": 4,
          "name": "Hot Coffee",
          "product_count": 12
        },
        {
          "id": 5,
          "name": "Cold Coffee",
          "product_count": 18
        }
      ]
    }
  ]
}
```

---

## 8. Integration Points

### Upstream Dependencies:
- **None** (Layer 0, no external dependencies)

### Downstream Dependencies:
- **Recipe** (Layer 2): Maps products to materials via recipes
- **Sales** (Layer 2): Products are items in sales orders
- **Dashboard** (Layer 3): Products grouped by category for reporting
- **Moka POS** (Phase 2): Products synced to external POS system

### Data Flow:
```
Moka POS (External)
      ↓ [Import product catalog]
   Products (ERP)
      ↓ [Maps to Recipe]
   Recipe (connects to Materials)
      ↓ [Sales order contains products]
   SalesOrder (deducts materials via recipe)
      ↓ [Aggregates for reporting]
   Dashboard (shows revenue by product/category)
```

---

## 9. Implementation Notes

### Caching Strategy
```typescript
// Cache products list (changes infrequently)
const PRODUCT_CACHE_KEYS = {
  LIST: 'product.list',
  DETAIL: (id: number) => `product.detail.${id}`,
  BY_CATEGORY: (category_id: number) => `product.category.${category_id}`,
}

// Cache TTL: 1 hour (low volatility)
// Invalidate on: create, update, delete, category change
```

### Performance Considerations
- Products typically 100-300 items (small dataset)
- Index on `category_id` for filtering
- Index on `moka_sku` for POS sync lookup
- Pagination default 20/page for list

### Batch Operations
- Bulk update status (mark products active/inactive)
- Bulk import from Moka POS (create/update many)

---

## 10. Future Enhancements (Phase 2+)

- **Promotional Bundles**: Group products for combo pricing
- **Product Variants**: Size variations (Small/Medium/Large) with different recipes
- **Price History**: Track price changes over time
- **Sales Targets**: Set monthly sales volume targets by product
- **Expiration Management**: For time-limited products
- **Product Images**: Menu photos for POS display
- **Allergen Tracking**: Ingredient allergen metadata

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: None (Layer 0)  
**Estimated Implementation**: 8-12 hours

