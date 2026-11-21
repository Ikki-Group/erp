# ADR-0010: Declarative Module Registry

**Status:** Accepted
**Date:** 2026-09-05

## Context

`app.ts` assembles the module dependency graph by hand — ~90 lines of `createXModule(db, cache, { ...injected services })` in a specific order, where `pos` alone receives 9 injected services. Adding a module means editing this block and getting the ordering right. As `finance`/`hr`/`crm` come online this becomes increasingly fragile and error-prone, and it is exactly the kind of stateful, order-sensitive wiring a low-capability implementer mishandles.

## Decision

Replace manual assembly with a **declarative module registry**: each module exports a descriptor declaring its dependencies (by module name); a small composer resolves the graph in dependency order and instantiates each module once, injecting resolved dependencies. `app.ts` iterates the registry to mount routes. Adding a module = adding one descriptor entry, not editing an ordered block.

## Alternatives Considered

- **Keep manual DI.** Rejected: fragile and growing; ordering bugs are silent until runtime.
- **Adopt a full DI container library (e.g. tsyringe/awilix).** Rejected: decorator/reflection magic is opaque to a low-capability implementer and adds a dependency; a plain descriptor + topological resolve is enough and fully visible.

## Consequences

- **Easier:** module registration is a single declarative entry; the composer handles ordering. No hand-maintained assembly block.
- **Harder:** a small composer must be written and specified. It is a one-time cost, specified in Stage 2.
- **Constraint:** a module declares dependencies only on modules in the same or a lower layer (enforces the layering rule at wiring time; a cycle or upward dependency is a startup error). Descriptor shape specified in Stage 2.
