# Caching Strategy

Cache design optimized for Neon PostgreSQL (serverless, remote, cold-start aware).

## Why Cache Aggressively

| Neon constraint                             | Cache benefit                |
| ------------------------------------------- | ---------------------------- |
| Every query = network round-trip (~20-50ms) | Cache hit = 0ms (in-memory)  |
| Cold start after idle (~1-3s)               | Warm cache survives DB sleep |
| Compute cost per query                      | Fewer queries = lower bill   |
| Connection pool limits (freemium)           | Less pool pressure           |

## Cache Layer

**BentoCache with memory driver** (single server instance).

- In-process memory store via BentoCache's `memoryDriver`.
- Stampede protection built-in (only 1 factory call on concurrent cache miss).
- Grace period support (serve stale while refetching in background).
- Namespace per module (`cache.namespace('materials')`).
- Migrate path: swap to Redis driver when scaling to multi-instance (no app code change).
- Cleared on server restart.

## Invalidation Strategy: Hybrid

| Cache type               | Invalidation                                      | Rationale                                |
| ------------------------ | ------------------------------------------------- | ---------------------------------------- |
| Entity by ID             | **Event-based** (immediate on mutation)           | Must be fresh — user just edited it      |
| Reference data lists     | **Event-based** (on mutation) + long TTL fallback | Rarely changes, must reflect edits       |
| Paginated/filtered lists | **TTL** (30-60 seconds)                           | Acceptable staleness, expensive to track |
| Aggregates/computed      | **TTL** (60-300 seconds)                          | Expensive to compute, slight lag OK      |

## Data Classification

### Tier 1: Near-Static (cache indefinitely, event-invalidate)

Data that almost never changes. Safe to keep in memory for the lifetime of the server.

| Data                           | Records | Change frequency                     |
| ------------------------------ | ------- | ------------------------------------ |
| Company settings               | 1       | Almost never                         |
| Locations                      | 2-10    | Rarely (new location is a big event) |
| Roles                          | 5-20    | Rarely                               |
| UoMs                           | 10-30   | Setup once, rarely touch             |
| UoM conversions                | 20-50   | Same as UoMs                         |
| Payment methods                | 5-15    | Rarely                               |
| Material categories            | 10-30   | Occasionally                         |
| Menu categories (per location) | 10-30   | Occasionally                         |

**Cache pattern:**

```
cache.getOrSet({
  key: 'locations:all',
  factory: () => repo.findAll(),
  // No TTL — lives until invalidated
})

// On mutation:
cache.delete('locations:all')
cache.delete(`locations:byId:${id}`)
```

### Tier 2: Moderate Change (cache by ID, event-invalidate)

Data that changes through user actions but is read much more than written.

| Data                    | Change frequency   | Read pattern                |
| ----------------------- | ------------------ | --------------------------- |
| Users                   | Occasionally       | Auth check every request    |
| Materials               | Weekly             | Recipe lookups, stock views |
| Suppliers               | Monthly            | Receiving forms             |
| Menu items              | Weekly             | POS order screen            |
| Modifier groups/options | Weekly             | POS order screen            |
| Recipes + lines         | Weekly             | Auto-deduct on sale         |
| Employees               | Monthly            | Attendance, payroll         |
| Accounts (CoA)          | Rarely after setup | Journal creation            |

**Cache pattern:**

```
// By ID (event-invalidated)
cache.getOrSetWithSkip({
  key: `materials:byId:${id}`,
  factory: () => repo.findById(id),
})

// List for a location (event-invalidated)
cache.getOrSet({
  key: `menu-items:location:${locationId}`,
  factory: () => repo.findByLocationId(locationId),
})

// On mutation:
cache.invalidateStandard(id)  // clears byId + list keys
```

### Tier 3: Frequently Changing (short TTL or no cache)

Data that changes with every transaction. Caching has limited value.

| Data                    | Change frequency         | Cache?                                  |
| ----------------------- | ------------------------ | --------------------------------------- |
| Orders (open)           | Constantly during shifts | No cache (or very short TTL)            |
| Stock balances          | Every sale/receiving     | TTL 10-30s for dashboard views          |
| Stock movements         | Every sale/receiving     | No cache (append-only, read historical) |
| Journal entries         | Every sale               | No cache for lists, byId OK             |
| Cashier shifts (active) | Per shift lifecycle      | Cache active shift only                 |
| Audit logs              | Every mutation           | No cache (write-heavy, rare reads)      |

**Cache pattern:**

```
// Stock balance — short TTL for dashboard
cache.getOrSet({
  key: `stock:balance:${locationId}:${materialId}`,
  ttl: 10_000,  // 10 seconds
  factory: () => repo.findBalance(locationId, materialId),
})

// Or skip cache entirely for real-time views
const balance = await repo.findBalance(locationId, materialId)
```

### Tier 4: Computed/Aggregated (TTL-based)

Pre-computed values for dashboards and reports.

| Data                             | TTL   | Trigger refresh                        |
| -------------------------------- | ----- | -------------------------------------- |
| HPP per menu item (per location) | 5 min | On material cost change or recipe edit |
| Revenue today (per location)     | 30s   | — (TTL only)                           |
| Low stock alerts                 | 60s   | — (TTL only)                           |
| Stock valuation                  | 5 min | — (TTL only)                           |

## Cache Key Convention

```
{module}:{entity}:{scope}:{identifier}

Examples:
  locations:all
  locations:byId:5
  menu-items:location:3
  materials:byId:12
  stock:balance:3:12          (location:3, material:12)
  recipes:byMenuItemId:45
  uom:conversions:all
  company:settings
  roles:all
  payment-methods:location:3
```

## Denormalization for Cache Efficiency

Some fields are denormalized (snapshot) to avoid joins and extra cache lookups:

| Table           | Denormalized Field | Avoids lookup to                          |
| --------------- | ------------------ | ----------------------------------------- |
| order_lines     | menu_item_name     | menu_items                                |
| order_lines     | unit_price         | menu_items (price at time of sale)        |
| order_lines     | modifiers (jsonb)  | modifier_groups + options                 |
| audit_logs      | user_name          | users                                     |
| stock_movements | cost_price         | stock_balances (cost at time of movement) |
| payslips        | base_salary        | employees (salary at time of calculation) |

These fields capture point-in-time values. When reading history, no join/cache needed.

## Batch Query Pattern

Instead of N individual queries, use batch lookups:

```ts
// ❌ Bad: N+1 queries
for (const line of orderLines) {
	const material = await materialService.getById(line.materialId)
}

// ✓ Good: 1 query, cache-friendly
const materialIds = orderLines.map((l) => l.materialId)
const materials = await materialService.getByIds(materialIds)
const materialMap = RelationMap.fromArray(materials, (m) => m.id)
```

`getByIds` internally: check cache for each ID → batch-query missing ones → cache individually.

## Cache Warming on Startup

On server start, pre-load Tier 1 data into memory:

```
1. Company settings
2. All locations
3. All roles
4. All UoMs + conversions
5. All payment methods
```

This eliminates cold-cache penalty for the most-used reference data. Takes <100ms total (small dataset).

## Implementation Notes

- Cache lives in service layer (not repo). Repo always hits DB.
- `cache.getOrSet` / `cache.getOrSetWithSkip` wrappers handle the pattern.
- `cache.invalidateStandard()` clears list + byId keys after every mutation.
- TTL enforcement via simple timestamp check on read (no background expiry thread).
- Memory limit: not a concern for this data scale (< 50MB even with all Tier 1+2 cached).

---

**Next:** [standards/readme.md](./standards/readme.md) — Database design conventions.
