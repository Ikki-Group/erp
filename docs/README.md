# Ikki ERP Documentation

Central reference for Ikki ERP product vision, architecture, business operations, and development standards.

---

## 📖 Documentation Index

### Product & Business Strategy

**Start here to understand the "why" and "what"**:

- **[VISION.md](./product/VISION.md)** — Business vision, strategy, and success metrics
  - Target customer profile, core problems solved
  - Business objectives (12-month goals)
  - Strategic differentiators vs. competitors
  - Phased rollout strategy
  
- **[PRD.md](./product/PRD.md)** — Complete product requirements document
  - Problem definition and business context
  - Detailed feature specifications (all modules)
  - Use cases and business workflows
  - Non-functional requirements, success criteria
  
- **[WORKFLOWS.md](./product/WORKFLOWS.md)** — Operational procedures and business processes
  - Daily operations (stock checks, orders, waste tracking, opname)
  - Weekly operations (purchasing review, accuracy reports)
  - Monthly operations (financial close, menu engineering)
  - Operational constraints and exception handling
  - Seasonal adaptations and scaling procedures

- **[DATA_MODEL.md](./product/DATA_MODEL.md)** — Database schema and entities
  - Entity relationship diagram (ERD)
  - Detailed table definitions (all 10+ core entities)
  - Validations, constraints, and business rules
  - Indexes and performance optimization
  - Data migration and integrity checks

- **[Tech-Specs.md](./product/Tech-Specs.md)** — Technical architecture overview
  - Technology stack (Bun, ElysiaJS, React, PostgreSQL)
  - Frontend structure and component organization
  - Backend architecture (service-repository pattern)
  - Layer dependency rules and module registry
  - Development commands

---

### Architecture & Code Patterns

**Reference for building features and understanding system design**:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Complete system design
  - Layered architecture (Layer 0-3, dependency rules)
  - Request flow (Router → Service → Repo → DB)
  - Database patterns (queries, mutations, transactions)
  - Service layer patterns, batch operations
  - Caching strategy, error handling, type safety
  
- **[CODE_PATTERNS.md](./CODE_PATTERNS.md)** — Quick reference and copy-paste templates
  - DTO pattern, repository pattern, service pattern
  - Common code snippets (CRUD, relationships, transactions)
  - Error handling and validation
  - Testing patterns

- **[MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md)** — 84-point code review framework
  - 10 phases: structure, type safety, errors, database, validation, HTTP, utilities, testing, docs, quality
  - Scoring rubric (75+/84 = excellent)
  - Common anti-patterns and how to avoid them

---

### Development Workflow

**Use Claude Code skills for efficient development**:

- **Building a feature**: Use `/feature-development` skill
  - Explore → Plan → Implement → Verify workflow
  
- **Code review**: Use `/code-review` skill
  - Check 84-point module checklist
  
- **Architecture questions**: Use `/architecture-explorer` subagent
  - Dedicated context for system design investigations

Quick commands: See [CLAUDE.md](../CLAUDE.md) at project root.

---

### Reference Modules

Study these examples when building new modules:

- **[location/](../apps/server/src/modules/location/)** — Simple CRUD with zero dependencies (Layer 0)
  - Good pattern for core master data
  
- **[iam/](../apps/server/src/modules/iam/)** — Complex logic with service patterns (Layer 1)
  - Good pattern for business logic, caching, bulk operations

- **[inventory/](../apps/server/src/modules/inventory/)** — Transactional operations (Layer 2)
  - Good pattern for multi-step workflows, transactions, adjustments

---

## 📋 Feature Documentation

Complete specifications for each module:

- **[Features/](./features/)** — Per-module documentation
  - `product.md` — Product catalog
  - `location.md` — Location management
  - `material.md` — Raw material & inventory
  - `inventory.md` — Stock movements & opname
  - `recipe.md` — Bill of materials
  - `sales.md` — Sales orders
  - `iam.md` — Users, roles, permissions
  - `auth.md` — Authentication (JWT)
  - `dashboard.md` — Analytics & KPIs
  - `purchasing.md` — PO, GRN (Phase 2)

