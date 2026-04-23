# 📊 Architecture Diagrams & Visual Guides

---

## 1. Request-Response Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HTTP Client (Frontend/API)                         │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                        POST /api/users/create
                     {"username": "john", "email": "john@example.com"}
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🌐 ROUTER LAYER (HTTP)                              │
│                                                                               │
│  async function create({ body, auth }) {                                    │
│    ✓ Validates body against UserCreateDto schema                           │
│    ✓ Checks auth: true guard (authenticated user)                          │
│    ✓ Calls service.handleCreate(body, auth.userId)                         │
│    ✓ Formats response with res.created(data)                               │
│  }                                                                           │
│                                                                               │
│  Response Format: { success, code, data }                                   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                     service.handleCreate(data, actorId)
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      💼 SERVICE LAYER (Business Logic)                       │
│                                                                               │
│  1. Validate Uniqueness                                                     │
│     await checkConflict({                                                   │
│       table: usersTable,                                                    │
│       fields: [email, username],                                            │
│       input: { email, username }                                            │
│     })                                                                       │
│                                                                               │
│  2. Call Repository                                                         │
│     const user = await repo.create({                                        │
│       ...data,                                                              │
│       createdBy: actorId,                                                   │
│       createdAt: new Date()                                                 │
│     })                                                                       │
│                                                                               │
│  3. Invalidate Caches                                                       │
│     await cache.delete(USER_CACHE_KEYS.LIST)                               │
│                                                                               │
│  4. Return Result                                                           │
│     return user                                                             │
│                                                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                 repo.create({ username, email, createdBy, createdAt })
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🗃️  REPOSITORY LAYER (Data Access)                       │
│                                                                               │
│  return record('UserRepo.create', async () => {                             │
│    return db                                                                │
│      .insert(usersTable)                                                    │
│      .values(data)                                                          │
│      .returning()  // Return inserted record                                │
│  })                                                                         │
│                                                                               │
│  Wraps with:                                                                │
│  ✓ OpenTelemetry recording (telemetry)                                     │
│  ✓ Exception propagation (errors)                                          │
│                                                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
               INSERT INTO users (username, email, createdBy) VALUES (...)
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        🗄️  DATABASE (PostgreSQL)                             │
│                                                                               │
│  users table:                                                               │
│  ┌──────┬──────────┬──────────┬──────────────┬──────────┐                  │
│  │ id   │ username │ email    │ createdBy    │ createdAt │                  │
│  ├──────┼──────────┼──────────┼──────────────┼──────────┤                  │
│  │ 1    │ john     │ john@... │ 1            │ 2026-04-24 │                │
│  └──────┴──────────┴──────────┴──────────────┴──────────┘                  │
│                                                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                         Return: { id: 1, username, email, ... }
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🗃️  REPOSITORY LAYER (Returning)                          │
│                                                                               │
│  Returns inserted record to service                                         │
│                                                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                    user { id, username, email, createdBy, ... }
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      💼 SERVICE LAYER (Invalidation)                         │
│                                                                               │
│  await cache.delete(USER_CACHE_KEYS.LIST)                                  │
│                                                                               │
│  Returns user to router                                                     │
│                                                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                    return user { id, username, email, ... }
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🌐 ROUTER LAYER (Response)                          │
│                                                                               │
│  return res.created(user)                                                   │
│                                                                               │
│  {                                                                          │
│    "success": true,                                                         │
│    "code": "CREATED",                                                       │
│    "data": {                                                                │
│      "id": 1,                                                               │
│      "username": "john",                                                    │
│      "email": "john@example.com",                                           │
│      "createdBy": 1,                                                        │
│      "createdAt": "2026-04-24T10:30:00Z"                                    │
│    }                                                                        │
│  }                                                                          │
│                                                                               │
│  HTTP 201 Created                                                           │
│                                                                               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HTTP Client (Frontend)                              │
│                                                                               │
│  Receives 201 Created with user data                                        │
│  Updates UI with new user                                                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Layering & Dependencies

