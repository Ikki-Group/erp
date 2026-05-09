# Payment Module Database Schema

## Overview

The Payment Module provides a comprehensive system for managing payment providers, payment methods, and location-specific payment method settings. The design follows the business rule that only store locations can have payment methods configured.

A payment method can be **global** (`is_global = true`) — automatically available to all store locations — or **location-specific** (`is_global = false`) — explicitly mapped to individual stores via the junction table.

## Database Schema

### 1. Payment Providers (`payment_providers`)

Master data for payment providers (e.g., BCA, Mandiri).

**Fields:**

- `id`: Primary key (serial integer)
- `code`: Unique provider code (e.g., 'BCA', 'MANDIRI')
- `name`: Provider display name
- `description`: Provider description
- `website_url`: Provider website URL
- `is_active`: Whether this provider is active
- `is_system`: Whether this is a system default provider
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`

**Indexes:**

- `payment_providers_code_idx` on `code`
- `payment_providers_is_active_idx` on `is_active`

### 2. Payment Methods (`payment_methods`)

Master data for payment methods with cash/cashless flags and global availability.

**Fields:**

- `id`: Primary key (serial integer)
- `type`: Payment method type (enum: 'cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet')
- `category`: Cash vs cashless flag (enum: 'cash', 'cashless')
- `name`: Display name for the payment method
- `is_enabled`: Whether this payment method is enabled
- `is_default`: Whether this is the default payment method
- `is_global`: Whether this payment method is available to all stores automatically
- `payment_provider_id`: Reference to payment provider (optional, integer)
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`

**Indexes:**

- `payment_methods_type_idx` on `type`
- `payment_methods_category_idx` on `category`
- `payment_methods_is_enabled_idx` on `is_enabled`
- `payment_methods_is_global_idx` on `is_global`
- `payment_methods_payment_provider_id_idx` on `payment_provider_id`

### 3. Location Payment Methods (`location_payment_methods`)

Junction table that maps which payment methods are active for specific locations. Stores location-specific credentials and configurations.

**Fields:**

- `id`: Primary key (serial integer)
- `location_id`: Reference to the location (CASCADE delete, integer)
- `payment_method_id`: Reference to the payment method (CASCADE delete, integer)
- `payment_provider_id`: Reference to the payment provider (SET NULL on delete, integer)
- `is_enabled`: Whether this payment method is enabled for this location
- `is_default`: Whether this is the default payment method for this location
- `credentials`: Provider-specific credentials (JSONB):
  - `merchant_id`: Merchant ID
  - `api_key`: API key
  - `account_number`: Account number
  - `terminal_id`: Terminal ID
- `config`: Additional configuration (JSONB):
  - `min_amount`: Minimum transaction amount
  - `max_amount`: Maximum transaction amount
  - `fee_percentage`: Fee percentage
  - `fixed_fee`: Fixed fee amount
- `enabled_at`: When this payment method was enabled for this location
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`

**Indexes:**

- `location_payment_methods_location_id_idx` on `location_id`
- `location_payment_methods_payment_method_id_idx` on `payment_method_id`
- `location_payment_methods_payment_provider_id_idx` on `payment_provider_id`
- `location_payment_methods_is_enabled_idx` on `is_enabled`

## Business Rule Enforcement

### Only Store Locations Can Have Payment Methods

The system enforces the constraint that only locations with `type = 'store'` can have payment methods configured. This validation is implemented in the `LocationPaymentMethodRepo.create()` method:

```typescript
// Validate location exists and is a store
const location = await this.db
	.select()
	.from(locationsTable)
	.where(eq(locationsTable.id, data.locationId))
