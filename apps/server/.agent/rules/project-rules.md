---
trigger: always_on
---

# Ikki ERP Project Rules for Antigravity

This document outlines the coding standards, architectural patterns, and development practices for the Ikki ERP server. Antigravity should adhere to these rules when assisting in development.

## 1. Project Context
- **Name**: Ikki ERP
- **Type**: Backend Server (API)
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: Drizzle ORM with PostgreSQL

## 2. Directory Structure
- `src/modules/`: Feature-based modules (e.g., `iam`, `locations`).
  - `router/`: Route definitions and controllers.
  - `service/`: Business logic.
  - `<module>.types.ts`: Zod schemas and TypeScript interfaces.
- `src/lib/`: Shared utilities, plugins, and core logic.
- `src/database/`: Database schema and connection setup.
- `src/config/`: App configuration and environment variables.

## 3. Development Patterns

### Route Definitions
- Use functional builders: `export function build<Feature>Route(service: <Service>) { ... }`.
- Always include `tags` for OpenAPI documentation.
- Use `res` utility (`src/lib/utils/response.util.ts`) for all API responses:
  - `res.ok(data, message)`
  - `res.created(data, message)`
  - `res.paginated(result)`
- Define request `body`, `query`, and `response` schemas using Zod.
- Response schemas should use `zResponse.ok()` or `zResponse.paginated()` from `src/lib/zod.ts`.

### Service Layer
- Use classes for services (e.g., `IamUsersService`).
- Use Drizzle `db` instance from `@/database` for database operations.
- Implement standard CRUD operations where applicable: `list`, `listPaginated`, `getById`, `create`, `update`, `delete`.
- Always use transactions (`db.transaction`) for operations affecting multiple rows or tables.
- Perform input sanitization (e.g., `toLowerCase()`, `trim()`) in the service layer.

### Authentication & Authorization
- Use the `authPlugin` for route protection.
- Protected routes: Add `isAuth: true` to the route options.
- Specific permissions: Add `hasPermission: 'permission.code'` to the route options.
- Access the current user via the `user` object in the handler context.

### Error Handling
- Use `HttpError` subclasses from `@/lib/error/http` for API errors.
- Common errors: `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`.
- Always provide a unique error code (e.g., `USER_NOT_FOUND`).

## 4. Coding Standards & Conventions
- **Naming**:
  - Files: `kebab-case.ts`
  - Classes: `PascalCase`
  - Variables/Functions: `camelCase`
  - Database Tables: snake\_case
  - Database Columns: camelCase
- **Imports**: Use absolute paths with the `@/` alias.
- **Types**: Use Zod for runtime validation and infer TypeScript types from those schemas.
- **Durations**: Use `ms` library for time-related strings (e.g., `ms('7d')`).
