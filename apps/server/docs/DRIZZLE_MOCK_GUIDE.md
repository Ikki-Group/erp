# Drizzle Mock Testing Guide

**Date:** 2026-06-22  
**Purpose:** Unit testing without database dependency

---

## 🎯 Testing Strategy Overview

### Two Testing Approaches

| Type                  | Purpose            | Uses                 | Speed     | Isolation |
| --------------------- | ------------------ | -------------------- | --------- | --------- |
| **Unit Tests**        | Test service logic | Mock repo + cache    | ⚡ Fast   | ✅ Full   |
| **Integration Tests** | Test full flow     | Real DB + real cache | 🐢 Slower | ❌ Shared |

---

## 📁 File Structure

```
src/tests/
├── helpers/
│   ├── mock-db.ts           # Mock utilities (NEW)
│   ├── test-client.ts       # HTTP test client
│   ├── test-db.ts           # Real DB setup
│   └── token-store.ts       # JWT helpers
│
├── unit/                    # Unit tests with mocks (NEW)
│   ├── location.service.test.ts
│   ├── user.service.test.ts
│   └── role.service.test.ts
│
└── services/                # Integration tests (existing)
    ├── iam.test.ts          # Full IAM flow
    └── auth.test.ts         # Full auth flow
```

---

## 🔧 Mock Utilities

### 1. Mock Database (`createMockDb`)

Creates type-safe Drizzle client mock without DB connection.

```typescript
import { createMockDb } from '@/tests/helpers/mock-db'

const mockDb = createMockDb()

// Works with Drizzle queries
const users = await mockDb.select().from(usersTable)
```

**Use when:** Testing low-level repo logic without DB.

---

### 2. Mock Repository (`createMockRepo`)

In-memory repository for testing service layer.

```typescript
import { createMockRepo } from '@/tests/helpers/mock-db'

const mockRepo = createMockRepo<User>()

// Setup test data
mockRepo._store.set(1, { id: 1, email: 'test@test.com', ... })

// Use in service
const service = new UserService(mockRepo as any, mockCache)
```

**Use when:** Testing service logic without DB or repo implementation.

---

### 3. Mock Cache (`createMockCache`)

In-memory cache for testing cache-dependent logic.

```typescript
import { createMockCache } from '@/tests/helpers/mock-db'

const mockCache = createMockCache()

// Setup cached data
mockCache._store.set('user:1', { id: 1, ... })

// Use in service
const service = new UserService(mockRepo, mockCache as any)
```

**Use when:** Testing cache hit/miss behavior.

---

## 📝 Writing Unit Tests with Mocks

### Example: LocationService Unit Test

```typescript
import { describe, test, expect, beforeEach } from 'bun:test'
import { LocationService } from '@/modules/location/location.service'
import { createMockRepo, createMockCache } from '../helpers/mock-db'

describe('LocationService (Unit)', () => {
	let service: LocationService
	let mockRepo: ReturnType<typeof createMockRepo>
	let mockCache: ReturnType<typeof createMockCache>

	beforeEach(() => {
		mockRepo = createMockRepo()
		mockCache = createMockCache()
		service = new LocationService(mockRepo as any, mockCache as any)
	})

	test('handleGetById - cache hit', async () => {
		// Arrange
		const mockLocation = { id: 1, code: 'WH-001', name: 'Warehouse' }
		mockCache._store.set('location:1', mockLocation)

		// Act
		const result = await service.handleGetById(1)

		// Assert
		expect(result).toEqual(mockLocation)
		expect(mockRepo._store.size).toBe(0) // Repo not touched
	})

	test('handleGetById - cache miss, fetch from repo', async () => {
		// Arrange
		const mockLocation = { id: 1, code: 'WH-001', name: 'Warehouse' }
		mockRepo._store.set(1, mockLocation)

		// Act
		const result = await service.handleGetById(1)

		// Assert
		expect(result).toEqual(mockLocation)
		expect(mockCache._store.has('location:1')).toBe(true) // Cache populated
	})

	test('handleCreate - invalidates cache', async () => {
		// Arrange
		const createDto = { code: 'WH-NEW', name: 'New Warehouse', type: 'warehouse' }

		// Act
		const result = await service.handleCreate(createDto, 1)

		// Assert
		expect(result.id).toBeDefined()
		expect(mockRepo._store.size).toBe(1)
		// In real test, verify cache.deleteAll() was called
	})
})
```

---

## 🧪 When to Use Each Approach

### Use Unit Tests (Mocks) When:

✅ **Testing business logic**

```typescript
test('should calculate discount correctly', () => {
	const discount = calculateDiscount(100, 0.1)
	expect(discount).toBe(10)
})
```

✅ **Testing error handling**

```typescript
test('should throw NotFoundError when user not found', async () => {
	mockRepo._store.clear() // Empty repo
	expect(async () => {
		await service.handleGetById(999)
	}).toThrow(NotFoundError)
})
```

✅ **Testing cache behavior**

```typescript
test('should use cache on second call', async () => {
	await service.handleGetById(1) // Cache miss
	await service.handleGetById(1) // Cache hit
	expect(mockRepo.findById).toHaveBeenCalledTimes(1)
})
```

✅ **Fast iteration during development**

- No DB setup needed
- Tests run in milliseconds
- Easy to debug

---

### Use Integration Tests (Real DB) When:

