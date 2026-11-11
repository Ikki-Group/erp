# T-001: Neon WebSocket DB client + `DbContext`/`Tx` types

**Tracker row:** P0.1
**Depends on:** —
**Type:** foundation

## Goal
`infra/database/client.ts` exports a Drizzle `db` backed by the Neon **serverless (WebSocket)** driver, plus `DbContext` and `Tx` types. Real transactions are now possible.

## Read first
- [02-transaction-uow.md](../02-transaction-uow.md) §1

## Build
1. Add deps if missing: `@neondatabase/serverless`, `ws`. Keep `drizzle-orm`.
2. Create `infra/database/client.ts` exactly as in spec 02 §1: `Pool` + `drizzle(pool, { schema })`, `neonConfig.webSocketConstructor = ws`.
3. Export `db`, `type DbContext`, `type Tx`.
4. Keep the existing query helpers (`takeFirst`, `toLimitOffset`, `buildPaginationMeta`, `allOf`, `eqIf`, `searchAcross`, etc.) — move them beside the new client if needed. **Delete** the old no-op `withTransaction`.

## Definition of done
- `db.transaction(fn)` works (a thrown error inside rolls back).
- `Tx` is usable as a repo `cx` param type.
- Self-check test: insert a row inside `db.transaction`, throw, assert the row is absent.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
This replaces `neon-http`. Every repo will type its DB param `cx: DbContext | Tx`. Do not leave `withTransaction` around — its existence invites the old no-op pattern.
