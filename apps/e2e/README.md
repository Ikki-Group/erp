# E2E Tests

End-to-end tests for Ikki ERP using Playwright.

## Running Tests

```bash
# From monorepo root: resets + seeds the TEST db, starts server :4100 + web :3100, runs Playwright
./scripts/test-e2e.sh --reporter=line
```

Seed users (`apps/server/scripts/seeds/iam.ts`): `owner`, `manager`, `cashier`, `warehouse`,
`multi-location`, all with password `password123`. Specs assume a freshly seeded DB; each test
uses unique codes (`uid()`) so tests stay parallel-safe.

### Useful Commands

| Command                   | Description              |
| ------------------------- | ------------------------ |
| `bun run test:e2e`        | Run all tests            |
| `bun run test:e2e:ui`     | Interactive UI mode      |
| `bun run test:e2e:headed` | Run with visible browser |
| `bun run test:e2e:debug`  | Debug with inspector     |
| `bun run test:e2e:report` | View HTML report         |

## Structure

```
apps/e2e/
├── tests/
│   ├── fixtures/       # Shared test fixtures (auth, etc.)
│   ├── helpers/        # Test data and utilities
│   └── *.spec.ts       # Test files
├── playwright.config.ts
└── tsconfig.json
```

## Writing Tests

Import the auth fixture for tests that need authentication:

```typescript
import { test, expect } from './fixtures/auth.fixture'

test('my test', async ({ page, login }) => {
	await login()
	// ... test authenticated behavior
})
```
