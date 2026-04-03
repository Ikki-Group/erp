# Backend Standard: Router Layer (Layer 1)

This document defines the **Golden Path 2.1** standards for the Router layer within the Ikki ERP backend. This standard promotes **Functional Route Definitions** for clarity, modularity, and less boilerplate code.

## 1. Functional Route Pattern

All routes should be defined using an inline functional approach within the Elysia instance. Avoid using separate Handler classes unless the logic is exceptionally complex and cannot be clearly represented inline.

```typescript
// ✅ CORRECT: Functional/Inline Handler
export function initMyDomainRoute(service: MyService) {
  return new Elysia({ prefix: '/my-domain' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.handleList(query)
        return res.paginated(result)
      },
      {
        query: MyFilterDto,
        response: createPaginatedResponseSchema(MyDto),
        auth: true,
      },
    )
}

// ❌ DEPRECATED: Class-based Handler
class MyHandler { ... }
```

## 2. Standard Handler Methods & Paths

The following naming conventions and paths must be used consistently across all domain routers:

| Method   | Path           | Action       | Description                                       |
| :------- | :------------- | :----------- | :------------------------------------------------ |
| `GET`    | `/list`        | `list`       | Paginated listing with filters.                   |
| `GET`    | `/detail`      | `detail`     | Single record detail (query param: `id`).         |
| `POST`   | `/create`      | `create`     | Resource creation.                                |
| `PATCH`  | `/update`      | `update`     | Full resource update (prefer `PATCH` over `PUT`). |
| `DELETE` | `/remove`      | `remove`     | Soft delete / archive (query param: `id`).        |
| `DELETE` | `/hard-remove` | `hardRemove` | Permanent deletion (Admin only).                  |

## 3. Schema Composition in Routes

Use Zod's spread-shape pattern directly in the route options for maximum clarity and to avoid defining redundant "RequestDTOs".

```typescript
    .patch(
      '/update',
      async function update({ body, auth }) {
        const { id, ...data } = body
        const result = await service.handleUpdate(id, data, auth.userId)
        return res.ok(result)
      },
      {
        body: LocationUpdateDto, // Use standardized DTOs
        response: createSuccessResponseSchema(zRecordIdDto),
        auth: true,
      },
    )
```

## 4. Response Factories (`res`)

Handlers must use the `res` utility from `@/core/http/response` to guarantee a consistent API response structure.

```typescript
import { res } from '@/core/http/response'

return res.ok(data) // { success: true, code: 'OK', data: { ... } }
return res.created(data) // { success: true, code: 'CREATED', data: { id: ... } }
return res.paginated(result) // { success: true, code: 'OK', data: [ ... ], meta: { ... } }
```

## 5. Security & Authentication

- **`authPluginMacro`**: Always use the global `authPluginMacro` for routes that require authentication.
- **`auth: true`**: This macro ensures that `auth.userId` is available in the handler context and that the request is authorized.

---

> [!IMPORTANT]
> The **Router Layer** should focus strictly on request/response orchestration. Business logic and database operations MUST remain in the **Service Layer**.
