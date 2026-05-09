# Sales Order Creation - Integrated Endpoint Example

This document provides a comprehensive example of the sales order creation endpoint with full integration to related modules.

## Overview

The sales order creation endpoint (`POST /sales/order/create`) is now fully integrated with:

- **Location Module** - Validates location exists
- **CRM Module** - Validates customer (if provided)
- **Product Module** - Validates products and variants (if provided)
- **Sales Type Module** - Uses sales type for categorization

## Endpoint Details

### URL

```
POST /sales/order/create
```

### Authentication

Required (uses authPluginMacro)

### Request Body

```typescript
{
  "locationId": number,           // Required - validated against location module
  "customerId": number | null,    // Optional - validated against CRM module if provided
  "salesTypeId": number,          // Required - validated against sales-type module
  "status": "open" | "closed" | "void",  // Default: "open"
  "transactionDate": string,     // ISO date string, default: current date
  "totalAmount": string,          // Decimal string
  "discountAmount": string,       // Decimal string, default: "0"
  "taxAmount": string,            // Decimal string, default: "0"
  "gratuityAmount": string,       // Decimal string, default: "0"
  "refundAmount": string,         // Decimal string, default: "0"
  "items": Array<{
    "batchId": number | null,      // Optional - for batch ordering
    "productId": number | null,   // Optional - validated against product module if provided
    "variantId": number | null,   // Optional - for product variants
    "itemName": string,           // Required - always stored (even if product deleted later)
    "quantity": string,           // Decimal string, must be > 0
    "unitPrice": string,         // Decimal string, must be >= 0
    "discountAmount": string,     // Decimal string, default: "0"
    "taxAmount": string,          // Decimal string, default: "0"
    "subtotal": string            // Decimal string
  }> | undefined
}
```

### Response

```typescript
{
  "success": true,
  "data": {
    "id": number  // Created sales order ID
  }
}
```

## Integration Flow

### 1. Validation Phase (Service Layer)

The `SalesOrderService.validateRelatedEntities()` method validates:

```typescript
// Location validation
const location = await deps.location.master.getById(data.locationId)
if (!location) {
	throw NotFoundError('LOCATION_NOT_FOUND')
}

// Customer validation (if provided)
if (data.customerId) {
	const customer = await deps.crm.customer.getById(data.customerId)
	if (!customer) {
		throw NotFoundError('CUSTOMER_NOT_FOUND')
	}
}

// Product validation (if items provided)
if (data.items) {
	for (const item of data.items) {
		if (item.productId) {
			const product = await deps.product.product.getById(item.productId)
			if (!product) {
				throw NotFoundError('PRODUCT_NOT_FOUND')
			}
		}
	}
}
```

### 2. Database Transaction (Repository Layer)

The `SalesOrderRepo.create()` method:

- Creates the sales order record
- Creates associated sales order items (if provided)
- All within a single transaction for data consistency

### 3. Cache Invalidation

After successful creation:

```typescript
await cache.deleteMany({ keys: ['list', 'count'] })
```

## Example Request

### Scenario: Creating a POS Sales Order with Products

```bash
curl -X POST http://localhost:3000/sales/order/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "locationId": 1,
    "customerId": 5,
    "salesTypeId": 1,
    "status": "open",
    "transactionDate": "2026-05-08T00:00:00.000Z",
    "totalAmount": "150.00",
    "discountAmount": "0",
    "taxAmount": "15.00",
    "gratuityAmount": "0",
    "refundAmount": "0",
    "items": [
      {
        "productId": 10,
        "variantId": 25,
        "itemName": "Coffee (Large)",
        "quantity": "2",
        "unitPrice": "25.00",
        "discountAmount": "0",
        "taxAmount": "2.50",
        "subtotal": "50.00"
      },
      {
        "productId": 15,
        "variantId": null,
        "itemName": "Sandwich",
        "quantity": "1",
        "unitPrice": "85.00",
        "discountAmount": "0",
        "taxAmount": "8.50",
        "subtotal": "85.00"
      }
    ]
  }'
```

### Response

```json
{
	"success": true,
	"data": {
		"id": 12345
	}
}
```

## Example Request: Custom Item (No Product Reference)

### Scenario: Manual Charge or Special Request

