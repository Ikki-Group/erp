# 📋 Module Review Checklist

Gunakan checklist ini untuk review modules `src/modules/*` dengan standar yang sama seperti core infrastructure.

---

## ✅ Phase 1: Structure & Organization

- [ ] **Directory Structure**
  - [ ] `/repo/` folder exists with database queries
  - [ ] `/service/` folder exists with business logic
  - [ ] `/router/` folder exists with HTTP handlers
  - [ ] `/dto/` folder exists with validation schemas
  - [ ] `index.ts` exports all public APIs

- [ ] **Naming Consistency**
  - [ ] Files use lowercase with hyphens: `user.repo.ts`, `user.service.ts`
  - [ ] Classes use PascalCase: `UserService`, `UserRepo`
  - [ ] Methods use camelCase: `handleCreate()`, `getById()`
  - [ ] DTOs end with `Dto`: `UserCreateDto`, `UserUpdateDto`
  - [ ] Constants use UPPERCASE: `SYSTEM_ROLES`, `IAM_CONFIG`

- [ ] **Layer Dependency**
  - [ ] Service instantiates Repo in constructor
  - [ ] Router calls Service methods only
  - [ ] No circular dependencies between modules
  - [ ] Lower layers don't know about higher layers

---

## ✅ Phase 2: Type Safety

- [ ] **TypeScript Strict Mode**
  - [ ] No `any` types (except approved cases with comments)
  - [ ] All function parameters typed
  - [ ] All return types explicit
  - [ ] Generics used properly (no lost type inference)

- [ ] **Zod Validation**
  - [ ] DTOs use Zod schemas
  - [ ] Schemas use spread-shape pattern: `z.object({ ...BaseDto.shape, ...NewFields.shape })`
  - [ ] No `.extend()` chains (breaks inference)
  - [ ] Input validation at route level
  - [ ] Response validation matches schema

- [ ] **Null/Undefined Handling**
  - [ ] Explicit optional types: `SomeType | null` not `SomeType?`
  - [ ] No sneaky optional chaining without checks
  - [ ] Error thrown for expected values

---

## ✅ Phase 3: Error Handling

- [ ] **Error Classes**
  - [ ] Uses core error classes: `NotFoundError`, `ConflictError`, `UnauthorizedError`
  - [ ] Custom errors extend `HttpError` (or use error factories)
  - [ ] Error codes match HTTP status: 404 for NotFound, 409 for Conflict
  - [ ] Error messages are clear and helpful

- [ ] **Service Methods**
  - [ ] Throws errors instead of returning `null/undefined`
  - [ ] Error handling delegated to framework, not middleware

- [ ] **Route Handlers**
  - [ ] Route handlers don't catch errors (framework does)
  - [ ] Use `auth: true` for protected endpoints
  - [ ] Validation errors converted to 422/400

---

## ✅ Phase 4: Database & Caching

- [ ] **Repository**
  - [ ] Methods organized: QUERY, MUTATION, PRIVATE sections
  - [ ] All mutations wrapped in transactions where needed
  - [ ] Uses `record()` wrapper from OpenTelemetry
  - [ ] Drizzle typed correctly (no `as any` casts)

- [ ] **Service Caching**
  - [ ] Uses `bento.namespace()` for cache isolation
  - [ ] Cache keys from constants (not hardcoded strings)
  - [ ] Cache invalidation on all mutations
  - [ ] `getOrSet()` pattern for lazy loading

- [ ] **Query Optimization**
  - [ ] Batch operations prefer single query + loop over N queries
  - [ ] Uses `inArray()` for bulk filters
  - [ ] Pagination uses parallel data + count
  - [ ] Search uses `searchFilter()` helper

---

## ✅ Phase 5: Validation & Conflict Checking

- [ ] **Input Validation**
  - [ ] All routes have `body` or `query` validation with Zod
  - [ ] Email/username validated with `zc.email`, `zc.username`
  - [ ] Passwords validated with `zc.password` (min 8 chars)

