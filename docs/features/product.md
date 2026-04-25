# Product Master Data

**Layer**: 0 (Core) | **Status**: MVP | **Priority**: Critical | **Estimate**: 12 hours

---

## 1. Overview

Products are the menu items UMKM sells: cappuccino, iced latte, croissant, sandwich. Product module stores name, price, category, cost, availability. All POS sales pull from product master, all financial reports roll up product profit margins.

---

## 2. Core Objectives

- **Menu Management**: Define all menu items (name, description, price, category)
- **Location-Specific Pricing**: Same cappuccino $3.50 in Ikki Coffee but $3.80 in Ikki Resto (premium location)
- **Cost Tracking**: Link products to recipes so system knows cost per item (for margin calculation)
- **Product Categories**: Organize menu (Beverages, Food, Pastry, Dessert) for reporting
- **Availability Control**: Enable/disable products (seasonal items, out of stock items)
- **SKU/Barcode**: Optional barcode for scanning (future enhancement)

---

## 3. Use Cases & Workflows

### UC-001: Create Menu Item (New product added)

**Who**: Manager / Owner  
**When**: New menu item (seasonal drink)  
**Goal**: Add cappuccino to system

**Steps**:
1. Manager opens "Create Product"
2. Enters:
   - Name: "Cappuccino"
   - Category: "Beverages"
   - Description: "Double espresso, steamed milk"
   - SKU: "BEV-001" (optional)
3. Sets pricing:
   - Base price: $3.50 (default for all locations)
4. Enables: "Available" (checkbox)
5. Links to Recipe: "Cappuccino v1" (if available)
6. Saves → Product live in POS immediately

**Why it matters**: 
- Menu live in all outlets at once
- Price consistency (same drink, same price)
- Recipe linked = COGS automatic
- POS staff can search/ring up item

---

### UC-002: Override Location Price (Premium pricing)

**Who**: Manager  
**When**: Premium outlet charges more  
**Goal**: Cappuccino $3.50 in coffee shop, $3.80 in premium mall location

**Steps**:
1. Product "Cappuccino" has default price $3.50
2. Manager goes to "Ikki Resto" location settings
3. Creates price override: "Cappuccino = $3.80"
4. In POS at Ikki Resto: Cappuccino rings up $3.80
5. In POS at Ikki Coffee: Still $3.50 (default)
6. Reports show correct profit (each location's margin)

**Why it matters**: 
- Pricing flexibility (premium vs. budget outlets)
- Margins accurate (each location's P&L correct)
- No manual adjustment needed in POS

---

### UC-003: Manage Product Availability (Seasonal)

**Who**: Manager  
**When**: Seasonal item or stock shortage  
**Goal**: Hide product from POS temporarily

**Steps**:
1. Manager disables: "Iced Coffee" (summer ended, too cold)
2. Product disappears from POS search
3. Staff can't ring it up (accidental sales prevented)
4. When summer returns: Manager re-enables it
5. Customers see "Iced Coffee - Seasonal, available June-August"

**Why it matters**: 
- Prevent accidental sales of unavailable items
- Clear for staff (don't ask customer "sorry we don't have it")
- Availability tracked in reporting

---

## 4. Recommended Enhancements (Phase 2+)

- **Product Images**: Upload photo of menu item
  - Priority: Nice-to-have (visual menu)
  - Why: POS display, customer appeal, training
  - Estimate: 6 hours

- **Barcode/QR Scanning**: Print barcodes, scan to ring up
  - Priority: Nice-to-have (speed in POS)
  - Why: Faster checkout than searching
  - Estimate: 8 hours

- **Product Variants**: Cappuccino with "small/medium/large" sizes, "sugar level"
  - Priority: Nice-to-have (complex menu)
  - Why: Coffee shops have many variations
  - Estimate: 16 hours

- **Allergen/Dietary Tags**: Mark products "vegetarian", "gluten-free", "dairy-free"
  - Priority: Nice-to-have (customer safety)
  - Why: Meet customer dietary needs
  - Estimate: 4 hours

- **Product Promotions**: Create bundle deals (Cappuccino + Croissant)
  - Priority: Nice-to-have (revenue driver)
  - Why: Increase basket size
  - Estimate: 12 hours
