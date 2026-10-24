# ADR-0007: Enforced Per-Route RBAC Macro

**Status:** Accepted
**Date:** 2026-09-05

## Context

The auth plugin resolves the full `AuthContext` (permissions, isOwner) for every request and helpers exist (`hasPermission`, `requirePermission`). But routes only declare `auth: true` (login check) — no route calls `requirePermission`. Permissions are loaded into context and then never checked. RBAC is effectively inactive: any authenticated user can call any endpoint. This is a P1 security defect.

## Decision

Add a declarative Elysia **RBAC macro** that a route uses to declare the permission it requires, e.g. `{ permission: 'location.create' }`. The macro runs before the handler, checks the permission against `AuthContext` (owner bypasses), and throws `ForbiddenError` if missing. Enforcement is mandatory: every mutating route declares a permission; read routes declare a read permission. A route with no permission declaration is a lint/review failure (except explicitly public routes: login, register, health).

## Alternatives Considered

- **Call `requirePermission` inside each handler.** Rejected: easy to forget (which is how we got here), and mixes authorization into business flow. A declarative macro makes the requirement visible in the route definition and impossible to silently omit.
- **Centralized permission table mapping routes → permissions.** Rejected: indirection that hides the requirement from the route; harder for the implementer to see what a route needs.

## Consequences

- **Easier:** each route states its permission inline; enforcement is automatic and uniform. The implementer copies `{ auth: true, permission: '<module>.<action>' }` per route.
- **Harder:** the permission vocabulary must be defined and kept in sync with IAM role permissions. Specified in Stage 2 RBAC spec (permission naming convention `<module>.<action>`).
- **Constraint:** the macro is the only sanctioned authorization mechanism; handlers do not do ad-hoc permission checks.
