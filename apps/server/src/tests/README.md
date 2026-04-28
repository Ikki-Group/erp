# Test Structure for Ikki ERP

> **Philosophy:** Test behavior via HTTP layer, not implementation details. DTO validation is handled by the framework.

## 📁 Folder Structure

```
tests/
├── http/              # HTTP Integration Tests (80% of tests)
│   ├── material/
│   ├── location/
│   └── ...
├── flows/             # Business Flow Tests (cross-module)
│   └── material-lifecycle.test.ts
├── helpers/           # Test utilities
│   ├── index.ts      # Main exports
│   ├── db.ts         # Database lifecycle
│   ├── factory.ts    # Test data builders
│   ├── setup.ts      # Test hooks
│   ├── auth.ts       # Mock auth
│   ├── app.ts        # Test app builder
│   ├── http.ts       # HTTP utilities
│   ├── response.ts   # Response assertions
│   └── cache.ts      # Cache utilities
├── integration/       # Minimal integration tests
└── unit/              # Only for complex algorithms
```

## 🎯 Test Types

### 1. HTTP Tests (`tests/http/`)

Test endpoints with real database + mocked auth.

```typescript
// tests/http/location/location-master.test.ts
describe('POST /create', () => {
  it('creates a new location and returns id', async () => {
    const app = createLocationTestApp()

    const res = await app.handle(
      new Request('http://localhost/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'WH-001', ... }),
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expectSuccessResponse(body)
  })
})
```

### 2. Flow Tests (`tests/flows/`)

Test complete business flows across operations.

```typescript
// tests/flows/material-lifecycle.test.ts
describe('Material Lifecycle Flow', () => {
  it('complete flow: create → verify in list → update → verify changes', async () => {
    // Step 1: Create material
    // Step 2: Verify in list
    // Step 3: Update
    // Step 4: Verify changes persisted
  })
})
```

## 🔧 Helpers

### Factory - Test Data Builders

```typescript
import { Factory } from '@/tests/helpers'

// Create dependencies automatically
const material = await Factory.material({
  sku: 'MAT-001',
  name: 'Test Material',
})

// Or provide specific IDs
const material = await Factory.material({
  sku: 'MAT-001',
  categoryId: existingCategory.id,
  baseUomId: existingUom.id,
})
```

### Setup - Test Lifecycle

```typescript
import { setupIntegrationTests } from '@/tests/helpers'

setupIntegrationTests() // Sets up DB + cache cleanup
```

### Assertions

```typescript
import {
  expectSuccessResponse,
  expectPaginatedResponse,
  expectValidationError,
} from '@/tests/helpers'

const body = await res.json()
expectSuccessResponse(body) // { success: true, code: string, data: T }
expectPaginatedResponse(body) // + meta: { total, page, limit, totalPages }
```

## ❌ What NOT to Test

| Don't Test | Reason |
|------------|--------|
| DTO `.safeParse()` | Framework handles validation |
| Service layer in isolation | Test via HTTP instead |
| Repository methods directly | Covered by HTTP tests |
| Simple getters/setters | No business logic |

## ✅ Migration Checklist

- [ ] New features: Write HTTP test in `tests/http/{module}/`
- [ ] Cross-module flows: Write in `tests/flows/`
- [ ] Use `Factory.*` for test data
- [ ] Call `setupIntegrationTests()` at top of file
- [ ] Remove DTO tests from existing files
