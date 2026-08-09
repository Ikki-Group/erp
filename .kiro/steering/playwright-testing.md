---
inclusion: fileMatch
fileMatchPattern: ['apps/e2e/**/*.ts', 'apps/e2e/**/*.spec.ts']
---

# Playwright E2E Testing

All end-to-end tests live in `apps/e2e/`. Run with `bun run test:e2e` from root (requires server + web running) or `bun run test` from `apps/e2e/`.

## Project structure

```
apps/e2e/
├── tests/
│   ├── fixtures/         # Shared fixtures (auth, page objects)
│   │   └── auth.fixture.ts
│   ├── helpers/          # Test data and utilities
│   │   └── test-data.ts
│   └── <feature>.spec.ts # One spec file per feature module
├── playwright.config.ts
└── tsconfig.json
```

## File conventions

- Name test files `<feature>.spec.ts` in `tests/` (flat, no nesting).
- Group related tests with `test.describe('<Feature> - <Scope>')`.
- Import `test` and `expect` from `./fixtures/auth.fixture` (not from `@playwright/test` directly) so the `login` fixture is available.
- Add JSDoc comments above each `test()` explaining the purpose.

## Locators (priority order)

1. `getByRole` / `getByLabel` / `getByText` — semantic, resilient.
2. `getByPlaceholder` / `getByTitle` — acceptable when label is absent.
3. `data-testid` — fallback only when no accessible locator exists.
4. CSS selectors — last resort, never XPath.

UI text is in Indonesian (e.g. "Masuk", "Simpan", "Daftar Produk"). Use case-insensitive regex (`/simpan/i`) when matching button/link text to tolerate casing changes.

## Assertions

- Use web-first assertions: `toBeVisible()`, `toHaveText()`, `toHaveURL()`, `toHaveValue()`.
- Never use `waitForTimeout()`. Rely on auto-waiting or `waitForLoadState()`.
- For URL checks use regex patterns: `await expect(page).toHaveURL(/\/product/)`.

## Fixtures and helpers

- `auth.fixture.ts` exports extended `test` with a `login` fixture. Use `login()` for default superadmin; pass email/password for other roles.
- Place reusable test data in `tests/helpers/test-data.ts` as `const` exports.
- Add new fixtures in `tests/fixtures/` using `test.extend<T>()`. Keep fixtures typed.

## Configuration details

- Base URL: `http://localhost:3000` (the web app dev server).
- Browser: Chromium only.
- Screenshots: only on failure. Traces: on first retry.
- Reporter: JSON output to `./playwright-report/report.json`.
- CI: 2 retries, single worker, `forbidOnly` enabled.

## Test patterns

- Always `await login()` before accessing authenticated pages.
- Navigate explicitly with `page.goto('/path')` — do not rely on previous test state.
- Each test must be independent and runnable in isolation.
- Prefer action → assertion flow: perform UI action, then assert the expected outcome.

## Reporting

- Tests should include meaningful annotations for TestDino.
- Upload reports via `bun run upload:report` in `apps/e2e`.

## Commands

| Action        | Command                                    |
| ------------- | ------------------------------------------ |
| Run all tests | `bun run test` (from `apps/e2e`)           |
| Run headed    | `bun run test:headed`                      |
| Run with UI   | `bun run test:ui`                          |
| Debug         | `bun run test:debug`                       |
| Single file   | `bunx playwright test tests/login.spec.ts` |
| View report   | `bun run test:report`                      |
