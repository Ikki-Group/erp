---
inclusion: fileMatch
fileMatchPattern: ['docs/**/*.md', '**/README.md']
---

# Documentation

Guidelines for reading and writing documentation in the Ikki ERP monorepo.

## Reading Documentation

When you need context about a topic, follow this lookup order:

1. **Start at the index.** Read the `README.md` in the relevant `docs/` subdirectory first — it maps available docs and tells you where to look.
2. **Follow the hierarchy.** `docs/README.md` (root index) → subdirectory README → specific doc.
3. **Respect authority.** Each doc type has a canonical home (see Doc Locations below). If you find conflicting info, the canonical location wins.
4. **Check for superseded markers.** Docs prefixed with `> ⚠️` are historical — do not treat them as current guidance.
5. **Prioritize MODULE_STANDARD.md** for any question about server module structure — it is the single source of truth.

### What to read for common tasks

| Task | Read first |
|------|-----------|
| Building a new server module | `docs/server/MODULE_STANDARD.md` → `MODULE_CHECKLIST.md` |
| Understanding server layers/architecture | `docs/server/SERVER_ARCHITECTURE.md` |
| Writing Zod schemas, services, repos | `docs/server/CODE_PATTERNS.md` |
| Database schema changes | `docs/database/readme.md` → `standards/` |
| Understanding business workflows | `docs/product/WORKFLOWS.md` |
| Product requirements & vision | `docs/product/PRD.md`, `VISION.md` |
| Toolchain, commands, deploy | `AGENTS.md` (root) |

## Writing Documentation

### Structure & Organization

- One topic per file, max ~300 lines. Split longer docs.
- Every folder with multiple docs gets a `README.md` as index/TOC.
- Use `#[[file:path]]` references in steering files instead of duplicating content.
- Filenames: `UPPER_SNAKE.md` for primary docs (e.g. `MODULE_STANDARD.md`), `kebab-case.md` for secondary/generated docs.
- Headings max 3 levels deep (`#`, `##`, `###`). Deeper nesting means the doc should be split.

### Content Formatting

- Start every doc with a one-sentence summary after the title.
- Use tables for structured data (features, comparisons, status lists, mappings).
- Use ASCII/Mermaid diagrams for flows and architecture — not images.
- Use fenced code blocks with language tags for all code/config/commands.
- Short paragraphs: 3–4 sentences max. One idea per paragraph.

### Language & Tone

- English, plain and accessible.
- Active voice, present tense: "The system processes..." not "The system will process..."
- Define domain terms inline on first use or reference the glossary.
- Be direct. No hedging ("basically", "kind of", "should probably").
- No filler intros. Start with the substance.

### Cross-Referencing

- Use relative links (`./other-file.md`, `../server/README.md`).
- Link to the canonical source rather than restating rules. `MODULE_STANDARD.md` is the single source of truth for module conventions.

### Maintenance

- Docs are updated in the same PR as the code they describe.
- Outdated docs are deleted, not left with "TODO: update" markers.
- If a feature changes significantly, rewrite the doc — don't patch with addendums.
- Historical/superseded docs are clearly marked with a `> ⚠️` callout and retained only for context.

## Doc Locations

| Type                                    | Location                                                          |
| --------------------------------------- | ----------------------------------------------------------------- |
| Product docs (vision, PRD, workflows)   | `docs/product/`                                                   |
| Server architecture & module patterns   | `docs/server/`                                                    |
| Database schema, ERDs, conventions      | `docs/database/`                                                  |
| Codegen (historical, superseded)        | `docs/codegen/`                                                   |
| App quick-starts, module-specific notes | `apps/{app}/README.md`, `apps/server/src/modules/{mod}/README.md` |
| AI steering instructions                | `.kiro/steering/`                                                 |
| Toolchain, commands, deploy             | `AGENTS.md` (root)                                                |

## Principles

1. **Single source of truth.** Don't re-document the same rule in multiple places. Reference the canonical doc.
2. **AI-friendly.** Structured Markdown with clear headers, bullets, and tables. Prefer text over images.
3. **Business-first in `product/`.** No code/SQL there — that belongs in `server/` or `database/`.
4. **Code-adjacent when useful.** Module READMEs and component registries stay next to the code they describe.