```
                                 Layer 3
                              Aggregators
           ┌──────────────────────────────────────────────────┐
           │  production  │  hr  │  dashboard  │  moka  │  tool │
           └──────────────────────┬───────────────────────────┘
                                  │ (depends on lower layers)
                                  ▼
                              Layer 2
                          Operations & Inventory
           ┌──────────────────────────────────────────────────┐
           │ inventory │ recipe │ sales │ purchasing │ reports │
           └──────────────────────┬───────────────────────────┘
                                  │ (depends on lower layers)
                                  ▼
                            Layer 1.5
                              Security
                           ┌─────────────┐
                           │    auth     │
                           └────────┬────┘
                                    │
                                    ▼
                              Layer 1
                          Master Data & Config
           ┌──────────────────────────────────────────────────┐
           │  iam  │ material │ supplier │ employee │ finance  │
           └──────────────────────┬───────────────────────────┘
                                  │ (depends on lower layers)
                                  ▼
                              Layer 0
                            Core Entities
                         ┌──────────────────┐
                         │  location product │
                         │  (no dependencies)│
                         └──────────────────┘
                                  │
                                  ▼
                           Shared Infrastructure
                    ┌─────────────────────────────────┐
                    │  @/core/* (available to all)     │
                    │  - cache                         │
                    │  - database                      │
                    │  - http                          │
                    │  - validation                    │
                    │  - utils                         │
                    │  - logger                        │
                    │  - telemetry                     │
                    └─────────────────────────────────┘

Import Rules:
✅ Layer N can import from Layer N-1, N-2, ... 0
❌ Layer N cannot import from Layer N+1 (no upward imports)
✅ All layers can import from @/core
✅ Use bun run check-deps to verify
```

---

## 3. Service Method Call Sequence

### Create Operation

```
┌────────────────────────────────────────────────────────────────┐
│ Router: POST /users/create                                     │
│ async function create({ body, auth }) {                        │
│   return service.handleCreate(body, auth.userId)               │
│ }                                                              │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│ Service: handleCreate(data, actorId)                           │
│ 1. Validate Uniqueness                                         │
│    checkConflict({ table, fields, input })  ──→  DB CHECK    │
│                                                                │
│ 2. Create Record                                               │
│    repo.create({...data, createdBy})  ──────→  DB INSERT     │
│                                                                │
│ 3. Invalidate Caches                                           │
│    cache.delete(LIST_KEY)  ────────────→  Cache CLEAR        │
│                                                                │
│ 4. Return Result                                               │
│    return user                                                 │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│ Router Response: res.created(user)                             │
│ {                                                              │
│   "success": true,                                             │
│   "code": "CREATED",                                           │
│   "data": { ... user data ... }                                │
│ }                                                              │
│ HTTP 201 Created                                               │
└────────────────────────────────────────────────────────────────┘
```

### Read Operation (with Caching)

```
┌────────────────────────────────────────────────────────────────┐
│ Router: GET /users/1                                           │
│ async function detail({ params }) {                            │
│   return service.handleDetail(params.id)                       │
│ }                                                              │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│ Service: handleDetail(id)                                      │
│                                                                │
│ 1. Check Cache                                                 │
│    cached = cache.get(DETAIL_KEY(id))                          │
│                                                                │
│    ├─→ Cache HIT ──→ Return cached ─────┐                    │
│    │                                      │                    │
│    └─→ Cache MISS                         │                    │
│         2. Query Database                 │                    │
│            user = repo.getById(id)  ─→ DB SELECT             │
│                                           │                    │
│            if (!user) throw NotFoundError │                    │
│                                           │                    │
│         3. Store in Cache                 │                    │
│            cache.set(DETAIL_KEY(id), user)                     │
│                                           │                    │
│         4. Return Result ──────────────┐  │                    │
│                                        │  │                    │
└────────────┬──────────────────────────┼──┴────────────────────┘
             │                          │
             └──────────────┬───────────┘
                            │ user data
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Router Response: res.ok(user)                                  │
│ {                                                              │
│   "success": true,                                             │
│   "code": "OK",                                                │
│   "data": { ... user data ... }                                │
│ }                                                              │
│ HTTP 200 OK                                                    │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Batch Operation Optimization

### Before: O(n+1) Calls
```
for each userId in userIds {
  getList({ userId })          ─→ Query 1
  replaceBulkByUserId()         ─→ Query 2
  ...repeated N times
}
Total: 2N queries
```

### After: O(2) Calls
```
1. getListByUserIds(userIds)   ─→ Query 1 (all users)
2. Build assignments in memory  ─→ No DB call
3. replaceBulkByUserIds()       ─→ Query 2 (all users)
Total: 2 queries
```

### Visual

```
❌ BEFORE (N = 100 users)
┌──────────────────────────────────────┐
│ User 1: DB Call 1, DB Call 2         │
│ User 2: DB Call 3, DB Call 4         │
│ User 3: DB Call 5, DB Call 6         │
│ ...                                  │
│ User 100: DB Call 199, DB Call 200   │
└──────────────────────────────────────┘
Total: 200 DB Calls (Slow!)

