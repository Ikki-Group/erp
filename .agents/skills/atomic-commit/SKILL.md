---
name: atomic-commit
description: >
  Turns a messy or mixed working tree into a sequence of small, atomic, Conventional Commits.
  Surveys the diff, groups changes by logical concern, stages each group separately (never
  `git add -A`/`.` as a first move), and writes concise-but-informative commit messages matching
  this repo's real style. Use when the user says "commit this", "commit my changes", "create
  atomic commits", "split these changes into commits", "clean up this diff into commits", or
  invokes "/commit" / "/atomic-commit". Refuses to squash unrelated changes into one commit.
---

# Atomic Commit

One commit = one reviewable, revertible idea. Never bundle unrelated changes into one commit just
because they happened to land in the same working tree at the same time.

## Precondition (opencode global git policy applies)

- Only run this workflow when the user explicitly asks to commit. Don't commit proactively just
  because a task finished.
- Never amend, force-push, `--no-verify` / skip hooks, `rebase -i`, or create empty commits unless
  the user explicitly asks for that specific action.
- Never stage or commit `.env*`, credentials, `node_modules`, or anything `.gitignore` excludes.

## Workflow

1. **Survey before touching the index.**
   - `git status` and `git diff` (unstaged) + `git diff --staged` (already staged) to see the
     full scope of change.
   - `git log --oneline -10` to confirm this repo's *current* style (type/scope casing, emoji or
     not — see below) so the new commit(s) don't look out of place.
2. **Never run `git add -A`, `git add .`, or `git commit -a` as a first move.** These are the
   bulk-commit anti-pattern this skill exists to prevent — they hide unrelated changes inside one
   commit. Stage explicitly, per file or per hunk: `git add <path>`, `git add -p <path>`.
3. **Partition the diff into atomic groups** (heuristics below). If the split is non-obvious or
   touches more than ~6 files, state the plan before staging anything:
   ```
   Plan:
   1. fix(auth): correct session expiry check      -> src/modules/auth/session.service.ts
   2. refactor(hr): extract payroll module factory -> src/modules/hr/payroll/**
   3. chore(deps): bump drizzle-orm                 -> package.json, bun.lock
   ```
4. **For each group**: stage only its files/hunks, run `git diff --staged` to verify the staged
   set exactly matches the intended concern (no stragglers pulled in), then commit with a message
   per the format rules below.
5. **After each commit**, re-run `git status` — repeat until the tree is fully committed or only
   changes the user explicitly wants left out remain.
6. Finish by showing `git log --oneline -n <count>` for the commits just made, as confirmation.

## Splitting heuristics

Split into separate commits when changes differ by:

- **Type** — a `feat` and an incidental `fix`/`refactor` noticed along the way are two commits,
  not one.
- **Scope/module** — unrelated modules (e.g. `hr` vs `sales`) never share a commit unless one
  literally cannot build/pass without the other (see "keep together").
- **Concern** — formatting/lint-only changes in a file touched for a different reason go in their
  own `style`/`chore` commit, not folded into the feature commit.
- **Dependency bump vs usage** — a `package.json`/`bun.lock` version bump is its own
  `chore(deps)` commit unless the bump is strictly required for the feature commit to build.

Keep together in one commit (splitting would break the tree or lose context):

- A Drizzle `schema.ts` change + its generated migration output (`db:generate`) + the code that
  consumes the new column/table.
- A source file and the generated artifact it produces (`generate:endpoints` → `endpoint.ts`,
  `generate:web` → copied contracts/DTOs). Never hand-edit or separately commit generated output.
- A test written in the same pass as the implementation it verifies.

If a diff is genuinely tangled (e.g. a rename mixed with logic changes) and can't be split safely
with `git add -p`, say so and ask how the user wants it handled — don't guess.

## Message format (concise but informative)

Conventional Commits, matching this repo's actual history:

- `<type>(<scope>): <imperative summary>` — scope optional, lowercase, matches the
  module/feature directory (`hr`, `sales`, `web`, `contracts`, `codegen`, `deps`, ...).
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`.
- Imperative mood ("add", "fix", "remove" — not "added"/"adds"), no trailing period, ≤50 chars
  ideal, 72 hard cap.
- Emoji prefix (`✨ feat:`, `🔧 fix:`, `♻️ refactor:`, `📝 docs:`, `🗃️ chore:`) is optional and
  inconsistent in this repo — check the last 10-15 commits and match whatever the branch is
  currently doing. Don't mix emoji and non-emoji commits within the same session.
- **Body only when the diff doesn't already explain why**: breaking changes, non-obvious
  rationale, migration notes, linked issues. Skip the body when the subject is self-explanatory —
  that's how the message stays short without losing information.
- Never write "this commit does X", first-person filler ("I added..."), AI attribution, or
  restate the filename when the scope already says it.

## Anti-patterns (hard stop)

- `git add -A && git commit -m "wip"` / `"updates"` / `"fixes stuff"` — no bulk commits, no vague
  messages.
- One commit spanning `feat` + `refactor` + `chore(deps)` because "it was all done together".
- Committing `apps/web/src/routeTree.gen.ts`, `apps/web/src/config/endpoint.ts`, or copied DTOs
  with hand edits — they're generated; only the output of their generating command gets committed.
- Guessing a split on a tangled diff instead of asking.

## Boundaries

Executes the commit sequence via `git add` / `git commit` only — never `push`, `merge`, or open a
PR unless separately asked. If the user only wants message *text* without touching git at all,
defer to a message-only skill (e.g. `caveman-commit`) instead of running this workflow.