- [ ] **Uniqueness Checking**
  - [ ] CREATE: uses `checkConflict()` without `existing`
  - [ ] UPDATE: uses `checkConflict()` with `existing` parameter
  - [ ] Error messages and codes per-field

- [ ] **Audit Trails**
  - [ ] All writes include `createdBy`/`updatedBy` (actor ID)
  - [ ] Uses `stampCreate()` and `stampUpdate()` helpers
  - [ ] Timestamps set to database time (not client time)

---

## ✅ Phase 6: HTTP & Routes

- [ ] **Route Handlers**
  - [ ] Inline async functions with explicit names: `async function create({ body, auth }) { ... }`
  - [ ] Method names describe action: `list`, `detail`, `create`, `update`, `delete`
  - [ ] Routes grouped logically: GET /list, POST /create, PUT /:id, DELETE /:id

- [ ] **Response Format**
  - [ ] Single object: `res.ok(data)`
  - [ ] List response: `res.paginated(result)`
  - [ ] Created: `res.created(data)`
  - [ ] No content: `res.noContent()` (returns undefined)

- [ ] **Authentication**
  - [ ] Protected routes have `auth: true` in options
  - [ ] Public routes omit `auth: true` (or explicitly `auth: false`)
  - [ ] Uses `auth.userId` for actor ID in service calls

---

## ✅ Phase 7: Utilities & Helpers

- [ ] **Service Utilities**
  - [ ] Reusable logic extracted to helper functions
  - [ ] No duplicated code between methods
  - [ ] Large methods broken into smaller ones

- [ ] **Type Aliases**
  - [ ] Common types exported from DTOs
  - [ ] Type inference preserved (no unnecessary `as` casts)
  - [ ] Generics used for reusable patterns

- [ ] **Constants**
  - [ ] Magic numbers extracted to `constants.ts`
  - [ ] Cache keys defined (not hardcoded)
  - [ ] Role IDs and system values centralized

---

## ✅ Phase 8: Testing

- [ ] **Unit Tests**
  - [ ] Service methods tested with mocked repos
  - [ ] Edge cases covered (empty arrays, null values)
  - [ ] Error scenarios tested (missing records, conflicts)

- [ ] **Integration Tests** (if applicable)
  - [ ] Full route tested with real service
  - [ ] Auth scenarios: authenticated, unauthenticated, forbidden
  - [ ] Validation errors caught (400/422)

- [ ] **Test Organization**
  - [ ] Tests colocated with code (`.test.ts` next to `.ts`)
  - [ ] Test name matches function: `describe('UserService')`, `it('should create user')`
  - [ ] Clear arrange-act-assert pattern

---

## ✅ Phase 9: Documentation & Comments

- [ ] **JSDoc Comments**
  - [ ] Public functions have brief description
  - [ ] Complex logic has comment explaining WHY (not WHAT)
  - [ ] Examples provided for non-obvious patterns

- [ ] **Type Documentation**
  - [ ] DTOs documented if purpose isn't obvious
  - [ ] Error codes documented (what triggers them)

- [ ] **README or Docs**
  - [ ] Module purpose documented
  - [ ] Key entities/concepts explained
  - [ ] Example requests shown for main endpoints

---

## ✅ Phase 10: Quality Checks

- [ ] **Linting**
  - [ ] `bun run lint` returns 0 errors, 0 warnings for this module
  - [ ] No unused imports
  - [ ] No unused variables

- [ ] **Type Checking**
  - [ ] All TypeScript compiles without errors
  - [ ] No `any` types or `!` null assertions without comments
  - [ ] Generics properly constrained

- [ ] **Performance**
  - [ ] No N+1 queries (use batch operations or joins)
  - [ ] Cache utilized for frequently accessed data
  - [ ] Pagination enforced for list endpoints (max 100 items)