✅ AFTER (N = 100 users)
┌──────────────────────────────────────┐
│ DB Call 1: Get all 100 users         │
│ Memory: Process all 100              │
│ DB Call 2: Update all 100 at once    │
└──────────────────────────────────────┘
Total: 2 DB Calls (100x Faster!)
```

---

## 5. Error Handling Flow

```
┌─────────────────────────────────────┐
│ Service throws error                │
└────────────┬───────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Select error type:                  │
├─────────────────────────────────────┤
│ NotFoundError (404)                 │
│ ConflictError (409)                 │
│ UnauthorizedError (401)             │
│ ForbiddenError (403)                │
│ BadRequestError (400)               │
│ InternalServerError (500)           │
└────────────┬───────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Error propagates through Router      │
│ (Handler doesn't catch)             │
└────────────┬───────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Elysia Global Error Handler         │
│ Catches all HttpError types         │
└────────────┬───────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Convert to HTTP Response             │
│ {                                   │
│   "success": false,                 │
│   "code": "NOT_FOUND",              │
│   "message": "User #123 not found", │
│   "statusCode": 404                 │
│ }                                   │
└────────────┬───────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ HTTP 404 Not Found                  │
│ Sent to client                      │
└─────────────────────────────────────┘
```

---

## 6. Cache Invalidation Strategy

```
Read Operations:
┌────────────────────────────────────────┐
│ handleDetail(id)                       │
├────────────────────────────────────────┤
│ 1. cache.get(DETAIL_KEY(id))           │
│    └─→ If exists, return (no DB call)  │
│ 2. repo.getById(id)  (DB call)         │
│ 3. cache.set(DETAIL_KEY(id), data)    │
│ 4. return data                         │
└────────────────────────────────────────┘
                  ▲
                  │ Cache HIT
                  │ (90% of reads)
                  │
        Served from cache (fast!)

Write Operations:
┌────────────────────────────────────────┐
│ handleCreate(data, actorId)            │
├────────────────────────────────────────┤
│ 1. checkConflict(...)                  │
│ 2. repo.create(...)                    │
│ 3. cache.delete(LIST_KEY)              │
│    └─→ List cache invalidated          │
│ 4. return result                       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ handleUpdate(id, data, actorId)        │
├────────────────────────────────────────┤
│ 1. checkConflict(..., existing)        │
│ 2. repo.update(...)                    │
│ 3. cache.delete(LIST_KEY)              │
│    cache.delete(DETAIL_KEY(id))        │
│    └─→ Both caches invalidated         │
│ 4. return result                       │
└────────────────────────────────────────┘

Cache Key Structure:
ENTITY_CACHE_KEYS = {
  LIST: 'entity.list'                    ← Invalidated on any write
  DETAIL: (id) => `entity.detail.${id}`  ← Invalidated on that record write
  BY_EMAIL: (email) => `entity.email.${email}`  ← Custom pattern key
}
```

---

## 7. Type Safety Verification Flow

```
┌──────────────────────────────────────────┐
│ TypeScript Source Code                   │
│ (*.ts files)                             │
└────────────┬───────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ bun run typecheck                        │
│ (TypeScript compiler)                    │
├──────────────────────────────────────────┤
│ ✓ Checks all types                       │
│ ✓ Verifies generics                      │
│ ✓ Validates imports                      │
│ ✓ Prevents runtime type errors           │
└────────────┬───────────────────────────┘
             │
        ✓ Pass? │  ✗ Errors?
        ┌──────┴──────┐
        │             │
        ▼             ▼
    Compile      Fix types
    Succeed      (run typecheck again)
        │
        ▼
┌──────────────────────────────────────────┐
│ Zod Schema Validation (Runtime)          │
│ (At HTTP boundaries)                     │
├──────────────────────────────────────────┤
│ ✓ Validates request body                 │
│ ✓ Validates query parameters             │
│ ✓ Validates path parameters              │
│ ✓ Runtime type safety                    │
│ ✓ Clear error messages                   │
└────────────┬───────────────────────────┘
             │
        ✓ Valid? │  ✗ Invalid?
        ┌──────┴──────┐
        │             │
        ▼             ▼
    Continue      Return 422
    Handler       Validation Error
        │
        ▼
┌──────────────────────────────────────────┐
│ Type-Safe Throughout:                    │
│ - Request validated (Zod)                │
│ - Types checked (TypeScript)             │
│ - Database typed (Drizzle)               │
│ - Response typed (Service return)        │
├──────────────────────────────────────────┤
│ Result: No runtime type errors!          │
└──────────────────────────────────────────┘
```

---

## 8. Database Query Patterns

### Single Record (with error handling)
```
┌─────────────────┐
│ id = 123        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ db.select()                         │
│   .from(usersTable)                 │
│   .where(eq(usersTable.id, 123))   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Result: [user] or []                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ if (!user) throw NotFoundError       │
│ else return user                    │
└─────────────────────────────────────┘
```

### Multiple Records (Batch)
```
┌──────────────────────┐
│ ids = [1, 2, 3, 100] │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ db.select()                              │
│   .from(usersTable)                      │
│   .where(inArray(usersTable.id, ids))   │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ Result: [user1, user2, user3, user100]   │
│ (single query, not 4 queries!)           │
└──────────────────────────────────────────┘
```

### Paginated with Count
```
┌─────────────────────────┐
│ page = 1, limit = 20    │
└──────────┬──────────────┘
           │
           ├─────────────────────────┬─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐    Parallel
    │ SELECT * FROM    │    │ SELECT COUNT(*) │    Execution
    │ users LIMIT 20   │    │ FROM users       │
    │ OFFSET 0         │    │ WHERE ...        │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
      data: [20 users]      count: 547
             │                       │
             └───────────┬───────────┘
                         │
                         ▼
                  ┌─────────────────┐
                  │ {               │
                  │  data: [...],   │
                  │  meta: {        │
                  │   total: 547,   │
                  │   page: 1,      │
                  │   limit: 20,    │
                  │   pages: 28     │
                  │  }              │
                  │ }               │
                  └─────────────────┘
```

---

## 9. Dependency Injection Flow

```
┌────────────────────────────────┐
│ Module Creation                │
└────────────┬────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ In _registry.ts:                       │
│                                        │
│ const userRepo = new UserRepo()        │
│ const userService = new UserService(   │
│   userRepo  ← Injected dependency      │
│ )                                      │
│                                        │
│ Export for use in routes:              │
│ export { userService }                 │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ In route handler:                      │
│                                        │
│ import { userService } from @/registry │
│                                        │
│ async function create({ body, auth }) {│
│   const result = await userService     │
│     .handleCreate(body, auth.userId)   │
│ }                                      │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Service has repo injected:             │
│                                        │
│ class UserService {                    │
│   constructor(public repo = ...) {}    │
│                                        │
│   async handleCreate(...) {            │
│     const user = await this.repo       │
│       .create(...)  ← Uses injected    │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘

Benefits:
✓ Easy to test (mock repo)
✓ Explicit dependencies
✓ No circular imports
✓ Composable services
✓ Single responsibility
```

---

## 10. Testing Strategy

```
┌─────────────────────────────┐
│ Unit Test (Service)         │
└──────────┬──────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ const mockRepo = {                     │
│   getById: async (id) => ({            │
│     id, name: 'Test'                   │
│   }),                                  │
│   create: async (data) => ({           │
│     id: 1, ...data                     │
│   }),                                  │
│   ...                                  │
│ }                                      │
│                                        │
│ const service = new UserService(       │
│   mockRepo  ← Mocked                   │
│ )                                      │
│                                        │
│ // Test
│ expect(                                │
│   service.handleCreate(data, 1)        │
│ ).toBe(...)                            │
└──────────┬───────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Integration Test (Router)    │
└──────────┬──────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Make HTTP request                    │
│ POST /users/create                   │
│ {                                    │
│   "username": "test",                │
│   "email": "test@example.com"        │
│ }                                    │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Assert response:                     │
│ - Status code (201)                  │
│ - Response shape                     │
│ - Database was updated               │
│ - Cache was invalidated              │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Test Coverage:                       │
│ ✓ Happy path                         │
│ ✓ Error scenarios                    │
│ ✓ Edge cases                         │
│ ✓ Business logic                     │
└──────────────────────────────────────┘
```

---

## Legend

```
┌──────┐   = Component/Block
│      │
└──────┘

  ↓     = Data flow / Dependency
  
──→     = Process flow / Assignment

✓      = Success / Correct

✗      = Error / Problem

│      = Connection / Relationship

├─→    = Branch / Choice

└──    = Final step
```

