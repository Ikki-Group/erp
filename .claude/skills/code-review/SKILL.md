---
name: code-review
description: Review code against architecture patterns
---

# Code Review

Review code against Ikki ERP standards.

## Process
1. Check @docs/MODULE_CHECKLIST.md (84-point framework)
2. Verify each phase (structure, type safety, errors, DB, validation, HTTP, utils, testing, docs, quality)
3. Calculate score (target: 75+/84 for "excellent")

## Scoring
- 84/84: Production-ready ⭐⭐⭐⭐⭐
- 75-83: Excellent, ship with confidence ⭐⭐⭐⭐
- 65-74: Good, minor improvements ⭐⭐⭐
- 55-64: Needs work
- <55: Major revisions

## Focus Areas
- Type safety: No `any`, proper generics, Zod spread-shape
- Performance: No N+1 queries, batch ops, smart caching
- Error handling: Throw specific errors, proper HTTP codes
- Audit: All writes have createdBy/updatedBy
- Testing: Unit + integration, edge cases covered
- Documentation: JSDoc for public methods

## Red Flags
🚩 Type inference lost (`.extend()` instead of spread)
🚩 N+1 queries (loops with DB calls)
🚩 Stale cache (no invalidation on writes)
🚩 Missing audit columns
🚩 Returning null instead of throwing error
🚩 No error handling
🚩 No tests
🚩 Circular dependencies

## References
- @docs/MODULE_CHECKLIST.md → detailed checklist
- @docs/ARCHITECTURE.md → patterns
