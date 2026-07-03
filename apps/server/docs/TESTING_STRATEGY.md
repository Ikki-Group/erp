# Testing Strategy - Task 2.4

**Date:** 2026-06-22  
**Status:** 🔄 IN PROGRESS  
**Target:** 80% coverage for services

---

## 🎯 Objectives

1. Fix existing broken tests
2. Achieve 80%+ test coverage for active modules
3. Set up coverage reporting
4. Establish testing patterns for future modules

---

## 📊 Current State

### Existing Tests Audit

**Location:** `src/tests/services/`

| Test File      | Status    | Issues                                                      |
| -------------- | --------- | ----------------------------------------------------------- |
| `iam.test.ts`  | ❌ Broken | Schema mismatch (`is_built_in` → `isSystem`), method rename |
| `auth.test.ts` | ❌ Broken | Service structure changed, undefined method                 |

**Coverage:** Unknown (no coverage reporting setup)

### Issues Found

1. **Schema Mismatches:**
   - `rolesTable.is_built_in` → should be `isSystem`
   - Database column names don't match code

2. **Method Renames (Phase C):**
   - `handleDetail` → `handleGetById` (not updated in tests)
   - `handleRemove` → `handleDelete` (not updated in tests)

3. **Service Structure Changes:**
   - Auth service structure modified
   - Test expectations outdated

4. **Test Infrastructure:**
   - Setup in `src/tests/setup.ts`
   - Uses test database (separate from dev)
   - Bun test runner

---

## 🎯 Testing Goals

### Priority 1: Fix Existing Tests (1-2h)

- [ ] Update schema references
- [ ] Update method names
- [ ] Fix auth service tests
- [ ] Verify all existing tests pass

### Priority 2: Coverage Setup (30m)

- [ ] Configure coverage reporting
- [ ] Generate baseline coverage report
- [ ] Set coverage thresholds

### Priority 3: Add Missing Tests (3-4h)

- [ ] location/ module tests
- [ ] iam/user tests (expand)
- [ ] iam/role tests (expand)
- [ ] session/ tests
- [ ] Integration tests for routes

---

## 📋 Testing Patterns

### Unit Test Pattern

**File Location:** Colocated with module OR in `src/tests/services/`

```typescript
// src/modules/location/location.test.ts
import { describe, test, expect, beforeAll, mock } from 'bun:test'
import { LocationService } from './location.service'
import { LocationRepo } from './location.repo'

describe('LocationService', () => {
	let service: LocationService
	let mockRepo: jest.Mocked<LocationRepo>
	let mockCache: any

	beforeAll(() => {
		mockRepo = {
			findById: mock(() => Promise.resolve(null)),
			create: mock((data) => Promise.resolve({ id: 1, ...data })),
			// ... other methods
		} as any

		mockCache = {
			getOrSet: mock((key, fn) => fn()),
			delete: mock(() => Promise.resolve()),
			deleteAll: mock(() => Promise.resolve()),
		}

		service = new LocationService(mockRepo, mockCache)
	})

	describe('handleCreate', () => {
		test('should create location successfully', async () => {
			const dto = {
				name: 'Test Location',
				code: 'TEST',
				type: 'WAREHOUSE' as const,
			}

			const result = await service.handleCreate(dto, 1)

			expect(result.id).toBeDefined()
			expect(mockRepo.create).toHaveBeenCalledTimes(1)
			expect(mockCache.deleteAll).toHaveBeenCalled()
		})

		test('should throw error on conflict', async () => {
			// Test conflict checking
		})
	})

	describe('handleGetById', () => {
		test('should return location when found', async () => {
			const mockLocation = { id: 1, name: 'Test', code: 'TEST' }
			mockRepo.findById.mockResolvedValueOnce(mockLocation)

			const result = await service.handleGetById(1)

			expect(result).toEqual(mockLocation)
		})

		test('should throw NotFoundError when not found', async () => {
			mockRepo.findById.mockResolvedValueOnce(null)

			await expect(service.handleGetById(999)).rejects.toThrow('not found')
		})
	})
})
```

---

### Integration Test Pattern

**File Location:** `src/tests/integration/` OR `src/tests/services/`