```bash
curl -X POST http://localhost:3000/sales/order/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "locationId": 1,
    "customerId": null,
    "salesTypeId": 2,
    "status": "open",
    "transactionDate": "2026-05-08T00:00:00.000Z",
    "totalAmount": "50.00",
    "discountAmount": "0",
    "taxAmount": "5.00",
    "gratuityAmount": "0",
    "refundAmount": "0",
    "items": [
      {
        "productId": null,
        "variantId": null,
        "itemName": "Special Service Fee",
        "quantity": "1",
        "unitPrice": "50.00",
        "discountAmount": "0",
        "taxAmount": "5.00",
        "subtotal": "50.00"
      }
    ]
  }'
```

## Error Handling

### Location Not Found

```json
{
	"success": false,
	"error": {
		"code": "LOCATION_NOT_FOUND",
		"message": "Location with ID 999 not found"
	}
}
```

### Customer Not Found

```json
{
	"success": false,
	"error": {
		"code": "CUSTOMER_NOT_FOUND",
		"message": "Customer with ID 999 not found"
	}
}
```

### Product Not Found

```json
{
	"success": false,
	"error": {
		"code": "PRODUCT_NOT_FOUND",
		"message": "Product with ID 999 not found"
	}
}
```

## Module Dependencies

### Sales Module (apps/server/src/modules/sales/index.ts)

```typescript
interface SalesServiceModuleDeps {
	location: LocationServiceModule
	crm: CrmServiceModule
	product: ProductServiceModule
}

export class SalesServiceModule {
	constructor(
		db: DbClient,
		cacheClient: CacheClient,
		private readonly deps: SalesServiceModuleDeps,
	) {
		const salesOrderRepo = new SalesOrderRepo(db)
		this.order = new SalesOrderService(salesOrderRepo, cacheClient, deps)
		// ...
	}
}
```

### Registry Initialization (apps/server/src/modules/\_registry.ts)

```typescript
// Layer 2 — Operations
const sales = new SalesServiceModule(db, cacheClient, { location, crm, product })
```

## Testing the Integration

### 1. Ensure Required Entities Exist

```sql
-- Check location exists
SELECT * FROM location_masters WHERE id = 1;

-- Check customer exists (if using customer)
SELECT * FROM customers WHERE id = 5;

-- Check sales type exists
SELECT * FROM sales_types WHERE id = 1;

-- Check products exist (if using products)
SELECT * FROM products WHERE id IN (10, 15);
```

### 2. Test with Valid Data

Use the example requests above to test the endpoint.

### 3. Test Validation Errors

Try with invalid IDs to ensure proper error messages:

- Non-existent locationId
- Non-existent customerId
- Non-existent productId

## Related Endpoints

### Add Batch to Existing Order

```
POST /sales/order/add-batch?orderId=12345
```

### Close Order

```
POST /sales/order/close?orderId=12345
```

### Void Order

```
POST /sales/order/void?orderId=12345
```

### List Orders

```
GET /sales/order/list?locationId=1&status=open&page=1&limit=20
```

### Get Order Detail

```
GET /sales/order/detail?id=12345
```

## Key Design Decisions

### 1. Immutable Sales History

- `itemName`, `unitPrice`, `taxAmount`, `discountAmount` are always stored
- Sales history never depends on product master records
- Even if product is deleted or modified, sales data remains accurate

### 2. Optional Product References

- `productId` and `variantId` are nullable
- Supports custom items, manual charges, special requests
- Flexible for both POS and external ingestion scenarios

### 3. Validation Before Transaction

- All related entities validated before database transaction
- Prevents partial data insertion
- Provides clear error messages for debugging

### 4. Cache Invalidation

- List and count cache cleared after creation
- Ensures queries return fresh data
- Follows cache-first strategy for reads

## Future Enhancements

### 1. Inventory Integration

When inventory module is ready:

- Validate stock availability
- Auto-deduct inventory on order close
- Restore inventory on void

### 2. Finance Integration

When finance module is ready:

- Auto-post to general ledger on order close
- Create accounting entries
- Handle tax accounting

### 3. Customer Loyalty

When CRM loyalty is ready:

- Auto-add loyalty points
- Track customer visit history
- Apply loyalty discounts

### 4. Payment Integration

When payment module is ready:

- Link payment to order
- Support multiple payment methods
- Handle payment status
