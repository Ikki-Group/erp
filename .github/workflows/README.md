This folder contains GitHub Actions used to deploy the monorepo apps.

Required repository secrets

- **Cloudflare Pages:**

  - `CLOUDFLARE_API_TOKEN` — API token with Pages deployment rights
  - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
  - `CLOUDFLARE_PROJECT_MAIN` — Pages project name for the `main` branch (production)
  - `CLOUDFLARE_PROJECT_DEV` — Pages project name for the `dev` branch (development)

- **Fly.io:**
  - `FLY_API_TOKEN` — Fly.io API token
  - `FLY_APP_MAIN` — Fly app name for the `main` branch (production)
  - `FLY_APP_DEV` — Fly app name for the `dev` branch (development)

Notes

- Workflows trigger only when files under the matching app folder change.
- Adjust `directory` and `--config` paths in the workflows if your build output or Fly config live elsewhere.
