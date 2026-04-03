# Backend Standard: Router Layer (Layer 1)

This document defines the **Golden Path 2.0** standards for the Router layer within the Ikki ERP backend.

## 1. Handler Class Pattern

All route handlers must be organized into a class. This manages dependency injection (of the Service) and provides a clean namespace for handler methods.

```typescript
// ✅ CORRECT: Handler Class
class UserHandler {
  constructor(private service: UserService) {}

  async list({ query }: { query: dto.UserFilter }) {
    const result = await this.service.handleList(query)
    return res.paginated(result) // Consistent response format
  }
  // ...
}
```

## 2. Standard Handler Methods

Every handler should implement at least the following standard methods:

| Method Name | Return Type | Status Code |
| :--- | :--- | :--- |
| `list` | `res.paginated` | 200 OK |
| `detail` | `res.ok` | 200 OK |
| `create` | `res.ok` or `res.created` | 201 Created / 200 OK |
| `update` | `res.ok` | 200 OK |
| `remove` | `res.ok` | 200 OK |

## 3. Standard Response Factories (`res`)

Handlers must use the `res` utility from `@/core/http/response` to guarantee a consistent API response structure.

```typescript
import { res } from '@/core/http/response'

// Success Response
return res.ok(data) // { success: true, code: 'OK', data: { ... } }

// Paginated Response
return res.paginated(result) // { success: true, code: 'OK', data: [ ... ], meta: { ... } }
```

## 4. Elysia Route Definitions

Route definitions must be typed using Zod schemas for both input validation (`query`, `body`) and output documentation (`response`).

```typescript
import { createSuccessResponseSchema, createPaginatedResponseSchema, zRecordIdDto } from '@/core/validation'

export function initUserRoute(service: UserService) {
  const h = new UserHandler(service)

  return new Elysia({ name: 'iam.user' })
    .use(authPluginMacro)
    .get('/list', h.list.bind(h), {
      query: dto.UserFilter,
      response: createPaginatedResponseSchema(dto.User),
      auth: true, // Use authPluginMacro standard
    })
    .get('/detail', h.detail.bind(h), {
      query: zRecordIdDto,
      response: createSuccessResponseSchema(dto.User),
      auth: true,
    })
    // ...
}
```

## 5. Security & Authentication

- **`authPluginMacro`**: Always use the global `authPluginMacro` for routes that require authentication.
- **`auth: true`**: This macro ensures that `auth.userId` and `auth.isAuthenticated` are available in the handler context and that the request is authorized.
- **Role/Permission checks**: If additional authorization is needed, implement it at the beginning of the handler method.

## 6. Handler Signatures

Avoid using `any` in handler parameters. Use `z.infer` where possible, or clearly defined types.

```typescript
// ✅ CORRECT: strictly typed handler signature
async create({ body, auth }: { body: dto.UserCreate; auth: { userId: number } }) { ... }

// ❌ INCORRECT: generic objects or 'any'
async create(context: any) { ... }
```

---

> [!IMPORTANT]
> The **Router Layer** should focus on request transformation and response orchestration. Business logic should stay in the **Service Layer**.
