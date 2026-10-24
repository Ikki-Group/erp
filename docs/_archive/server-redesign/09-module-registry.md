# Declarative Module Registry Spec

Replacing hand-written DI. Implements ADR-0010. Read [00-glossary.md](./00-glossary.md) first.

## Rule (one sentence)

> Each module exports a descriptor declaring its name, layer, and dependencies (by module name). A composer resolves them in dependency order, instantiates each once, and mounts routes. Adding a module = one descriptor entry.

## 1. Module descriptor (normative)

```ts
// shared/module/registry.ts
export interface ModuleContext {
  db: DbContext
  uow: UnitOfWork
  cache: CachePort
  events: EventBusPort
  auditPort: AuditPort
}

export interface ModuleDescriptor {
  name: string                 // e.g. 'pos'
  layer: 0 | 1 | 2 | 3         // dependency tier (see 01-architecture)
  dependsOn: string[]          // module names, same or lower layer only
  /** Build the module. `deps` holds the already-built modules named in dependsOn. */
  create(ctx: ModuleContext, deps: Record<string, BuiltModule>): BuiltModule
}

export interface BuiltModule {
  route?: import('elysia').Elysia   // mounted if present
  // public surface other modules may consume (use-cases / ports), e.g.:
  api?: Record<string, unknown>
}
```

## 2. A module's descriptor (in `<domain>.module.ts`)

```ts
export const posModule: ModuleDescriptor = {
  name: 'pos',
  layer: 2,
  dependsOn: ['location', 'payment-method', 'company', 'menu', 'recipe', 'inventory', 'uom', 'material'],
  create(ctx, deps) {
    const orderRepo = new OrderRepoDrizzle(ctx.db)
    const useCases = {
      completeOrder: makeCompleteOrder({
        uow: ctx.uow, orderRepo, auditPort: ctx.auditPort, cache: ctx.cache, events: ctx.events,
        deductStock: (deps.inventory.api as InventoryApi).deductStock,   // atomic effect, sync
        incrementVoucherUsage: ...,
      }),
      // ...
    }
    const queries = { detail: makeOrderDetailQuery(ctx.db) }
    return { route: createOrderRoute(useCases, queries), api: { /* nothing exported upward */ } }
  },
}
```

## 3. The composer

```ts
// shared/module/compose.ts
export function composeModules(descriptors: ModuleDescriptor[], ctx: ModuleContext): Map<string, BuiltModule> {
  const byName = new Map(descriptors.map((d) => [d.name, d]))
  const built = new Map<string, BuiltModule>()
  const visiting = new Set<string>()

  function build(name: string): BuiltModule {
    const existing = built.get(name)
    if (existing) return existing
    if (visiting.has(name)) throw new Error(`Module dependency cycle at "${name}"`)
    const d = byName.get(name)
    if (!d) throw new Error(`Unknown module dependency "${name}"`)
    visiting.add(name)
    const deps: Record<string, BuiltModule> = {}
    for (const dep of d.dependsOn) {
      const depDesc = byName.get(dep)
      if (depDesc && depDesc.layer > d.layer) {
        throw new Error(`Upward dependency: "${name}" (L${d.layer}) → "${dep}" (L${depDesc.layer})`)
      }
      deps[dep] = build(dep)     // topological: dependency built first
    }
    const module = d.create(ctx, deps)
    built.set(name, module)
    visiting.delete(name)
    return module
  }

  for (const d of descriptors) build(d.name)
  return built
}
```

## 4. app.ts (after)

```ts
const ctx: ModuleContext = { db, uow, cache, events, auditPort }
const modules = composeModules(ALL_MODULE_DESCRIPTORS, ctx)

let app = base.use(errorPlugin).use(openapi(...)).get('/health', ...)
for (const m of modules.values()) if (m.route) app = app.use(m.route)
export { app }
```

`ALL_MODULE_DESCRIPTORS` is a flat array of every module's descriptor. Order in the array does not matter — the composer resolves dependencies.

## 5. Hard rules

- A module declares `dependsOn` only on modules of the **same or lower layer**; an upward or cyclic dependency is a **startup error** (fails fast, never silent).
- A module is built **once**; the composer memoizes.
- Cross-module consumption is only via `deps.<name>.api` (a module's declared public surface) — never by importing another module's `infra`.
- Atomic cross-module effects are passed as functions taking `tx` (see [02](./02-transaction-uow.md)); the descriptor wires them from `deps`.

---

**Next:** Stage 3 — module templates (golden path).
