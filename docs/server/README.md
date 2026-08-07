# Server Documentation

Index for Ikki ERP backend architecture and code standards.

## Quick Facts

- **Runtime**: Bun · **Framework**: Elysia · **ORM**: Drizzle
- **Validation**: Zod via shared primitives `zp` (output), `zc` (input), `zq` (query, coerced)
- **Layout**: vertical-slice modules under `src/modules/{name}/`
- **Two shapes**: simple (flat files, e.g. `location/`) and complex (per-entity folders + `composed/`, e.g. `iam/`)
- **Layering**: modules import downward only (aggregators → operations → master data → core)
- **Repo contract**: reads return `T | undefined`; writes return `EntityRef | undefined`; every write takes `db?` for transactions
- **Service contract**: `handleX` = the only route entrypoints; typed errors; audit stamps + cache invalidation on every mutation
- **Routes**: thin `new Elysia({ prefix })` + `authPluginMacro`; validate → one `handleX` → wrap in `res.*`

## Documents

| File                                                     | Purpose                                        |
| -------------------------------------------------------- | ---------------------------------------------- |
| [01-server-architecture.md](./01-server-architecture.md) | System design, layering, infra                 |
| [02-module-standard.md](./02-module-standard.md)         | Module structure (source of truth)             |
| [03-code-standard.md](./03-code-standard.md)             | Naming, imports, TS style, HTTP rules          |
| [04-code-patterns.md](./04-code-patterns.md)             | Zod, service, repo, cache patterns             |
| [05-module-checklist.md](./05-module-checklist.md)       | Step-by-step module build guide                |
| [06-module-map.md](./06-module-map.md)                   | Complete module registry, layers, dependencies |

## Module Dependency Layers

```
Layer 3  Aggregators   dashboard, reporting
Layer 2  Operations    pos, inventory, production, finance, hr, crm
Layer 1  Master data   iam, location, material, menu, uom, supplier, recipe, payment-method
Layer 0  Core          auth, company, audit
```

Lower layers cannot import from upper layers. Same-layer cross-references are OK.

---

**Next:** [01-server-architecture.md](./01-server-architecture.md) — System design.