✅ **Testing database queries**

```typescript
test('findByEmail should query users table', async () => {
	const user = await repo.findByEmail('test@test.com')
	expect(user).toBeDefined()
})
```

✅ **Testing complex joins/relations**

```typescript
test('should load user with roles', async () => {
	const user = await userReadService.handleDetail(1)
	expect(user.roles).toBeInstanceOf(Array)
})
```

✅ **Testing full HTTP flow**

```typescript
test('POST /locations should create location', async () => {
  const res = await client.post('/locations', { code: 'WH-001', ... })
  expect(res.status).toBe(201)
})
```

✅ **Testing transactions/race conditions**

```typescript
test('concurrent updates should handle conflicts', async () => {
  await Promise.all([
    service.handleUpdate({ id: 1, ... }, 1),
    service.handleUpdate({ id: 1, ... }, 2),
  ])
})
```

---

## 🎯 Best Practices

### 1. Isolate Tests

```typescript
beforeEach(() => {
	mockRepo._reset() // Clear repo data
	mockCache._reset() // Clear cache data
})
```

### 2. Test One Thing at a Time

```typescript
// ✅ GOOD: Test cache hit
test('cache hit should not call repo', async () => {
	mockCache._store.set('user:1', mockUser)
	await service.handleGetById(1)
	expect(mockRepo._store.size).toBe(0)
})

// ❌ BAD: Test multiple concerns
test('should work', async () => {
	// Tests cache, repo, error handling, and validation
})
```

### 3. Use Descriptive Test Names

```typescript
// ✅ GOOD
test('handleCreate should throw ConflictError when email exists', ...)

// ❌ BAD
test('create test', ...)
```

### 4. Arrange-Act-Assert Pattern

```typescript
test('handleUpdate should update and invalidate cache', async () => {
	// Arrange
	const existing = { id: 1, code: 'WH-001' }
	mockRepo._store.set(1, existing)

	// Act
	const result = await service.handleUpdate({ id: 1, code: 'WH-002' }, 1)

	// Assert
	expect(result.code).toBe('WH-002')
	expect(mockCache._store.size).toBe(0) // Cache cleared
})
```

---

## 🚀 Running Tests

### Unit Tests Only (Fast)

```bash
bun test src/tests/unit/
```

### Integration Tests Only (Slower)

```bash
bun test src/tests/services/
```

### All Tests

```bash
bun test
```

### Watch Mode

```bash
bun test --watch
```

### With Coverage

```bash
bun test --coverage
```

---

## 📊 Coverage Targets

| Layer        | Target | Why                 |
| ------------ | ------ | ------------------- |
| **Services** | 80%+   | Core business logic |
| **Repos**    | 70%+   | DB queries critical |
| **Routes**   | 60%+   | Thin wrappers       |
| **Utils**    | 90%+   | Pure functions      |

---

## 🔄 Migration Path

### Existing Integration Tests → Keep As-Is

```typescript
// src/tests/services/iam.test.ts
// Uses real DB - good for full flow testing
describe('services/iam', () => {
	test('role CRUD', async () => {
		const created = await roleSvc.handleCreate(mockRole, 1)
		expect(created.id).toBeDefined()
	})
})
```

### New Tests → Add Unit Tests with Mocks

```typescript
// src/tests/unit/role.service.test.ts
// Uses mocks - fast isolated testing
describe('RoleService (Unit)', () => {
	test('handleCreate should validate and call repo', async () => {
		const result = await service.handleCreate(mockRole, 1)
		expect(mockRepo._store.size).toBe(1)
	})
})
```

**Strategy:** Both approaches complement each other!

---

## 🎓 Example Test Suite

```typescript
describe('UserService', () => {
	// Unit test: Business logic
	describe('validatePassword (Unit)', () => {
		test('should accept strong passwords', () => {
			expect(validatePassword('Pass123!')).toBe(true)
		})
	})

	// Unit test: Service logic with mocks
	describe('handleGetById (Unit)', () => {
		test('should return user from cache', async () => {
			mockCache._store.set('user:1', mockUser)
			const result = await service.handleGetById(1)
			expect(result).toEqual(mockUser)
		})
	})

	// Integration test: Full flow with DB
	describe('handleCreate (Integration)', () => {
		test('should create user in database', async () => {
			const result = await service.handleCreate(createDto, 1)
			const fromDb = await testCtx.db.query.users.findFirst({ where: eq(users.id, result.id) })
			expect(fromDb).toBeDefined()
		})
	})
})
```

---

## 🎉 Summary

**Created:**

- ✅ `mock-db.ts` - Mock utilities (createMockDb, createMockRepo, createMockCache)
- ✅ `location.service.test.ts` - Example unit test with mocks
- ✅ `DRIZZLE_MOCK_GUIDE.md` - This guide

**Benefits:**

- ⚡ Fast unit tests without DB
- 🔒 Isolated testing (no DB conflicts)
- 🧪 Test edge cases easily
- 🚀 Faster development cycle

**Next Steps:**

1. Add unit tests for location/, iam/user, iam/role
2. Keep integration tests for full flow validation
3. Set up coverage reporting
4. Achieve 80%+ service coverage

---

**Status:** ✅ Mock infrastructure ready  
**Ready for:** Unit test development  
**Example:** See `src/tests/unit/location.service.test.ts`