---

## 🏗️ Architecture & Reference

- **[architecture/](./architecture/)** — Detailed architecture diagrams and patterns
- **[adr/](./adr/)** — Architecture Decision Records
  - `adr-0001-frontend-tech-stack-lockdown.md` — Why React, Tailwind, Shadcn

---

## 📚 Quick Navigation

### "I want to..."

| Goal | Read | Then | Action |
|------|------|------|--------|
| Understand what we're building | VISION.md | PRD.md | Stakeholder review |
| Learn how operations work | WORKFLOWS.md | PRD.md | Define requirements |
| Understand the database | DATA_MODEL.md | ARCHITECTURE.md | Design schemas |
| Build a new feature | PRD.md → CODE_PATTERNS.md | ARCHITECTURE.md | Implement |
| Review code | MODULE_CHECKLIST.md | CODE_PATTERNS.md | Provide feedback |
| Optimize performance | ARCHITECTURE.md | CODE_PATTERNS.md | Implement patterns |
| Debug a production issue | ARCHITECTURE.md → DATA_MODEL.md | WORKFLOWS.md | Root cause analysis |

---

## 📊 Documentation Structure

```
docs/
├── README.md (this file - navigation hub)
├── ARCHITECTURE.md (system design reference)
├── CODE_PATTERNS.md (quick copy-paste templates)
├── MODULE_CHECKLIST.md (84-point code review)
│
├── product/ (business & product specs)
│   ├── VISION.md (strategy, market, goals)
│   ├── PRD.md (detailed requirements)
│   ├── WORKFLOWS.md (operational procedures)
│   ├── DATA_MODEL.md (database schema & entities)
│   └── Tech-Specs.md (technical overview)
│
├── features/ (per-module documentation)
│   ├── location.md, product.md, material.md
│   ├── inventory.md, recipe.md, sales.md
│   ├── iam.md, auth.md, dashboard.md
│   └── ... (reference docs)
│
├── adr/ (architecture decisions)
│   └── adr-0001-frontend-tech-stack-lockdown.md
│
└── architecture/ (design diagrams & patterns)
```

---

## 📊 Documentation Status

| Document | Status |
|----------|--------|
| VISION.md | ✓ Complete - Business vision & strategy |
| PRD.md | ✓ Complete - Feature specifications |
| WORKFLOWS.md | ✓ Complete - Operational procedures |
| DATA_MODEL.md | ✓ Complete - Database schema |
| Tech-Specs.md | ✓ Reference - Technical architecture |
| ARCHITECTURE.md | ✓ Reference - System design |
| CODE_PATTERNS.md | ✓ Reference - Code templates |
| MODULE_CHECKLIST.md | ✓ Reference - Code review framework |

---

## 🎯 Key Principles

**Documentation Philosophy**:
- Keep high-level docs SHORT and focused on "why"
- Link to detail docs rather than embedding long content
- Maintain single source of truth (no duplication)
- Update docs alongside code (live documentation)
- Use clear, accessible language (developers + AI agents)

**Architecture Philosophy**:
- Type safety first (TypeScript strict mode)
- Clear layering (Layer 0-3 dependency rules)
- Composition over inheritance
- DRY: Don't repeat yourself
- Explicit over implicit (errors thrown, not hidden)

---

## 📞 Questions?

- **Architecture questions**: Ask in #engineering-design Slack channel or use `/architecture-explorer`
- **Product questions**: Review VISION.md + PRD.md, ask Product Manager
- **Technical questions**: Review ARCHITECTURE.md + CODE_PATTERNS.md
- **Feature questions**: Check Features/ folder for specific module docs
- **Process questions**: Check CLAUDE.md for development workflow

---

**Documentation Hub for Ikki ERP**  
All docs simplified for beta/fresh start. No version tracking.

