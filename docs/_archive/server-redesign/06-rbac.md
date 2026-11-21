# RBAC Macro Spec

Enforced per-route authorization. Implements ADR-0007. Read [00-glossary.md](./00-glossary.md) first.

## Rule (one sentence)

> Every route declares the permission it requires via the RBAC macro; the macro enforces it before the handler runs. A mutating route with no permission declaration is a review failure.

## 1. Permission naming convention

`<module>.<action>` — lowercase, dot-separated. Actions map to HTTP verbs:

| Action | Used by | Example |
| --- | --- | --- |
| `read` | GET (list, detail) | `location.read` |
| `create` | POST | `location.create` |
| `update` | PUT | `location.update` |
| `delete` | DELETE | `location.delete` |
| `<verb>` | domain-specific operations | `pos-order.complete`, `pos-order.void`, `inventory-stock.adjust` |

The full permission vocabulary is the union of these across all modules; it is the source list for IAM role `permissions`. Owner role bypasses all checks (`isOwner`).

## 2. The macro (server/plugins/rbac.plugin.ts)

```ts
import { Elysia } from 'elysia'
import { authPlugin } from './auth.plugin.ts'         // resolves AuthContext (existing)
import { hasPermission } from '@/shared/auth/permission.ts'
import { ForbiddenError } from '@/shared/errors/http-error.ts'

/**
 * Adds a `permission` route option. When set, the request's AuthContext must
 * include that permission (owner bypasses) or the request is rejected 403.
 * `auth: true` (login required) is implied whenever `permission` is set.
 */
export const rbac = new Elysia({ name: 'rbac' })
  .use(authPlugin)
  .macro({
    permission(required: string) {
      return {
        beforeHandle({ auth }: { auth: import('@/shared/auth/permission.ts').AuthContext }) {
          if (!hasPermission(auth, required)) {
            throw new ForbiddenError('Insufficient permissions', {
              code: 'PERMISSION_DENIED',
              context: { required },
            })
          }
        },
      }
    },
  })
```

## 3. Route usage (normative)

```ts
// http/<entity>.route.ts
export function create<Entity>Route(uc: <Entity>UseCases) {
  return new Elysia({ prefix: '/<entity>' })
    .use(rbac)
    .get('/list', async ({ query }) => res.paginated(await uc.list(query)),
      { query: <Entity>FilterDto, permission: '<module>.read' })
    .get('/detail', async ({ query }) => res.ok(await uc.detail(query.id)),
      { query: zq.recordId, permission: '<module>.read' })
    .post('/create', async ({ body, auth }) => res.created(await uc.create(body, actorOf(auth))),
      { body: <Entity>CreateDto, permission: '<module>.create' })
    .put('/update', async ({ body, auth }) => res.ok(await uc.update(body, actorOf(auth))),
      { body: <Entity>UpdateDto, permission: '<module>.update' })
    .delete('/delete', async ({ query, auth }) => res.ok(await uc.remove(query.id, actorOf(auth))),
      { query: zq.recordId, permission: '<module>.delete' })
}
```

## 4. Public routes (the only exceptions)

`login`, `register`, `health` declare **neither** `auth` nor `permission`. Every other route declares a `permission`. There is no "logged-in but unauthorized" tier except these three.

## 5. Actor resolution

The handler derives the `Actor` from `auth` via a helper, so use-cases receive a typed actor (id + resolved name for audit — see [07](./07-audit-errors.md)).

```ts
// shared/auth/actor.ts
export function actorOf(auth: AuthContext): Actor {
  return { id: auth.userId, name: auth.userName, locationId: auth.locationId }
}
```

> This requires `AuthContext` to carry `userName`; the auth plugin must resolve and cache it alongside permissions (closes the empty-`userName` audit gap, ADR-0009).

## 6. Hard rules

- `permission` is declared on **every** route except the three public ones.
- Authorization happens **only** in the macro — handlers do not re-check permissions.
- Permission strings follow `<module>.<action>`; a new operation adds a new permission string to the vocabulary list (Stage 4 migration specs enumerate them per module).

---

**Next:** [07-audit-errors.md](./07-audit-errors.md)
