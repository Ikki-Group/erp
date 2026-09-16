## Parent

#40 — Web data-fetching layer redesign (TanStack Query + Router)

## What to build

The contract phase of the wide refactor plus the documentation truth-up, done only after both pilots prove the new contract:

- **Contract:** delete the leftover old query-key shapes no longer referenced by the pilots (the three competing forms collapse to the one canonical factory). This is safe to do only once the pilots have moved off them; remaining unmigrated features keep compiling because the canonical factory still serves them — any old-form key still in use by a non-pilot feature is migrated to the canonical factory in the same pass rather than left behind.
- **Docs:** correct `docs/web/01/03/04/05-*.md` to describe the actual redesigned app — a client React SPA with `RouterProvider` (not TanStack Start / `shellComponent`), the real cache defaults, loaders + `useSuspenseQuery`, URL-based list state, freshness tiers, and location-scoped caching.
- **Glossary:** add web-layer terms to root `CONTEXT.md` — **location-scoped endpoint**, **freshness tier**, **query-key factory**.
- **ADRs:** file two in root `docs/adr/` — `0015` query-key convention + location-scoped cache partitioning; `0016` error-boundary / `throwOnError` policy.

## Acceptance criteria

- [ ] No duplicate/legacy query-key shapes remain in the codebase; every key flows from the canonical factory (grep confirms the hand-rolled `{lists,list,details,detail}` objects are gone).
- [ ] `docs/web/01/03/04/05-*.md` describe the real stack and the redesigned data-fetching model with no remaining "Status: Blueprint / TanStack Start" inaccuracies in the touched sections.
- [ ] `CONTEXT.md` contains the three new web-layer terms as glossary entries.
- [ ] ADR `0015` and `0016` exist in `docs/adr/` and are linked from `docs/adr/README.md`.
- [ ] Typecheck and lint clean; `apps/web` vitest passes.

## Blocked by

- #44 (Pilot 1 — `location`)
- #45 (Pilot 2 — complex feature)
