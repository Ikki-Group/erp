---
inclusion: manual
---

# Task-Driven Workflow

Structured task management via markdown files in `.ignore/tasks/`.

## Activation

Activate when:

- User sends a feature idea, bug report, or draft spec
- User references an existing task (e.g. "continue TASK-003")
- User says "grooming", "breakdown", or "plan this"

---

## File Convention

| Rule     | Value                                                     |
| -------- | --------------------------------------------------------- |
| Location | `.ignore/tasks/`                                          |
| Naming   | `TASK-{NNN}-{kebab-slug}.md`                              |
| ID       | Scan existing files, use highest number + 1               |
| Statuses | `DRAFT` → `GROOMING` → `IN_PROGRESS` → `DONE` / `BLOCKED` |

---

## Template

```markdown
# TASK-{NNN}: [Title]

## Meta

| Field    | Value      |
| -------- | ---------- |
| Status   | DRAFT      |
| Created  | YYYY-MM-DD |
| Updated  | YYYY-MM-DD |
| Sessions | 1          |

---

## Draft

[Raw user input — verbatim, never modified after grooming]

---

## Contract

### Problem Statement

[1–2 sentences describing the problem or goal]

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

### Scope

- **In scope:** ...
- **Out of scope:** ...

### Technical Context

[Files, modules, dependencies discovered during research]

### Task Breakdown

1. Task 1
2. Task 2

### Manual Test Checklist

**Happy Path:**

- [ ] Scenario — expected result

**Negative Cases:**

- [ ] Invalid input — expected error

**Edge Cases:**

- [ ] Boundary condition — expected behavior

---

## Progress Log

### Session 1 — YYYY-MM-DD

**Completed:**

- [x] What was done

**Changes:**
| File | Action | Description |
|------|--------|-------------|
| `path/file` | created/modified/deleted | Brief description |

**Decisions:**

- Decision + reasoning (the why)

**Next Steps:**

- Specific, actionable items for next session
```

---

## Phases

### Phase 1: DRAFT

1. Scan `.ignore/tasks/` → determine next ID
2. Create `TASK-{NNN}-{slug}.md` from template
3. Copy user input verbatim into `## Draft`
4. Set status = `DRAFT`
5. Proceed immediately to Phase 2

### Phase 2: GROOMING

1. Read and understand the draft
2. Research the codebase — read files, grep, check modules, fetch docs as needed
3. Fill the Contract:
   - Problem Statement — concise
   - Acceptance Criteria — testable checkboxes
   - Scope — explicit in/out boundaries
   - Technical Context — file paths, module names, dependencies
   - Task Breakdown — numbered, incremental, each produces working code
   - Manual Test Checklist — happy path, negative, edge cases
4. Set status = `GROOMING`
5. Present contract summary to user, ask for confirmation
6. On user confirmation → set status = `IN_PROGRESS`

**Grooming rules:**

- Tasks are incremental — each builds on previous
- No orphaned code — every task ends integrated
- Each task completable in one session
- Too large → split into sub-tasks

### Phase 3: EXECUTION

1. Read the task file — check latest progress log
2. Work through Task Breakdown sequentially (never skip)
3. At session end, append to `## Progress Log`:
   - What was completed
   - All file changes (exhaustive)
   - Decisions with reasoning
   - Specific next steps
4. Update Meta: increment Sessions, update `Updated` date
5. All Acceptance Criteria met → status = `DONE`

### Phase 4: RESUMPTION

1. Read the task file completely
2. Focus on last Progress Log → "Next Steps"
3. Continue from where previous session ended
4. Increment session counter

---

## Progress Log Standards

Write logs so a fresh session can continue without questions:

- Decisions include the WHY, not just what
- Changes table lists every created/modified/deleted file
- Next Steps are specific and actionable
- Blockers documented clearly

---

## Rules

- Always read the task file before coding
- Always groom — no skipping, even for "simple" tasks
- Always update Progress Log before ending a session
- Never delete task files (permanent archive)
- Never modify the Draft section after grooming
- Never work on tasks out of order
- Never create task files outside `.ignore/tasks/`
- Never reuse an existing task ID
