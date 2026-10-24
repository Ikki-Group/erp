# @ikki/web

Ikki ERP web client — React 19 + Vite + TanStack (Router / Query / Form / Table),
Tailwind + shadcn/ui, `ky` HTTP client with a typed `apiFactory` layer.

## Commands (from `apps/web` or via `bun --filter @ikki/web <script>`)

- `bun run dev` — Vite dev server
- `bun run typecheck` — `tsc --noEmit`
- `bun run test` — vitest

## Structure

- `src/features/<feature>/` — vertical slices. `*.dto.ts` + `*.api.ts` are
  **generated** from server contracts (see [docs/codegen](../../docs/codegen/WEB_CODEGEN.md));
  import them from the feature barrel (`@/features/<feature>`).
- `src/lib/validation/` — Zod validation helpers (`zp`/`zc`/`zq`), type-aligned
  with the server (see [validation parity](../../docs/codegen/WEB_CODEGEN.md#validation-parity-server--web)).
- `src/lib/api/` — `apiClient` (ky) + `apiFactory` + query keys.
- `src/components/` — UI; see `src/components/REGISTRY.md` before building UI.
- `src/routeTree.gen.ts` — TanStack Router generated; never edit by hand.

## Docs

Central documentation lives at the repo root [`docs/`](../../docs/README.md).