- [ ] **Security**
  - [ ] No SQL injection (Drizzle prevents this)
  - [ ] No XSS (backend doesn't render HTML)
  - [ ] No auth bypass (all protected routes have `auth: true`)
  - [ ] No secrets in code (use environment variables)

---

## 📊 Scoring

Count checkmarks in each phase:

```
Phase 1 (Structure):    __ / 11
Phase 2 (Type Safety):  __ / 9
Phase 3 (Errors):       __ / 7
Phase 4 (DB/Cache):     __ / 9
Phase 5 (Validation):   __ / 9
Phase 6 (HTTP):         __ / 9
Phase 7 (Utilities):    __ / 7
Phase 8 (Testing):      __ / 8
Phase 9 (Docs):         __ / 7
Phase 10 (Quality):     __ / 8

TOTAL:                  __ / 84
```

### Score Interpretation
- **84/84** - Production-ready, gold standard
- **75-83** - Excellent, ship with confidence
- **65-74** - Good, minor improvements recommended
- **55-64** - Needs work, address before shipping
- **<55** - Significant issues, revise before merge

---

## 🎯 Common Issues to Watch For

### ❌ Anti-patterns to Avoid

1. **Service calls repository multiple times for same data**
   ```typescript
   // ❌ BAD: 2 DB calls
   const user = await repo.getById(id)
   const assignments = await repo.getByUser(user.id)
   
   // ✅ GOOD: 1 DB call
   const user = await repo.getById(id, { includeAssignments: true })
   ```

2. **Loose error handling**
   ```typescript
   // ❌ BAD: returns null, caller has to handle
   const user = await repo.getById(id) ?? null
   
   // ✅ GOOD: throws, caller knows to expect error
   const user = await repo.getById(id)
   if (!user) throw NotFoundError('User', id)
   ```

3. **No cache invalidation on updates**
   ```typescript
   // ❌ BAD: Update succeeds but read cache is stale
   await repo.update(id, data)
   // Cache still has old data!
   
   // ✅ GOOD: Clear cache on mutation
   await repo.update(id, data)
   await cache.delete(IAM_CACHE_KEYS.USER_DETAIL(id))
   ```

4. **Generic type inference lost**
   ```typescript
   // ❌ BAD: Using .extend() breaks inference
   const UserDto = BaseDto.extend({ username: z.string() })
   
   // ✅ GOOD: Using spread preserves inference
   const UserDto = z.object({ ...BaseDto.shape, username: z.string() })
   ```

5. **Hardcoded cache keys**
   ```typescript
   // ❌ BAD: String scattered everywhere
   await cache.delete('user.detail.123')
   
   // ✅ GOOD: Centralized, type-safe
   await cache.delete(USER_CACHE_KEYS.DETAIL(userId))
   ```

---

## 📝 Review Template

When reviewing a module, use this summary:

```markdown
# Module Review: [ModuleName]

## Overall Assessment
⭐⭐⭐⭐⭐ (1-5 stars)

## Strengths
- [List 3-5 things done well]

## Issues Found
- [List critical issues]

## Recommendations
- [List improvements for next PR]

## Checklist Summary
- Structure & Organization: 10/11 ✓
- Type Safety: 8/9 ✓
- Error Handling: 7/7 ✓
- ...
- **Total: 75/84**

## Verdict
🟢 **Ready to ship** / 🟡 **Needs minor fixes** / 🔴 **Major revisions needed**
```

---

## 🚀 Next Steps

1. **Review all modules** in `src/modules/` using this checklist
2. **Create issue** for any `🔴 Major issues` found
3. **Create PR** for any `🟡 Minor fixes` (consistent with core standards)
4. **Document results** in module-specific review files
5. **Update CLAUDE.md** with any new patterns discovered

---

**Baseline:** Core infrastructure review completed. It's 5/5 stars. Use it as template.
