This folder contains GitHub Actions for CI and deploying the monorepo apps.

Workflows

- **`ci.yml`** — on pull requests and pushes to `dev`/`main`: installs with `bun install --frozen-lockfile`, then for `apps/server` runs the format check, `verify` (lint, typecheck, knip, circular deps), migrates + seeds a `postgres:17` service container (`test:db:reset`), runs the test suite and builds the binaries. Root `bun run check` is not gated yet (web/e2e/web-archive do not pass it).
- **`deploy-server.yml`** — deploys `apps/server` to Fly.io after `CI` succeeds for a push to `main` (or via manual dispatch). `fly.toml`'s `release_command` (`/app/migrate`) applies DB migrations before the new version starts.
- **`deploy-web.yml`** — deploys `apps/web` to Cloudflare Pages when files under `apps/web` change on `main`.

Required repository secrets

- **Cloudflare Pages:**
  - `CLOUDFLARE_API_TOKEN` — API token with Pages deployment rights
  - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
  - `CLOUDFLARE_PROJECT_MAIN` — Pages project name for the `main` branch (production)
  - `CLOUDFLARE_PROJECT_DEV` — Pages project name for the `dev` branch (development)

- **Fly.io:**
  - `FLY_API_TOKEN` — Fly.io API token

Notes

- Adjust `directory` and `--config` paths in the workflows if your build output or Fly config live elsewhere.