if (location.length === 0) {
	throw new NotFoundError(`Location with ID ${data.locationId} not found`, 'LOCATION_NOT_FOUND')
}
if (location[0].type !== 'store') {
	throw new BadRequestError(
		'Payment methods can only be configured for store locations',
		'INVALID_LOCATION_TYPE',
	)
}
```

### Default Payment Method Handling

When setting a payment method as default for a location, the system automatically unsets other default payment methods for that location:

```typescript
// If setting as default, unset other defaults for this location
if (data.isDefault) {
	await this.db
		.update(locationPaymentMethodsTable)
		.set({ isDefault: false })
		.where(
			and(
				eq(locationPaymentMethodsTable.locationId, data.locationId),
				eq(locationPaymentMethodsTable.isDefault, true),
			),
		)
}
```

## API Endpoints

### Payment Provider Module

- `GET /payment/payment-provider/list` - List payment providers with pagination
- `GET /payment/payment-provider/detail` - Get payment provider by ID
- `POST /payment/payment-provider/create` - Create new payment provider
- `PUT /payment/payment-provider/update` - Update payment provider
- `DELETE /payment/payment-provider/remove` - Delete payment provider

### Payment Method Module

- `GET /payment/method/list` - List payment methods with pagination
- `GET /payment/method/detail` - Get payment method by ID
- `GET /payment/method/enabled` - List all enabled payment methods
- `GET /payment/method/global` - List all global payment methods
- `POST /payment/method/create` - Create new payment method
- `PUT /payment/method/update` - Update payment method
- `DELETE /payment/method/remove` - Delete payment method
- `POST /payment/method/seed` - Seed default payment methods

### Location Payment Method Module

- `GET /payment/location-payment-method/list` - List location payment methods with pagination
- `GET /payment/location-payment-method/detail` - Get location payment method by ID
- `GET /payment/location-payment-method/by-location` - Get all payment methods for a location
- `POST /payment/location-payment-method/create` - Create new location payment method
- `PUT /payment/location-payment-method/update` - Update location payment method
- `DELETE /payment/location-payment-method/remove` - Delete location payment method

## Usage Example

### 1. Create a Payment Provider

```typescript
POST /payment/payment-provider/create
{
  "code": "BCA",
  "name": "Bank Central Asia",
  "description": "Indonesian bank",
  "websiteUrl": "https://www.bca.co.id",
  "isActive": true,
  "isSystem": false
}
```

### 2. Create a Payment Method

```typescript
POST /payment/payment-method/create
{
  "type": "e_wallet",
  "category": "cashless",
  "name": "QRIS BCA",
  "isEnabled": true,
  "isDefault": false,
  "isGlobal": true,
  "paymentProviderId": 1
}
```

### 3. Configure Payment Method for a Location

```typescript
POST /payment/location-payment-method/create
{
  "locationId": 1,
  "paymentMethodId": 2,
  "paymentProviderId": 1,
  "isEnabled": true,
  "isDefault": true,
  "credentials": {
    "accountNumber": "1234567890",
    "merchantId": "MERCHANT001"
  },
  "config": {
    "minAmount": 10000,
    "maxAmount": 10000000,
    "feePercentage": 0.5,
    "fixedFee": 5000
  }
}
```

### 4. Get Payment Methods for a Location

```typescript
GET /payment/location-payment-method/by-location?locationId=1
```

### 5. Get Global Payment Methods

```typescript
GET / payment / payment - method / global
```

## Relations

```
locationsTable (1) ----< (N) locationPaymentMethodsTable
paymentMethodsTable (1) ----< (N) locationPaymentMethodsTable
paymentProvidersTable (1) ----< (N) paymentMethodsTable
paymentProvidersTable (1) ----< (N) locationPaymentMethodsTable
```

## Security Considerations

1. **Credentials Storage**: Payment method credentials are stored as JSONB in the database. In production, consider encrypting sensitive fields.

2. **System Protection**: System providers and payment methods are protected from modification/deletion.

3. **Location Type Validation**: Only store locations can have payment methods configured.

4. **Audit Trail**: All changes are tracked with audit columns.

## Future Enhancements

1. Add encryption for sensitive credential fields
2. Add webhook integration for payment providers
3. Add transaction fee calculation based on configuration
4. Add payment method availability based on time/location
5. Add multi-currency support
