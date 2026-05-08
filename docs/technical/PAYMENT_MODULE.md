# Payment Module Database Schema

## Overview

The Payment Module provides a comprehensive system for managing payment providers, payment method configurations, and location-specific payment method settings. The design follows the business rule that only store locations can have payment methods configured.

## Database Schema

### 1. Payment Providers (`payment_providers`)

Master data for payment providers (e.g., BCA, BNI, Mandiri, GoPay, OVO).

**Fields:**
- `id`: Primary key (UUID)
- `code`: Unique provider code (e.g., 'BCA', 'BNI', 'GOPAY')
- `name`: Provider display name
- `description`: Provider description
- `website_url`: Provider website URL
- `is_active`: Whether this provider is active
- `is_system`: Whether this is a system default provider
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`

**Indexes:**
- `payment_providers_code_idx` on `code`
- `payment_providers_is_active_idx` on `is_active`

### 2. Payment Method Configs (`payment_method_configs`)

Global configuration for payment methods with cash/cashless flags.

**Fields:**
- `id`: Primary key (UUID)
- `type`: Payment method type (enum: 'cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet')
- `category`: Cash vs cashless flag (enum: 'cash', 'cashless')
- `name`: Display name for the payment method
- `is_enabled`: Whether this payment method is enabled
- `is_default`: Whether this is the default payment method
- `payment_provider_id`: Reference to payment provider (optional)
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`

**Indexes:**
- `payment_method_configs_type_idx` on `type`
- `payment_method_configs_category_idx` on `category`
- `payment_method_configs_is_enabled_idx` on `is_enabled`
- `payment_method_configs_payment_provider_id_idx` on `payment_provider_id`

### 3. Location Payment Methods (`location_payment_methods`)

Junction table that maps which payment methods are active for specific locations. Stores location-specific credentials and configurations.

**Fields:**
- `id`: Primary key (UUID)
- `location_id`: Reference to the location (CASCADE delete)
- `payment_method_config_id`: Reference to the payment method configuration (CASCADE delete)
- `payment_provider_id`: Reference to the payment provider (SET NULL on delete)
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
- `location_payment_methods_payment_method_config_id_idx` on `payment_method_config_id`
- `location_payment_methods_payment_provider_id_idx` on `payment_provider_id`
- `location_payment_methods_is_enabled_idx` on `is_enabled`

## Business Rule Enforcement

### Only Store Locations Can Have Payment Methods

The system enforces the constraint that only locations with `type = 'store'` can have payment methods configured. This validation is implemented in the `LocationPaymentMethodRepo.create()` method:

```typescript
// Validate location exists and is a store
const location = await this.db.select().from(locationsTable).where(eq(locationsTable.id, data.locationId))
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

### 2. Create a Payment Method Config

```typescript
POST /payment/payment-method/create
{
  "type": "bank_transfer",
  "category": "cashless",
  "name": "BCA Transfer",
  "isEnabled": true,
  "isDefault": false,
  "paymentProviderId": "<provider-id>"
}
```

### 3. Configure Payment Method for a Location

```typescript
POST /payment/location-payment-method/create
{
  "locationId": "<store-location-id>",
  "paymentMethodConfigId": "<payment-method-config-id>",
  "paymentProviderId": "<provider-id>",
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
GET /payment/location-payment-method/by-location?locationId=<store-location-id>
```

## Relations

```
locationsTable (1) ----< (N) locationPaymentMethodsTable
paymentMethodConfigsTable (1) ----< (N) locationPaymentMethodsTable
paymentProvidersTable (1) ----< (N) paymentMethodConfigsTable
paymentProvidersTable (1) ----< (N) locationPaymentMethodsTable
```

## Security Considerations

1. **Credentials Storage**: Payment method credentials are stored as JSONB in the database. In production, consider encrypting sensitive fields.

2. **System Protection**: System providers and payment method configs are protected from modification/deletion.

3. **Location Type Validation**: Only store locations can have payment methods configured.

4. **Audit Trail**: All changes are tracked with audit columns.

## Future Enhancements

1. Add encryption for sensitive credential fields
2. Add webhook integration for payment providers
3. Add transaction fee calculation based on configuration
4. Add payment method availability based on time/location
5. Add multi-currency support
