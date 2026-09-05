# Read Convention (Lightweight CQRS) Spec

Separating reads from writes. Implements ADR-0004. Read [00-glossary.md](./00-glossary.md) first.

## Rule (one sentence)

> A read that is heavy or shaped differently from the write model lives in `read/` as a `read-query`: its own optimized `SELECT`, mapping rows straight to a response DTO, never touching the domain or write-service, never mutating. Reads and writes share the same tables — no projection tables.

## 1. When a read is a read-query vs a plain repo read

| Read | Where |
| --- | --- |
| Simple "by id" / "list" used by both reads and internal loads | repo port method (`findById`, `findPage`) — lives in `infra`, used by app |
| Heavy join / enriched view (order detail with lines + modifiers + payments) | `read/` read-query |
| Aggregate / dashboard / report | `read/` read-query |

A read-query is for **presentation reads**. A repo method is for **loads the write-use-case needs**. They may both exist; they do not share code.

## 2. Read-query template (normative)

```ts
// read/<view>.query.ts
export function make<View>Query(db: DbContext) {
  return async (params: <View>ParamsDto): Promise<<View>Dto> => {
    const rows = await db
      .select({ /* explicit projection */ })
      .from(<table>)
      .leftJoin(<other>, eq(...))
      .where(<filters>)
    return map<View>(rows)   // pure row → DTO mapping
  }
}
```

- Takes a plain `DbContext` (no UoW — reads never transact).
- Returns a **response DTO** (from `contract/`), not a domain entity.
- Mapping (`map<View>`) is a pure function; it may use `Money.of(...).toNumber()` at the boundary for display.

## 3. Wiring

Read-queries are instantiated in the module factory and exposed to `http` routes alongside use-cases:

```ts
// <domain>.module.ts (excerpt)
const useCases = { create: makeCreate(...), update: makeUpdate(...), ... }
const queries = { detail: makeOrderDetailQuery(db), dailySales: makeDailySalesQuery(db) }
const route = createOrderRoute(useCases, queries)
```

## 4. Hard rules

- Read-queries are **read-only**. No `insert`/`update`/`delete`, no `uow`.
- No projection/denormalized tables (ADR-0004). If reporting later needs them, that is a new ADR.
- A read-query never calls a write use-case or a domain rule; it is a straight query + mapping.
- Response shape comes from `contract/` DTOs so HTTP responses stay validated/consistent.

---

**Next:** [09-module-registry.md](./09-module-registry.md)
