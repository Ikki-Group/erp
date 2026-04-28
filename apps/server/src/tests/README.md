# Test Structure for Ikki ERP

> **Philosophy:** Test behavior via HTTP layer, not implementation details. DTO validation is handled by the framework.

## 📁 Folder Structure

```
tests/
├── http/              # HTTP Integration Tests (80% of tests)
│   ├── material/
│   ├── location/
│   ├── iam/
│   ├── finance/
│   └── ...
├── flows/             # Business Flow Tests (cross-module)
│   └── material-lifecycle.test.ts
├── helpers/           # Test utilities
│   ├── index.ts      # Main exports
│   ├── db.ts         # Database lifecycle
│   ├── factories/    # Test data builders
│   │   └── iam.ts   # IAM factories (user, role, session)
│   ├── setup.ts      # Test hooks
│   ├── auth.ts       # Mock auth
│   ├── session-manager.ts  # Session management for authenticated tests
│   ├── jwt.ts        # JWT token generation for tests
│   ├── app-builder.ts # Test app builders
│   └── ...
├── integration/       # Minimal integration tests
└── unit/              # Only for complex algorithms
```

## 🎯 Test Types

### 1. HTTP Tests (`tests/http/`)

Test endpoints with real database + real authentication.

#### Authentication Setup

For authenticated tests, use the session manager to create a test user and session:

```typescript
import { getTestSessionManager, getTestToken, createIntegrationTestApp, authenticatedJsonRequest } from '@/tests/helpers'
import { setupIntegrationTests } from '@/tests/helpers/setup'
import { beforeAll, describe, expect, it } from 'bun:test'

setupIntegrationTests()

describe('User API', () => {
	const sessionManager = getTestSessionManager()

	beforeAll(async () => {
		await sessionManager.setup()
	})

	describe('GET /iam/user/list', () => {
		it('returns 401 when not authenticated', async () => {
			const app = createIntegrationTestApp()
			const res = await app.handle(jsonRequest('GET', '/iam/user/list'))
			expect(res.status).toBe(401)
		})

		it('returns 200 with user data when authenticated', async () => {
			const app = createIntegrationTestApp()
			const token = getTestToken()
			const res = await app.handle(authenticatedJsonRequest('GET', '/iam/user/list', token))
			expect(res.status).toBe(200)
		})
	})
})
```

#### Test Response Types

- **401 Unauthorized**: Test when endpoint requires authentication
- **422 Validation Error**: Test when request body/query fails schema validation
- **404 Not Found**: Test when requested resource doesn't exist
- **200 OK**: Test happy path with valid authenticated request

```typescript
describe('GET /iam/user/detail', () => {
	it('returns 404 for non-existent user when authenticated', async () => {
		const app = createIntegrationTestApp()
		const token = getTestToken()
		const res = await app.handle(
			authenticatedJsonRequest('GET', '/iam/user/detail?id=999999', token),
		)
		expect(res.status).toBe(404)
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

### Session Manager - Authenticated Tests

The session manager creates a test user and session in the database for authenticated tests:

```typescript
import { getTestSessionManager, getTestToken } from '@/tests/helpers/session-manager'

const sessionManager = getTestSessionManager()

beforeAll(async () => {
	await sessionManager.setup()
})

// Get JWT token for authenticated requests
const token = getTestToken()
```

**Features:**
- Creates a test user with `isRoot: true` (superadmin privileges)
- Creates a session in the database
- Generates a JWT token with the actual session ID
- Singleton pattern - one instance per test run

### JWT Helper

Generate test JWT tokens:

```typescript
import { generateTestToken } from '@/tests/helpers/jwt'

const token = generateTestToken({
	id: 999,
	userId: 1,
	email: 'test@example.com',
	username: 'testuser',
})
```

### Database Factories

Create test data in the database:

```typescript
import { createUser, createRole, createSession } from '@/tests/helpers/factories/iam'

// Create a user
const user = await createUser({
	email: 'test@example.com',
	username: 'testuser',
	isRoot: true,
})

// Create a role
const role = await createRole({
	name: 'Admin',
	code: 'ADMIN',
})

// Create a session
const session = await createSession(user.id)
```

**Available Factories:**
- `createUser()` - Create test user (supports `isRoot` for superadmin)
- `createRole()` - Create test role
- `createSession()` - Create test session
- `createSuperadminRole()` - Ensure superadmin role (ID: 1) exists in database

### App Builders

```typescript
import { createIntegrationTestApp, jsonRequest, authenticatedJsonRequest } from '@/tests/helpers/app-builder'

// Full integration test with real database and services
const app = createIntegrationTestApp()

// Make JSON request
const res = await app.handle(jsonRequest('GET', '/api/path'))

// Make authenticated JSON request
const res = await app.handle(authenticatedJsonRequest('GET', '/api/path', token))
```

### Setup - Test Lifecycle

```typescript
import { setupIntegrationTests } from '@/tests/helpers/setup'

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

## 🔐 Authentication

### Test User Configuration

All test users are configured as superadmin with full access:

- **User**: Created with `isRoot: true`
- **Role**: Superadmin role (ID: 1, code: SUPERADMIN) created in database
- **Session**: Real session in database with JWT token
- **Permissions**: Full access to all resources

This ensures tests have the necessary permissions to access all endpoints without authorization blocking.

### Query Parameter Handling

For endpoints with query parameters (e.g., `/detail?id=123`):

- Use `zq.recordId` in route definitions for automatic string-to-number coercion
- Include query parameters in the URL string: `authenticatedJsonRequest('GET', '/path?id=123', token)`
- Avoid manual Request construction unless necessary

## ❌ What NOT to Test

| Don't Test                  | Reason                       |
| --------------------------- | ---------------------------- |
| DTO `.safeParse()`          | Framework handles validation |
| Service layer in isolation  | Test via HTTP instead        |
| Repository methods directly | Covered by HTTP tests        |
| Simple getters/setters      | No business logic            |

## ✅ Migration Checklist

- [ ] New features: Write HTTP test in `tests/http/{module}/`
- [ ] Cross-module flows: Write in `tests/flows/`
- [ ] Use `sessionManager.setup()` for authenticated tests
- [ ] Use `getTestToken()` for JWT tokens
- [ ] Use database factories for test data
- [ ] Call `setupIntegrationTests()` at top of file
- [ ] Test 401, 422, 404, and 200 status codes
- [ ] Remove DTO tests from existing files

## 📊 Test Coverage

Currently implemented:

- ✅ **401 Tests**: Unauthorized access for all endpoints
- ✅ **422 Tests**: Validation errors for missing/invalid fields
- ✅ **404 Tests**: Non-existent resources (detail endpoints)
- ✅ **200 Tests**: Happy path with authenticated requests
- ✅ **Superadmin Configuration**: Test users have full access
- ⏸️ **403 Tests**: Authorization tests (blocked - requires role-based setup)

## 🛠️ Type Checking

Run TypeScript check to ensure type safety:

```bash
bunx tsc --noEmit
```

For unsafe but confirmed-to-work code, use `@ts-expect-error` comments:

```typescript
const body = await res.json()
// @ts-expect-error - body.data is confirmed to have these properties from API response
expect(body.data).toHaveProperty('email')
```
