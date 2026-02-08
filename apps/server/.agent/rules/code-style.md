# Coding Style & Best Practices

## 1. Drizzle ORM Usage
- Use the `$dynamic()` method for queries that need to be extended (e.g., for pagination or filtering).
- Prefer `innerJoin` or `leftJoin` over separate queries when fetching related data.
- Use `and()`, `or()`, `eq()`, `ilike()` operators from `drizzle-orm`.
- Always type the result of counts: `const [result] = await db.select({ total: count() }).from(table)`.

## 2. Zod & Type Safety
- Centralize common schemas in `src/lib/zod.ts`.
- Module-specific schemas should be in `<module>.types.ts` within a `namespace` or as exported constants.
- Avoid using `any`; if necessary, cast to `unknown` first or use a proper interface.
- Use `z.infer<typeof Schema>` to keep TypeScript types in sync with Zod.

## 3. Response Standardization
- Every success response must follow the structure:
  ```json
  {
    "success": true,
    "code": "STRING_CODE",
    "data": { ... },
    "meta": { ... } // Optional (for pagination)
  }
  ```
- Use `res.ok()` or `res.paginated()` to ensure this structure.
- Never return sensitive fields like `passwordHash` in API responses. Use destructuring to omit them:
  ```typescript
  const { passwordHash: _, ...safeUser } = user;
  ```

## 4. Middleware & Hooks
- Logic that applies to multiple routes (like auth or logging) should be implemented as Elysia plugins or hooks (`onBeforeHandle`).
- Use `derive` to inject dependencies or data into the request context.

## 5. Environment Variables
- All environment variables must be defined in `src/config/env.ts` with Zod validation.
- Access environment variables via the `env` constant: `import { env } from '@/config/env'`.
