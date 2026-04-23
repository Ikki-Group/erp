# Ikki ERP Documentation

Central reference for Ikki ERP architecture, patterns, and development standards.

## Architecture & Code Patterns

### [ARCHITECTURE.md](ARCHITECTURE.md)
Complete system design: request flow through layers (Router → Service → Repo → DB), database patterns, service organization, caching, error handling, type safety, performance optimization.

**Use when**: Understanding overall architecture, making design decisions, optimizing performance.

### [CODE_PATTERNS.md](CODE_PATTERNS.md)
Quick reference and templates: DTO pattern, repository pattern, service pattern, error handling, validation, caching, testing examples.

**Use when**: Building a feature, copy-paste templates, quick syntax lookup.

### [MODULE_CHECKLIST.md](MODULE_CHECKLIST.md)
84-point code review framework. Verify module quality across 10 phases (structure, type safety, errors, database, validation, HTTP, utilities, testing, docs, quality).

**Use when**: Code review (target score: 75+/84 for "excellent").

## Development Workflow

Use Claude Code tools for efficient development:

- **Building a feature**: Use `/feature-development` skill (explore → plan → implement → verify)
- **Code review**: Use `/code-review` skill (check 84-point checklist)
- **Architecture questions**: Use `/architecture-explorer` subagent (dedicated context)

Quick commands in CLAUDE.md at project root.

## Reference Modules

- **Simple CRUD**: `src/modules/location/` - Location management (Layer 0)
- **Complex logic**: `src/modules/iam/` - Identity & access management (Layer 1)

Study these patterns before building new modules.

## Product & Strategy

- **[Product Requirements](./product/PRD.md)**: Vision, requirements, roadmap
- **[Technical Specs](./product/Tech-Specs.md)**: System design overview
- **[Features](./features/)**: Feature documentation

---

**Documentation Philosophy**: Keep CLAUDE.md SHORT, use skills/agents for workflows, link to docs instead of embedding. This keeps context window efficient and aligned with Claude Code best practices.
