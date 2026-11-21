# ADR-0008: Native Postgres Boolean

**Status:** Accepted
**Date:** 2026-09-05

## Context

Boolean fields (`isActive`, `isEnabled`, ...) are stored as `integer` `0/1` across the schema. Every write converts `isActive ? 1 : 0` in the service and every read converts `row.isActive === 1` in the repo. This is repeated boilerplate and a recurring bug surface (a forgotten conversion yields a wrong value or a type error).

## Decision

Use native Postgres `boolean` columns (`boolean('is_active').notNull().default(true)`). Drizzle maps these to TS `boolean` directly — no conversion in service or repo. This is a breaking schema change; since the project is pre-production with no data to preserve, migrations are regenerated from the new schema.

## Alternatives Considered

- **Keep `integer 0/1`, centralize conversion in a helper.** Rejected: still boilerplate at every boundary and still forgettable; native boolean removes the conversion entirely.
- **Keep `integer` for existing tables, `boolean` for new ones.** Rejected: two conventions is worse than one; the redesign explicitly allows breaking changes.

## Consequences

- **Easier:** no boolean conversions anywhere; DTOs and rows agree on `boolean`. Less code for the implementer to write and get wrong.
- **Harder:** a full migration regeneration. Acceptable — no production data.
- **Constraint:** all new schema uses `boolean`; the migration spec (Stage 4) lists every column to convert.
