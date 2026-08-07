---
inclusion: fileMatch
fileMatchPattern: ['docs/**/*.md', '**/README.md']
---

# Documentation Standards

Rules for writing and maintaining documentation across the Ikki ERP monorepo.

## Reading Documentation

When you need context about a topic, follow this lookup order:

1. **Start at the index.** Read the `readme.md` in the relevant `docs/` subdirectory first — it maps available docs and tells you where to look.
2. **Follow the hierarchy.** `docs/readme.md` (root index) → subdirectory readme → specific doc.
3. **Respect authority.** Each doc type has a canonical home (see Doc Locations below). If you find conflicting info, the canonical location wins.
4. **Check for superseded markers.** Docs prefixed with `> ⚠️` are historical — do not treat them as current guidance.
5. **Prioritize 02-module-standard.md** for any question about server module structure — it is the single source of truth.

### What to read for common tasks

| Task                                     | Read first                                               |
| ---------------------------------------- | -------------------------------------------------------- |
| Building a new server module             | `docs/server/02-module-standard.md` → `06-module-map.md` |
| Understanding server layers/architecture | `docs/server/01-server-architecture.md`                  |
| Writing Zod schemas, services, repos     | `docs/server/04-code-patterns.md`                        |
| Naming, imports, TS style, HTTP rules    | `docs/server/03-code-standard.md`                        |
| Database schema changes                  | `docs/database/readme.md` → `standards/`                 |
| Understanding business workflows         | `docs/product/10-workflows.md`                           |
| Product requirements & vision            | `docs/product/01-vision.md`, `readme.md`                 |
| Toolchain, commands, deploy              | `AGENTS.md` (root)                                       |

## Structure & Organization

- **One topic per file**, max ~300 lines. If it's longer, split it.
- Every folder with multiple docs gets a `readme.md` as index/TOC.
- Use `#[[file:path]]` references instead of duplicating content across files.
- Filenames: `kebab-case.md`. Use numeric prefix for ordered content (`01-`, `02-`, `03-`).
- Headings max 3 levels deep (`#`, `##`, `###`). Deeper nesting means the doc should be split.

## Content Formatting

- Start every doc with a **one-sentence summary** of what it covers (first line after the title).
- Use **tables** for structured data (features, comparisons, status lists, mappings).
- Use **ASCII diagrams** for flows and architecture — not images. AI agents can read text; images are opaque.
- Use fenced code blocks with language tags for code/config/commands.
- Short paragraphs: 3–4 sentences max. One idea per paragraph.

## Language & Tone

- **English** (plain, accessible) for all documentation.
- Active voice, present tense: "The system processes..." not "The system will process..."
- Define domain terms inline on first use or reference the glossary.
- Be direct. Avoid hedging ("basically", "kind of", "should probably").
- No filler intros ("In this document we will discuss..."). Start with the substance.

## Cross-Referencing

- Use **relative links** (`./other-file.md`) not absolute paths.
- Every doc ends with a `**Next:**` link to the logical next document.
- Link to the canonical source rather than restating rules. `02-module-standard.md` is the single source of truth for module conventions.

## Maintenance

- Docs are updated in the **same PR** as the code they describe. No orphan docs.
- Outdated docs are deleted, not left with "TODO: update" markers.
- If a feature changes significantly, the doc is rewritten — not patched with addendums.
- Historical/superseded docs are clearly marked with a `> ⚠️` callout and retained only for context.

## Doc Locations

| Type                                  | Location           |
| ------------------------------------- | ------------------ |
| Server architecture & module patterns | `docs/server/`     |
| Database schema, ERDs, conventions    | `docs/database/`   |
| AI steering instructions              | `.kiro/steering/`  |
| Toolchain, commands, deploy           | `AGENTS.md` (root) |

## Principles

1. **Single source of truth.** Don't re-document the same rule in multiple places. Reference the canonical doc.
2. **AI-friendly.** Structured Markdown with clear headers, bullets, and tables. Prefer text over images.
3. **Business-first in `product/`.** No code/SQL there — that belongs in `server/` or `database/`.
4. **Code-adjacent when useful.** Module READMEs and component registries stay next to the code they describe.

## Template for New Docs

```markdown
# Title

One-sentence summary of what this document covers.

## Section 1

Content here.

## Section 2

Content here.

---

**Next:** [Next Document](./next-doc.md) — Brief description.
```
