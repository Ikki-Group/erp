---
description: This repo uses Bun, oxlint and oxfmt; never npm/npx/yarn/pnpm, eslint, prettier or jest
condition: ["(^|[;&|(]\\s*)(npm|npx|yarn|pnpm)\\s", "(^|[;&|(]\\s*)(bunx\\s+(--bun\\s+)?)?(eslint|prettier|jest)(\\s|$)"]
scope: ["tool:bash"]
---
Use the repo toolchain instead:

- Packages/scripts: `bun install`, `bun run <script>`, `bunx --bun <bin>`, `bun --filter @ikki/server <script>`.
- Lint/format: `bun run lint` (oxlint; server is `--type-aware`), `bun run format` / `format:check` (oxfmt).
- Tests: server `bun run test` (bun test, from `apps/server`), web `bun run test` (vitest, from `apps/web`).
- Gates: server `bun run verify`, web `bun run verify`.
