---
inclusion: auto
---

# Task Manager

Maintain task awareness across sessions. Check `.ignore/tasks/readme.md` before creating or modifying tasks.

## When to Activate

- User proposes feature/idea/bug → check if existing task covers it, then create or resume
- User asks "what next?" → read task board, recommend by impact + unblocked dependencies
- User says "plan"/"breakdown"/"grooming" → follow `task-workflow` steering

## Rules

- Never create duplicate tasks — always check existing first
- Never recommend work with unmet dependencies
- Ground all status in file content (read, don't guess)
- Use `TASK-{NNN}` format, link to file
- Keep `.ignore/tasks/readme.md` as TOC (update when status changes)
