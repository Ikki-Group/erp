# E2E Tests

End-to-end tests for Ikki ERP using Playwright.

## Prerequisites

1. **API server must be running** — start it in a separate terminal:
   ```bash
   bun run dev:server
   ```

2. **Database must be seeded** — the server needs seed data (superadmin user):
   - Email: `admin@ikki.com`
   - Password: `admin12345`

## Running Tests

```bash
# From monorepo root
bun run test:e2e

# Or from this directory
cd apps/e2e
bun run test
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `bun run test:e2e` | Run all tests |
| `bun run test:e2e:ui` | Interactive UI mode |
| `bun run test:e2e:headed` | Run with visible browser |
| `bun run test:e2e:debug` | Debug with inspector |
| `bun run test:e2e:report` | View HTML report |

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
import { test, expect } from './fixtures/auth.fixture';

test('my test', async ({ page, login }) => {
  await login();
  // ... test authenticated behavior
});
```
