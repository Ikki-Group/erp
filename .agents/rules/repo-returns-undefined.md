---
description: Server repo finders return the DTO or undefined, never null
condition: ["return null\\b", "Promise<[^>\\n]*\\|\\s*null>"]
scope: ["tool:edit(*.repo.ts)", "tool:write(*.repo.ts)"]
---
In `*.repo.ts`, finders return the DTO or `undefined` (never `null`); `insert`/`update` return an `EntityRef` (`{ id }`) or `undefined`. Use `return undefined` / `Promise<XxxDto | undefined>` and keep the optional `db?: DbContext` parameter. See the Server architecture section of AGENTS.md.
