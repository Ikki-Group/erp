# 🤖 Claude Code Best Practices Guide

**Optimizing AI-Assisted Development with Claude Code**

**Status:** Complete Guide for Ikki ERP Server  
**Audience:** Developers using Claude Code for feature implementation  
**Updated:** 2026-04-24

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Pre-Work Checklist](#pre-work-checklist)
3. [Code Generation Workflow](#code-generation-workflow)
4. [Prompt Templates](#prompt-templates)
5. [Verification Checklist](#verification-checklist)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Performance Optimization](#performance-optimization)
8. [Testing with AI](#testing-with-ai)
9. [Code Review with AI](#code-review-with-ai)
10. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Prerequisites
- Understand module structure (dto/, repo/, service/, router/)
- Familiar with ARCHITECTURE.md (recommended to read once)
- QUICK_REFERENCE.md bookmarked for quick lookup
- Terminal access to run verification commands

### Claude Code Access Points
- **Web**: claude.ai/code
- **IDE**: VSCode extension (installed and configured)
- **Desktop**: Claude desktop app with code feature

### First-Time Setup
1. Clone repo and check out working branch
2. Open ARCHITECTURE_INDEX.md to understand documentation
3. Open QUICK_REFERENCE.md for templates
4. Bookmark ARCHITECTURE.md for reference
5. Keep terminal open to run commands

---

## Pre-Work Checklist

### Before Starting Feature Development

#### Understanding Phase
- [ ] Read feature specification or task description
- [ ] Check existing similar modules for patterns
- [ ] Understand data relationships needed
- [ ] Determine API endpoints required
- [ ] Identify authentication/permission needs

#### Design Phase
- [ ] Sketch DTO structure (entity fields + validation rules)
- [ ] Determine module layer (Core/Layer 1/Layer 1.5/Layer 2/Layer 3)
- [ ] Identify dependencies on other modules
- [ ] Plan database schema changes (if needed)
- [ ] List service methods needed (handleCreate, handleUpdate, etc.)
- [ ] Plan API endpoints (POST /create, GET /:id, etc.)

#### Documentation Phase
- [ ] Reference existing similar module (location/ for CRUD, iam/ for complex)
- [ ] Check MODULE_REVIEW_CHECKLIST.md for requirements
- [ ] Review ARCHITECTURE.md relevant sections
- [ ] Print QUICK_REFERENCE.md checklist

#### Database Planning (if schema changes)
- [ ] Modify src/db/schema.ts
- [ ] Plan migration (review what db:generate will produce)
- [ ] Think about indexes needed
- [ ] Plan audit columns (createdBy, updatedBy)

#### Confirmation
- [ ] No circular dependencies expected
- [ ] Layer dependency clear (no upward imports)
- [ ] Performance requirements understood
- [ ] Caching strategy planned
- [ ] Error scenarios identified

---

## Code Generation Workflow

### Phase 1: Information Gathering

**What to provide Claude Code:**

```
Feature: [Name]
Module: [Name] (Layer: Core/1/1.5/2/3)
Dependencies: [List other modules]
Authentication: [Required/Optional]
Performance: [Expected volume, if any optimization needed]

Entities:
- [Entity name]: [Brief description]
  - Fields: [List with types]
  
Endpoints:
- GET /list - List all
- GET /:id - Get single
- POST /create - Create
- etc.

Special requirements:
- [Any specific business logic]
- [Any caching strategy]
- [Any relationships]
```

**Example:**

```
Feature: User Roles Management
Module: iam
Layer: Layer 1 (Master Data)
Dependencies: location
Authentication: Required (auth: true)
Performance: Typically <100 roles, but need efficient bulk operations

Entities:
- Role: Organizational role with permissions
  - id: number
  - name: string (unique)
  - description: string
  - permissions: Permission[] (relationship)
  
Endpoints:
- GET /roles/list - List all roles with pagination
- GET /roles/:id - Get single role with permissions
- POST /roles/create - Create new role
- PUT /roles/:id - Update role
- DELETE /roles/:id - Delete role
- POST /roles/bulk-assign - Assign multiple users to role

Special:
- Need permission checks (admin only)
- Cache roles list (low change frequency)
- Audit all changes (createdBy/updatedBy)
```

### Phase 2: Generation Request

**Template prompt for Claude Code:**

```markdown
# Generate [Entity] Module

## Context
[Paste the information from Phase 1]

## Reference Module
Use `src/modules/iam/` as pattern reference (complex business logic)
or `src/modules/location/` as pattern reference (simple CRUD)

## Documentation References
- Architecture: See ARCHITECTURE.md sections:
  - Database Layer
  - Service Layer
  - Repository Layer
  - HTTP & Router Layer
- Templates: See QUICK_REFERENCE.md:
  - New Feature Checklist
  - Code templates (DTO, Repo, Service, Router)
- Checklist: See MODULE_REVIEW_CHECKLIST.md (84-point review)

## Requirements
- ✅ Type-safe (strict TypeScript, no `any`)
- ✅ Batch operations (not loops with N DB calls)
- ✅ Smart caching (cache.getOrSet + invalidation)
- ✅ Error handling (throw specific errors)
- ✅ Audit trails (createdBy/updatedBy in all writes)
- ✅ Telemetry (record() in all repo methods)
- ✅ Testing (unit + integration tests)
- ✅ Pass `bun run verify` (lint + typecheck)

## Order
1. Generate DTOs (with Zod, spread-shape pattern)
2. Generate database schema changes (if any)
3. Generate migration commands (for review)
4. Generate Repository (QUERY / MUTATION / PRIVATE sections)
5. Generate Service (QUERY / COMMAND / INTERNAL sections)
6. Generate Router (inline async functions)
7. Generate tests (unit + integration)
8. Generate registration code (_registry.ts, _routes.ts updates)

## Start with DTOs
[Entity] structure is defined as:
- [Fields with types and validation rules]

Please generate [Entity]Dto, [Entity]CreateDto, [Entity]UpdateDto, [Entity]FilterDto
```

### Phase 3: Verification & Review

After Claude Code generates code:

```bash
# 1. Type check (must pass)
bun run typecheck

# 2. Lint (must pass)
bun run lint

# 3. Run tests (must pass)
bun run test

# 4. Full verification (must pass)
bun run verify

# 5. Check dependencies (no circular)
bun run check-deps
```

### Phase 4: Code Review

Use MODULE_REVIEW_CHECKLIST.md to verify:
- [ ] Phase 1: Structure & Organization (11 items)
- [ ] Phase 2: Type Safety (9 items)
- [ ] Phase 3: Error Handling (7 items)
- [ ] Phase 4: Database & Caching (9 items)
- [ ] Phase 5: Validation & Conflict Checking (9 items)
- [ ] Phase 6: HTTP & Routes (9 items)
- [ ] Phase 7: Utilities & Helpers (7 items)
- [ ] Phase 8: Testing (8 items)
- [ ] Phase 9: Documentation & Comments (7 items)
- [ ] Phase 10: Quality Checks (8 items)

**Target Score: 75+/84** (Excellent, ship with confidence)

---

## Prompt Templates

### Template 1: Simple CRUD Feature

```markdown
# Generate [Entity] CRUD Module

Feature: Simple CRUD for [Entity]
Module: [moduleName] (Layer: [Layer])
Dependencies: [list or "none"]

Entity [Entity]:
- id: number (PK)
- name: string (required, 1-100 chars)
- description: string (optional)
- status: 'active' | 'inactive'
- createdAt: timestamp (auto)
- updatedAt: timestamp (auto)
- createdBy: number (FK to users)
- updatedBy: number (FK to users)

Endpoints:
- GET /[entities]/list - Paginated list
- GET /[entities]/:id - Get single
- POST /[entities]/create - Create (auth: true)
- PUT /[entities]/:id - Update (auth: true)
- DELETE /[entities]/:id - Delete (auth: true)

Requirements:
- Use QUICK_REFERENCE.md template patterns
- Reference location/ module as CRUD template
- Batch operations where applicable
- Smart cache invalidation
- Full test coverage
```

### Template 2: Complex Feature with Relationships

```markdown
# Generate [Feature] with Relationships

Feature: [Description]
Module: [moduleName] (Layer: [Layer])
Dependencies: [list modules]

Entities:
1. [Entity1]
   - Fields: [list]
   - Relationships: [1:N or 1:1 with other entities]

2. [Entity2]
   - Fields: [list]
   - Relationships: [relationships]

Business Logic:
- [Rule 1]
- [Rule 2]
- [Validation rule]

Endpoints:
- [List endpoints with requirements]

Performance:
- [Optimization needed]
- [Caching strategy]

Requirements:
- Use RelationMap for 1:N joins (not N+1 queries)
- Batch operations for bulk updates
- Cache strategy: [describe]
- Reference iam/ module (complex patterns)
```

### Template 3: Optimization/Refactoring

```markdown
# Optimize [Module] Performance

Current Issues:
- [Issue 1: description with code location]
- [Issue 2: description]

Goals:
- [Optimization goal 1]
- [Optimization goal 2]

Reference:
- ARCHITECTURE.md → Performance Patterns
- ARCHITECTURE_DIAGRAMS.md → Batch Operation Optimization

Constraints:
- Keep existing API contracts
- Don't remove features
- Maintain backward compatibility

Review with MODULE_REVIEW_CHECKLIST.md after
```

### Template 4: Bug Fix with Tests

```markdown
# Fix [Bug Description]

Bug Report:
- [What's broken]
- [When it breaks]
- [Expected behavior]
- [Actual behavior]

Location:
- File: [path]
- Lines: [numbers]
- Related issue: [if any]

Requirements:
- Root cause analysis
- Fix without breaking existing tests
- Add regression test
- Reference ARCHITECTURE.md error handling patterns

Verification:
- `bun run test` must pass all tests
- New test covers the bug
- No type errors
```

---

## Verification Checklist

### After Code Generation

#### Phase 1: Type Safety ✅
```bash
bun run typecheck
# Expected: No errors
```

**If fails:**
- Check for `any` types (not allowed except documented)
- Verify generics are properly constrained
- Check import paths are correct
- Verify Zod spread-shape pattern used (not `.extend()`)

#### Phase 2: Linting ✅
```bash
bun run lint
# Expected: 0 errors, 0 warnings
```

**If fails:**
- Check unused imports
- Check unused variables
- Verify naming conventions (camelCase, PascalCase, UPPERCASE)
- Check for console.log statements (remove before commit)

#### Phase 3: Tests ✅
```bash
bun run test
# Expected: All tests pass
```

**If fails:**
- Check test setup (mocks correct)
- Check assertions match implementation
- Verify error scenarios are tested

#### Phase 4: Full Verification ✅
```bash
bun run verify
# Expected: All checks pass
```

**If fails:**
- This runs: lint + typecheck + tests + knip + check-deps
- Address each failure individually

#### Phase 5: Circular Dependencies ✅
```bash
bun run check-deps
# Expected: No circular dependencies
```

**If fails:**
- Review imports in generated code
- Ensure no upward layer imports
- Check for circular service dependencies

### Manual Verification

#### Code Review Checklist

Use MODULE_REVIEW_CHECKLIST.md (84 points):

**Structure (11 points):**
- [ ] Directory structure correct (dto/, repo/, service/, router/)
- [ ] Naming follows conventions
- [ ] Layer dependencies correct
- [ ] index.ts exports properly

**Type Safety (9 points):**
- [ ] No `any` types
- [ ] All parameters typed
- [ ] Return types explicit
- [ ] Zod spread-shape used
- [ ] Null/undefined handled explicitly

**Errors (7 points):**
- [ ] Uses core error classes
- [ ] Errors extend HttpError
- [ ] Proper HTTP status codes
- [ ] Throws not returns

**Database (9 points):**
- [ ] Methods organized (QUERY/MUTATION/PRIVATE)
- [ ] All mutations wrapped with `record()`
- [ ] Transactions where needed
- [ ] No `as any` casts

**Caching (covered in Database section):**
- [ ] Namespaced cache used
- [ ] Cache keys are constants
- [ ] Invalidation on mutations
- [ ] getOrSet() pattern used

**Validation (9 points):**
- [ ] Routes have Zod validation
- [ ] Email/password validated properly
- [ ] Uniqueness checked
- [ ] Audit columns present

**HTTP (9 points):**
- [ ] Handlers use inline async functions
- [ ] Response formatting (res.ok, res.created, etc.)
- [ ] Auth: true where needed
- [ ] Proper HTTP methods

**Utilities (7 points):**
- [ ] Reusable helpers extracted
- [ ] DRY principle applied
- [ ] Constants centralized
- [ ] Type aliases used

**Testing (8 points):**
- [ ] Unit tests (mocked repo)
- [ ] Integration tests (real service)
- [ ] Edge cases covered
- [ ] Error scenarios tested

**Documentation (7 points):**
- [ ] JSDoc on public functions
- [ ] Complex logic commented
- [ ] README or docs
- [ ] Error codes documented

**Quality (8 points):**
- [ ] Linting: 0 errors
- [ ] Type checking: 0 errors
- [ ] No N+1 queries
- [ ] No circular deps
- [ ] No SQL injection (Drizzle prevents)
- [ ] No XSS (backend)
- [ ] Auth checks on protected routes
- [ ] No secrets in code

**Score: ___ / 84**
- 84/84 = Production-ready ⭐⭐⭐⭐⭐
- 75-83 = Excellent, ship ⭐⭐⭐⭐
- 65-74 = Good, minor improvements ⭐⭐⭐
- 55-64 = Needs work
- <55 = Major revision

---

## Common Issues & Solutions

### Issue 1: Type Inference Lost

**Error:**
```
Type 'object' is not assignable to type 'SomeDto'
```

**Cause:**
Using `.extend()` instead of spread-shape pattern

**Solution:**
```typescript
// ❌ Wrong
const MyDto = BaseDto.extend({ field: z.string() })

// ✅ Right
const MyDto = z.object({
  ...BaseDto.shape,
  field: z.string(),
})
```

### Issue 2: N+1 Queries

**Error:**
Database suddenly slow with increased data

**Cause:**
Loop with individual DB calls

**Solution:**
```typescript
// ❌ Wrong
for (const id of ids) {
  await repo.getById(id)  // N queries
}

// ✅ Right
const items = await repo.getByIds(ids)  // 1 query
```

### Issue 3: Stale Cache

**Error:**
Update succeeds but data still shows old value

**Cause:**
Cache not invalidated on mutation

**Solution:**
```typescript
// ✅ Right
async handleUpdate(id, data, actorId) {
  const result = await repo.update(id, data)
  await cache.delete(CACHE_KEYS.DETAIL(id))  // Invalidate
  return result
}
```

### Issue 4: Missing Audit

**Error:**
Don't know who created/updated records

**Cause:**
Forgot createdBy/updatedBy

**Solution:**
```typescript
// ✅ Right
await repo.create({
  ...data,
  createdBy: actorId,  // From auth context
  updatedBy: actorId,
})
```

### Issue 5: No Error Thrown

**Error:**
Endpoint returns null instead of error

**Cause:**
Return null for missing records

**Solution:**
```typescript
// ❌ Wrong
const user = await repo.getById(id)
return user || null

// ✅ Right
const user = await repo.getById(id)
if (!user) throw new NotFoundError('User', id)
return user
```

### Issue 6: Circular Dependencies

**Error:**
`bun run check-deps` reports circular dependency

**Cause:**
Module A imports from Module B, B imports from A

**Solution:**
- Check layer compliance (no upward imports)
- Extract shared code to core/
- Use dependency inversion (inject, don't import)

### Issue 7: Test Fails

**Error:**
Test says "expected X but got Y"

**Cause:**
Mock repo doesn't match real implementation

**Solution:**
```typescript
// ✅ Right
const mockRepo = {
  getById: async (id) => ({ id, name: 'Test', ... }),
  create: async (data) => ({ id: 1, ...data, ... }),
  // Match all fields the real repo returns
}
```

### Issue 8: Validation Error (422)

**Error:**
"Invalid input" when trying to POST

**Cause:**
Request body doesn't match Zod schema

**Solution:**
- Check DTO definition (required vs optional fields)
- Verify frontend is sending correct fields
- Check zc helpers (zc.email(), zc.password())

---

## Performance Optimization

### When Performance Matters

**Optimize if:**
- Expected data > 1000 records
- Operation runs frequently
- User-facing latency concerns
- Bulk operations (100+ items)

### Optimization Patterns

#### Pattern 1: Batch Operations

**Before:**
```typescript
for (const userId of userIds) {
  await repo.removeFromLocation(userId, locationId)
}
// O(n) queries
```

**After:**
```typescript
await repo.removeUsersBulkFromLocation(userIds, locationId)
// O(1) query
```

#### Pattern 2: Parallel Queries

**Before:**
```typescript
const data = await query1()
const meta = await query2()
```

**After:**
```typescript
const [data, meta] = await Promise.all([query1(), query2()])
// Parallel execution
```

#### Pattern 3: Caching Expensive Reads

**Before:**
```typescript
async handleList(filter) {
  return this.repo.getList(filter)  // Always hits DB
}
```

**After:**
```typescript
async handleList(filter) {
  if (!filter.search) {
    return cache.getOrSet({
      key: LIST_KEY,
      factory: () => this.repo.getList(filter),
      ttl: 3600
    })
  }
  return this.repo.getList(filter)
}
```

#### Pattern 4: RelationMap for Joins

**Before:**
```typescript
const users = await getUsers()
const roles = []
for (const user of users) {
  const role = await roleRepo.getById(user.roleId)
  roles.push(role)  // N queries
}
```

**After:**
```typescript
const users = await getUsers()
const roleList = await roleRepo.getAll()
const roleMap = new RelationMap(roleList, r => r.id)
const users WithRoles = users.map(u => ({
  ...u,
  role: roleMap.getRequired(u.roleId)
}))
```

---

## Testing with AI

### Test Structure

**Unit Test (Service):**
```typescript
import { describe, expect, it } from 'bun:test'
import { EntityService } from './entity.service'

describe('EntityService', () => {
  const mockRepo = { /* mock methods */ }
  const service = new EntityService(mockRepo)
  
  describe('handleCreate', () => {
    it('should create entity', async () => {
      const result = await service.handleCreate(data, actorId)
      expect(result.id).toBeDefined()
    })
    
    it('should throw on conflict', async () => {
      mockRepo.create = async () => {
        throw new ConflictError('Already exists')
      }
      expect(() => service.handleCreate(data, actorId))
        .toThrow(ConflictError)
    })
  })
})
```

**Integration Test (Router):**
```typescript
import { api } from './test-setup'

describe('Entity Routes', () => {
  it('POST /create should create entity', async () => {
    const res = await api.post('/entities/create')
      .send(data)
      .set('Authorization', `Bearer ${token}`)
    
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBeDefined()
  })
})
```

### When Asking AI for Tests

```markdown
# Generate tests for [Entity] Service

Scenarios to test:
1. Happy path (create, read, update, delete)
2. Error scenarios:
   - Not found (404)
   - Conflict/duplicate (409)
   - Validation error (400)
3. Edge cases:
   - Empty arrays
   - Null values
   - Boundary conditions

Use test template from QUICK_REFERENCE.md
```

---

## Code Review with AI

### Asking for Code Review

```markdown
# Review [module] for best practices

Module: [path]
Reference: ARCHITECTURE.md + MODULE_REVIEW_CHECKLIST.md

Check against:
1. Type safety (no any, proper generics)
2. Performance (no N+1, batch ops, caching)
3. Error handling (throw specific errors)
4. Audit trails (createdBy/updatedBy)
5. Testing (unit + integration)
6. Documentation (JSDoc, comments)

Scoring: Use 84-point MODULE_REVIEW_CHECKLIST.md
Target: 75+/84
```

### Code Review Process

1. **Run verification first:**
   ```bash
   bun run typecheck  # Type check
   bun run lint       # Linting
   bun run test       # Tests
   bun run verify     # Full check
   ```

2. **Use checklist:**
   Run through MODULE_REVIEW_CHECKLIST.md

3. **Ask Claude Code:**
   "Review [module] against the 84-point checklist and score it"

4. **Document findings:**
   - 🟢 What's good
   - 🟡 What needs improvement
   - 🔴 What must be fixed

---

## Tips & Tricks

### Tip 1: Provide Good Context

**Bad:**
"Generate a service"

**Good:**
```
Generate UserService with:
- handleList (with pagination)
- handleDetail (with caching)
- handleCreate (with uniqueness check)
- handleUpdate (with cache invalidation)
- handleDelete (with permission check)
```

### Tip 2: Reference Specific Files

Instead of "use the pattern":
```markdown
Reference src/modules/iam/service/assignment.service.ts
lines 70-122 for batch operation pattern
```

### Tip 3: Break Large Features Into Steps

Instead of: "Build entire feature"

Do:
1. Generate DTOs
2. Generate schema + migration
3. Generate repo
4. Generate service
5. Generate router
6. Generate tests

### Tip 4: Verify After Each Phase

After each component, run:
```bash
bun run typecheck && bun run lint
```

Don't wait until the end to catch errors.

### Tip 5: Use Diagrams for Complex Logic

When explaining complex workflows:
```markdown
Show the flow using diagram format from ARCHITECTURE_DIAGRAMS.md
For relationships between entities, use RelationMap pattern
```

### Tip 6: Commit Frequently

After each verified component:
```bash
git add .
git commit -m "feat: add [component] for [entity]"
```

Don't commit everything at once.

### Tip 7: Ask for Explanations

```markdown
Explain how the caching strategy works in
src/modules/user/service/user.service.ts
```

### Tip 8: Use the Checklist

Keep MODULE_REVIEW_CHECKLIST.md open while working. Before committing:
- [ ] All 84 points considered
- [ ] Score calculated
- [ ] Target 75+ achieved

### Tip 9: Reference Error Patterns

Instead of: "add error handling"

Do:
```markdown
Add error handling using patterns from:
ARCHITECTURE.md → Error Handling section
Error types: NotFoundError, ConflictError, etc.
```

### Tip 10: Document Non-Obvious Code

```markdown
Add JSDoc for:
- Batch operation optimization (why inArray not loop)
- Cache invalidation strategy (when/why clear)
- Complex validation logic (business rule explanation)
```

---

## Workflow Summary

### Quick Development Flow

```
1. [Provide requirements] → Claude Code
   ↓
2. Generate code (DTOs → Repo → Service → Router → Tests)
   ↓
3. Run verification: `bun run typecheck && bun run lint && bun run test`
   ↓
4. If ✅ pass, review with MODULE_REVIEW_CHECKLIST.md
   ↓
5. If 🟡 issues found, ask Claude Code to fix specific items
   ↓
6. Run `bun run verify` (final check)
   ↓
7. If ✅ pass, commit: `git add . && git commit -m "feat: ..."`
   ↓
8. Next feature
```

### Time Estimates (with Claude Code)

- Simple CRUD: 15 minutes (generate + verify)
- Complex feature (with relationships): 30 minutes
- Optimization: 20 minutes
- Bug fix + tests: 15 minutes
- Code review: 10 minutes

*(Actual time varies based on feature complexity)*

---

## Best Practices Summary

### ✅ DO

- ✅ Provide context and requirements upfront
- ✅ Reference existing modules as patterns
- ✅ Use templates from QUICK_REFERENCE.md
- ✅ Verify after each phase
- ✅ Review against checklists
- ✅ Commit frequently
- ✅ Ask for clarification
- ✅ Test early and often

### ❌ DON'T

- ❌ Ask for large features in one go (break into steps)
- ❌ Skip verification steps
- ❌ Ignore type errors
- ❌ Commit without testing
- ❌ Assume Claude Code knows your codebase (provide context)
- ❌ Generate without understanding the architecture
- ❌ Skip error handling
- ❌ Ignore performance implications

---

## Getting Help

### If Something Goes Wrong

1. **Read the error message** (usually very helpful)
2. **Check relevant ARCHITECTURE section** (reference doc)
3. **Look at similar module** (location/ or iam/)
4. **Run `bun run verify`** (full diagnostics)
5. **Ask Claude Code** with error message + code snippet

### Resources

- ARCHITECTURE.md - Complete reference
- QUICK_REFERENCE.md - Quick lookup
- ARCHITECTURE_DIAGRAMS.md - Visual flows
- MODULE_REVIEW_CHECKLIST.md - Verification
- CLAUDE.md - This project's guidelines

### Common Questions

**"How do I handle relationships?"**
→ See ARCHITECTURE.md → "Performance Patterns" → RelationMap section

**"What if data doesn't fit in memory?"**
→ See QUICK_REFERENCE.md → Batch Operations Pattern

**"How do I know if my code is good?"**
→ Use MODULE_REVIEW_CHECKLIST.md (84-point verification)

**"Should I cache this?"**
→ See ARCHITECTURE.md → Caching Strategy section

---

## Conclusion

With Claude Code and these best practices, you can:

✅ Build features 2-3x faster  
✅ Maintain consistent code quality  
✅ Ensure type safety automatically  
✅ Generate tested, production-ready code  
✅ Reduce review cycles  

The key is:
1. **Clear requirements** → Better code
2. **Reference patterns** → Consistent architecture
3. **Verify at each step** → No surprises at the end
4. **Use checklists** → Nothing is forgotten

Happy coding! 🚀

