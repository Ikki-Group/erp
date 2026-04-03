# Backend Standard: Error & Validation

This document defines the standards for error handling and validation within the Ikki ERP backend.

## 1. Input Validation (Layer 1)

Input validation must be handled at the **Router Layer** using **Zod** schemas. This prevents invalid or malicious data from reaching the Service layer.

```typescript
.post('/create', async function create({ body, auth }) { ... }, {
  body: dto.UserCreateDto, // Unified Zod schema
  response: createSuccessResponseSchema(zRecordIdDto),
  auth: true,
})
```

## 2. Business Validation (Layer 0)

Logic validation that depends on the database or application state must be handled at the **Service Layer**.

- **Consistency**: Use `@/core/database/conflict-checker` to avoid database-level unique constraint violations.
- **Rules**: Explicitly check for business rules (e.g., "Role cannot be deleted if assigned to users") and throw descriptive errors.

## 3. Standard Error Classes

Always use the custom error classes from `@/core/http/errors` to ensure consistent HTTP status codes and error responses across the API.

| Error Class | HTTP Status | Use Case |
| :--- | :---: | :--- |
| `ConflictError` | 409 | Duplicate identifiers (e.g. email, code). |
| `NotFoundError` | 404 | Resource not found. |
| `UnauthorizedError` | 401 | Missing or invalid auth credentials. |
| `ForbiddenError` | 403 | Authenticated but lack specific permissions. |
| `ValidationError` | 422 | Fine-grained business logic failure. |

## 4. Error Code Standard

Each error should include a unique **Error Code** in `UPPER_SNAKE_CASE` to enable frontend mapping for localized messages.

```typescript
throw new ConflictError('Email already exists', 'USER_EMAIL_ALREADY_EXISTS')
```

## 5. Error Tracing

Avoid catching and silencing errors unless you are translating them into a domain-specific error. Let the **Elysia Centralized Error Handler** catch and log them for better observability.

```typescript
// Let the error bubble to the global handler
const first = core.takeFirstOrThrow(rows, `User ${id} not found`, 'USER_NOT_FOUND')
```

## 6. Type-Safe Validation Styles

- **`z.string().trim()`**: Always use trim for string inputs to prevent whitespace-only values.
- **`z.coerce.number()`**: Use coercion for inputs coming from query parameters or form-data that may arrive as strings.
- **`z.enum([...])`**: Use for fixed sets of constant values (e.g., Status, Type).

---

> [!TIP]
> The goal of **Perfect Validation** is to fail fast and provide high-quality feedback to the client. Always accompany errors with machine-readable codes.
