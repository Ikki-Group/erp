---
inclusion: fileMatch
fileMatchPattern: 'apps/server/**'
---

# Server Development

Guide for building and modifying `apps/server` features.

## Required Reading

Before creating or modifying a module, read these docs in order:

1. #[[file:docs/server/06-module-map.md]] — module registry, layers, dependencies
2. #[[file:docs/server/02-module-standard.md]] — file structure (source of truth)
3. #[[file:docs/server/04-code-patterns.md]] — copy-ready code snippets
4. #[[file:docs/server/03-code-standard.md]] — naming, imports, TS style

For domain context:

- #[[file:docs/product/readme.md]] — product index (find the relevant PRD)
- #[[file:docs/database/readme.md]] — database index (find the relevant ERD)
- #[[file:docs/database/caching.md]] — which data to cache and how

## Verification Gate

Run before finishing any server work:

```bash
bun run verify  # from apps/server/
```

Runs: oxlint (type-aware) + tsc --noEmit + knip + check-deps.

## Non-Negotiable Rules

1. **Vertical slice** — every module owns its schema/repo/service/route/internal/module files.
2. **Spread-shape** for Zod — never `.extend()`.
3. **Repos never throw** — return `T | undefined`. Service handles errors.
4. **Routes are thin** — validate → one `handleX` → `res.*` wrapper.
5. **`import type`** for type-only imports (verbatimModuleSyntax enforced).
6. **Stamp every mutation** — `stampCreate(actorId)` / `stampUpdate(actorId)`.
7. **Invalidate cache after every write** — `this.cache.invalidateStandard(id?)`.
8. **No upward imports** — Layer 2 can import Layer 1, never vice versa.
9. **Cross-module via service** — never import another module's repo or internal files.
10. **No `db:generate` / `db:migrate`** unless user explicitly asks.
