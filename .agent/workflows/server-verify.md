---
description: How to verify server code quality before committing
---

# Server Verification

// turbo-all

Run these checks to verify the server is working correctly.

## 1. Type Check

```bash
cd server && bun run typecheck
```

This runs `tsc --noEmit`. Fix any type errors before proceeding.

## 2. Lint

```bash
cd server && bun run lint
```

If there are auto-fixable issues:

```bash
cd server && bun run lint:fix
```

## 3. Dead Code Check

```bash
cd server && bun run knip
```

This identifies unused exports, dependencies, and files.

## 4. Dev Server Boot Test

```bash
cd server && bun run dev
```

Verify:

- Server starts without errors
- `ikki-erp is running at http://0.0.0.0:3001` appears in logs
- No unhandled promise rejections

## 5. Format (Optional)

```bash
cd server && bun run format
```
