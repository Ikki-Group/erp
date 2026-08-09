# Web Frontend Documentation

Architecture, patterns, and conventions for `apps/web` — the Ikki ERP frontend built with React 19, TanStack Router, and TanStack Query.

> **Status:** These are **design blueprints** — the target architecture for implementation. The current `apps/web` is a fresh scaffold (routes placeholder, shadcn primitives only). Use these docs as the spec to build toward, following the build order in `01-architecture.md`.

## Layout

| Document                                             | Purpose                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| [01-architecture.md](./01-architecture.md)           | Tech stack, layer diagram, key decisions                        |
| [02-project-structure.md](./02-project-structure.md) | Folder conventions, feature modules, route files                |
| [03-api-layer.md](./03-api-layer.md)                 | HTTP client, endpoint registry, query/mutation factories        |
| [04-state-management.md](./04-state-management.md)   | Auth context, location context, server state via TanStack Query |
| [05-routing.md](./05-routing.md)                     | Router setup, layout routes, auth guards, location params       |
| [06-ui-patterns.md](./06-ui-patterns.md)             | Component sources, forms, tables, error/loading states          |

## Quick Reference

| Task                               | Read first                          |
| ---------------------------------- | ----------------------------------- |
| Understanding overall architecture | `01-architecture.md`                |
| Adding a new feature module        | `02-project-structure.md`           |
| Wiring an API endpoint             | `03-api-layer.md`                   |
| Auth or location context           | `04-state-management.md`            |
| Adding routes or pages             | `05-routing.md`                     |
| Building UI (forms, tables, etc.)  | `06-ui-patterns.md`                 |
| Server module patterns             | `docs/server/02-module-standard.md` |
| Product requirements               | `docs/product/01-vision.md`         |

## Principles

1. **Server is source of truth.** Contracts, DTOs, and endpoint URLs originate in `apps/server`. Web consumes them.
2. **Feature-first organization.** Business logic lives in `src/features/{module}/`, not scattered across generic folders.
3. **Thin routes.** Route files handle loading/layout. Business logic stays in features.
4. **ReUI-first components.** Use ReUI registry for complex UI. Shadcn/base-ui as fallback for primitives.
5. **Location-aware by design.** Pages are either global or location-scoped. The location context drives data filtering.

---

**Next:** [01-architecture.md](./01-architecture.md) — Tech stack and architectural decisions.
