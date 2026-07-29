# PRD: Master Data

Specifications for Product, Material, Recipe, UoM, Supplier, Customer, and Sales Type.

## Product

### Purpose

Catalog of sellable items — what the business offers to customers.

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| sku | string | Unique stock-keeping unit |
| name | string | Product name |
| description | string? | Optional description |
| categoryId | FK? | Product category |
| basePrice | decimal | Default selling price |
| status | enum | `active`, `inactive`, `archived` |
| hasVariants | boolean | Whether product has size/flavor variants |
| hasSalesTypePricing | boolean | Different prices per sales channel |
| locationId | FK | Location this product belongs to |

### Key features

- Product categories (hierarchical: Food > Main Course > Nasi Goreng).
- Variants: size, flavor, temperature (each with own SKU and price).
- Sales-type pricing: different price for dine-in vs GoFood vs grab.
- Product can exist per-location (different locations can have different menus).

### Business rules

- SKU is unique within a location.
- Archived products cannot be sold but appear in historical reports.
- Price changes take effect immediately (no future-dated pricing in v1).

## Material (Raw Material / Bahan Baku)

### Purpose

Inventory items consumed in production — not sold directly.

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| code | string | Unique material code |
| name | string | Material name |
| categoryId | FK? | Material category |
| uomId | FK | Default unit of measure |
| minStock | decimal? | Reorder point (per location) |
| maxStock | decimal? | Maximum stock level |
| costMethod | enum | `weighted_average`, `fifo` |

### Key features

- Stock tracked per location.
- Automatic reorder alerts when stock < minStock.
- Cost calculation: weighted average (default) or FIFO.
- Material can be linked to multiple suppliers with different prices.

## Recipe (Bill of Materials)

### Purpose

Define how materials are combined to produce a product — enables COGS calculation.

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| productId | FK | Output product |
| name | string | Recipe name (a product can have multiple recipes) |
| yieldQty | decimal | How many units this recipe produces |
| isDefault | boolean | Default recipe for this product |

### Recipe lines

| Field | Type | Description |
| ----- | ---- | ----------- |
| materialId | FK | Input material |
| quantity | decimal | Amount consumed per batch |
| uomId | FK | Unit of the quantity |
| wastagePercent | decimal | Expected waste (0–100%) |

### Key features

- One product can have multiple recipes (seasonal, experimental).
- Theoretical COGS = sum(material cost × quantity × (1 + wastage%)) / yieldQty.
- Recipe versioning: mark old recipes inactive, create new ones.

### Business rules

- A recipe must have at least one material line.
- Yield must be > 0.
- Default recipe is used for automatic COGS calculation.

## Unit of Measure (UoM)

### Purpose

Standardize measurement units across the system.

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| code | string | Short code (kg, pcs, ml, L) |
| name | string | Full name (Kilogram, Pieces) |
| isSystem | boolean | System-defined (cannot delete) |

### Key features

- UoM conversion: 1 kg = 1000 g, 1 L = 1000 ml.
- Used in materials, recipe lines, and inventory transactions.

## Supplier

### Purpose

Manage vendor/supplier data for purchasing.

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| code | string | Unique supplier code |
| name | string | Supplier name |
| email | string? | Contact email |
| phone | string? | Contact phone |
| address | string? | Address |
| taxId | string? | Supplier tax ID |
| paymentTerms | integer? | Default payment term (days) |

### Key features

- Supplier-material price list (each material can have multiple supplier options).
- Track supplier performance (delivery time, quality — future).
- Soft-delete to preserve purchase history.

## Customer (CRM)

### Purpose

Track customer data and loyalty programs.

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| code | string | Unique customer code |
| name | string | Customer name |
| phone | string? | Phone (primary identifier for loyalty) |
| email | string? | Email |
| tier | enum | `bronze`, `silver`, `gold`, `platinum` |
| pointsBalance | integer | Current loyalty points |

### Key features

- Loyalty points: earn on purchase, redeem for discounts.
- Tier progression based on total points earned.
- Customer lookup by phone at POS.

## Sales Type

### Purpose

Define sales channels with different pricing and behavior.

### Examples

| Code | Name | Use case |
| ---- | ---- | -------- |
| DINE | Dine In | In-store dining |
| TAKE | Takeaway | Counter pickup |
| GOFOOD | GoFood | Delivery via GoFood |
| GRAB | GrabFood | Delivery via Grab |

### Key features

- Products can have different prices per sales type.
- Sales reports filterable by sales type.
- System sales types (DINE, TAKE) cannot be deleted.

---

**Next:** [04-prd-operations.md](./04-prd-operations.md) — Operations modules.