```typescript
// src/tests/integration/location.integration.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { testCtx } from '../setup'

describe('Location Integration', () => {
	let createdLocationId: number

	beforeAll(async () => {
		// Setup: ensure clean state
		await testCtx.db.execute(sql`DELETE FROM locations WHERE code LIKE 'TEST%'`)
	})

	afterAll(async () => {
		// Cleanup
		await testCtx.db.execute(sql`DELETE FROM locations WHERE code LIKE 'TEST%'`)
	})

	describe('POST /locations', () => {
		test('should create location', async () => {
			const dto = {
				name: 'Test Location',
				code: 'TEST001',
				type: 'WAREHOUSE',
			}

			const result = await testCtx.m.location.location.handleCreate(dto, 1)

			expect(result.id).toBeDefined()
			createdLocationId = result.id
		})

		test('should fail with duplicate code', async () => {
			const dto = {
				name: 'Duplicate',
				code: 'TEST001', // Same code
				type: 'STORE',
			}

			await expect(testCtx.m.location.location.handleCreate(dto, 1)).rejects.toThrow(
				'already exists',
			)
		})
	})

	describe('GET /locations/:id', () => {
		test('should get location by id', async () => {
			const result = await testCtx.m.location.location.handleGetById(createdLocationId)

			expect(result.id).toBe(createdLocationId)
			expect(result.code).toBe('TEST001')
		})

		test('should throw on non-existent id', async () => {
			await expect(testCtx.m.location.location.handleGetById(999999)).rejects.toThrow('not found')
		})
	})

	describe('PATCH /locations/:id', () => {
		test('should update location', async () => {
			const result = await testCtx.m.location.location.handleUpdate(
				{
					id: createdLocationId,
					name: 'Updated Name',
					code: 'TEST001',
					type: 'STORE',
				},
				1,
			)

			expect(result.id).toBe(createdLocationId)
		})
	})

	describe('DELETE /locations/:id', () => {
		test('should delete location', async () => {
			await testCtx.m.location.location.handleDelete(createdLocationId, 1)

			await expect(testCtx.m.location.location.handleGetById(createdLocationId)).rejects.toThrow(
				'not found',
			)
		})
	})
})
```

---

## 🛠️ Action Plan

### Step 1: Fix Existing Tests (Priority 1)

**iam.test.ts fixes:**

```typescript
// Update method names
;-roleSvc.handleDetail(id) +
	roleSvc.handleGetById(id) -
	roleSvc.handleRemove(id) +
	roleSvc.handleDelete(id) -
	userSvc.handleRemove(id) +
	userSvc.handleDelete(id)
```

**auth.test.ts fixes:**

```typescript
// Fix service access
- authSvc = testCtx.m.auth.auth  // Wrong
+ authSvc = testCtx.m.auth       // Correct (auth is AuthModule)

// Or check actual structure
const authModule = testCtx.m.auth
// Then access correct service
```

---

### Step 2: Setup Coverage Reporting

**package.json:**

```json
{
	"scripts": {
		"test:coverage": "NODE_ENV=test bun test --coverage",
		"test:coverage:report": "NODE_ENV=test bun test --coverage --coverage-reporter=html"
	}
}
```

**Coverage thresholds:**

- Services: 80%+ (target)
- Repos: 70%+ (acceptable)
- Routes: 60%+ (basic smoke tests)

---

### Step 3: Add Missing Tests

**Test Coverage Matrix:**

| Module        | Unit Tests | Integration Tests | Priority           |
| ------------- | ---------- | ----------------- | ------------------ |
| **location/** | ❌ Missing | ❌ Missing        | P1 (gold standard) |
| **iam/user**  | ⚠️ Partial | ❌ Missing        | P1                 |
| **iam/role**  | ⚠️ Partial | ❌ Missing        | P1                 |
| **auth**      | ❌ Broken  | ❌ Missing        | P2                 |
| **session**   | ❌ Missing | ❌ Missing        | P3                 |

---

## 📊 Success Metrics

### Minimum Viable Coverage

- [ ] All existing tests passing
- [ ] location/ module: 80%+ coverage
- [ ] iam/user: 80%+ coverage
- [ ] iam/role: 80%+ coverage
- [ ] Overall services: 70%+

### Stretch Goals

- [ ] auth/ module: 70%+ coverage
- [ ] session/ module: 60%+ coverage
- [ ] Integration tests for all CRUD operations
- [ ] Overall: 80%+ coverage

---

## 🎯 Timeline

| Task                 | Duration | Status     |
| -------------------- | -------- | ---------- |
| Fix existing tests   | 1-2h     | 🔄 Next    |
| Setup coverage       | 30m      | ⏳ Pending |
| Write location tests | 1h       | ⏳ Pending |
| Write iam tests      | 1-2h     | ⏳ Pending |
| Integration tests    | 1-2h     | ⏳ Pending |

**Total:** 4.5-7.5 hours

---

## 📝 Notes

### Test Database

- Separate test database configured
- Connection via `testCtx`
- Automatic cleanup in `afterAll`

### Best Practices

1. **Isolation:** Each test should be independent
2. **Cleanup:** Always clean up test data
3. **Descriptive:** Test names explain what they test
4. **Fast:** Mock external dependencies
5. **Deterministic:** No random data, use fixtures

### Testing Anti-Patterns to Avoid

- ❌ Testing implementation details
- ❌ Brittle assertions (exact string matching)
- ❌ Tests that depend on order
- ❌ Shared mutable state between tests
- ❌ Tests without cleanup

---

**Status:** Ready to execute  
**Next:** Fix existing tests → Setup coverage → Write new tests
