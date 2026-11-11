# ADR-0018: Session storage — cache-first with Postgres as source of truth

**Status:** Accepted
**Revises:** ADR-0007 §1 (session behind a port, memory/Redis adapter — that stands; this ADR adds a durable backing store behind it)

**Context:** ADR-0007 put sessions behind a `SessionStore` port with an in-memory (now optionally Redis, per the Redis infra work) adapter as the *only* place a session lives. That's fine for pure request validation, but it rules out two things the product now needs: (1) surviving a cache eviction/restart without silently logging everyone out, and (2) per-user session management — listing active sessions and revoking a specific device ("log out from another device"), which requires an enumerable, queryable record with device metadata that a cache alone can't hold.

**Decision:** `sessions` in Postgres (already existed in schema/migrations but was unused since ADR-0007's port switch — now repurposed) is the source of truth, holding `id`, `userId`, `userAgent`, `ipAddress`, `createdAt`, `lastSeenAt`, `expiresAt`, `revokedAt`. `SessionStore` (memory/Redis) stays as a fast-path cache in front of it:

- **Login:** write-through — insert the DB row, then populate the cache.
- **Per-request validation:** cache hit → proceed (no DB touch, same as before). Cache miss → fall back to a `SessionRepo` lookup in Postgres; if the row is valid (not revoked, not expired), rehydrate the cache and proceed; otherwise 401.
- **Logout / revoke:** write to both — revoke the DB row and evict the cache key, so revocation is immediate rather than waiting out the cache TTL.
- **`last_seen_at`:** throttled via the cache itself (a short-TTL debounce key), so the write happens at most once per `SESSION_LAST_SEEN_THROTTLE_SECONDS` and never blocks the request — the auth hot path still does zero synchronous DB writes.

This enables `GET /auth/sessions/list`, `DELETE /auth/sessions/revoke`, and `DELETE /auth/sessions/revoke-others` (list/revoke-one/revoke-all-but-current), all reading/writing the DB directly since that's the enumerable source of truth.

**Consequences:** One extra DB round-trip on cache miss (rare — restart, eviction, first-ever request for that session), never on the happy path. Revocation is immediate everywhere instead of "eventually, when the cache TTL expires." The token itself is stored as-is in `sessions.id` (not hashed) — an intentional simplification for now per product direction; revisit if session storage security becomes a concern.
