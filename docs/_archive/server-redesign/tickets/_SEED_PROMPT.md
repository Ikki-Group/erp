# Redesign Ticket Seed Prompt

Use this prompt at the start of every backend redesign ticket execution.
Replace `<TICKET-ID>` with exactly one ticket ID, for example `T-001`.

## Task

Implement **only** ticket `<TICKET-ID>` from this repository's backend redesign backlog.
Do not start, partially implement, or modify any other ticket.
Do not invent new requirements. If the ticket or its referenced specs are ambiguous, stop and report the ambiguity instead of guessing.

## Repository and scope

- Project root: `/Users/rizqynugroho9/workspace/ikki/erp`
- Backend: `/Users/rizqynugroho9/workspace/ikki/erp/apps/server`
- Design and development specs: `/Users/rizqynugroho9/workspace/ikki/erp/docs/server-redesign`
- Keep unrelated existing working-tree changes untouched.
- Do not use destructive commands or rewrite files unrelated to this ticket.

## Mandatory reads before writing code

Read these files fully with the file-reading tool. Do not rely on conversation memory or a previous ticket's implementation.

1. `docs/server-redesign/tickets/<TICKET-ID>.md`
2. `docs/server-redesign/12-module-checklist.md`
3. `docs/server-redesign/10-simple-module.md` for simple modules/foundation work
4. `docs/server-redesign/11-complex-module.md` for complex or operational modules
5. Every file and section listed in the ticket's **Read first** section
6. `AGENTS.md` and `CLAUDE.md` for repository conventions and commands
7. The existing source files named by the ticket, before changing them

For a foundation ticket, use the referenced pattern spec as the primary implementation template. For a module ticket, use the appropriate golden path as the structural template.

## Authority and consistency rules

Apply requirements in this order:

1. The ticket's explicit scope and Definition of Done
2. The referenced redesign pattern spec and migration spec
3. The golden-path templates and module checklist
4. `AGENTS.md` and `CLAUDE.md`
5. Existing code, only where it does not conflict with the redesign specs

When two redesign documents conflict, do not silently choose. Report the exact files/sections and stop for clarification.

Copy established names, folder layout, import style, error handling, and dependency direction. Prefer the smallest change that satisfies the ticket. Do not introduce a new abstraction, dependency, or convention unless the ticket/spec requires it.

## Non-negotiable redesign invariants

- Every write use-case body runs inside exactly one `uow.run(async (tx) => { ... })`.
- Every repository and atomic-effect port accepts and forwards `cx`/`tx`; never ignore a passed transaction.
- Every atomic cross-module effect that must roll back with the operation runs synchronously inside the same UoW.
- Publish non-critical events and invalidate cache only after the transaction commits.
- Every HTTP route declares and enforces its permission through the standard RBAC macro, except the explicitly documented public-route exceptions.
- Use `Money` and `Qty` value objects for domain quantities and amounts. Never use `Number(string)` for money or quantity calculations.
- Use native PostgreSQL booleans, not integer `0`/`1` representations, when the ticket touches schema or boolean fields.
- Keep domain code free of database, Elysia, and Zod imports.
- Use `import type` for type-only imports and preserve the repository's `.ts` import convention.
- Do not leave the old no-op transaction helper or create another fake transaction path.

## Implementation loop

1. Read the tracker and ticket. Set the ticket's row in `docs/server-redesign/18-progress.md` to `in-progress` before implementation.
2. Inspect current code and all callers before editing shared code.
3. Implement the smallest complete change for this ticket, including required tests and migrations.
4. Review the diff for transaction threading, dependency direction, RBAC, value-object boundaries, and accidental unrelated changes.
5. From `/Users/rizqynugroho9/workspace/ikki/erp/apps/server`, run the full gate:

   ```sh
   bun run verify
   bun run test
   ```

   Both commands must pass. If either fails, fix the ticket and rerun both commands. Do not downgrade to a partial gate without explicitly reporting why the full gate could not run.
6. Re-read the ticket's Definition of Done and verify every item explicitly.
7. Update `docs/server-redesign/18-progress.md` only after the implementation and full gate pass: set the row to `done`, set **Verify** to ✅, update the rollup count, and record the implementation commit hash when a commit has been created by the orchestrator.
8. Stop. Do not select or begin the next ticket in the same turn.

## Completion report

Report only after the ticket is complete or blocked. Include:

- Ticket ID and files changed
- Tests and verification commands run, with pass/fail results
- Any migration or environment prerequisite
- Any unresolved ambiguity or blocker
- Confirmation that no next ticket was started

Never claim a ticket is done when verification is failing, when a required test is missing, or when the tracker was not updated.
