# Ikki ERP Documentation

Central documentation for Ikki ERP — an integrated operational system for Ikki Coffee and Ikki Resto covering POS, inventory, finance, HR, and CRM.

> Toolchain, commands, and deploy: [`AGENTS.md`](../AGENTS.md) (root).

## Layout

| Directory | Purpose |
|-----------|---------|
| [`product/`](./product/readme.md) | Business requirements, workflows, glossary, timeline |
| [`server/`](./server/readme.md) | Backend architecture, module patterns, code standards |
| [`database/`](./database/readme.md) | Schema reference, ERDs, naming conventions |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenant | No — single company | Ikki is one business, not a SaaS platform |
| Location model | Single `Location` entity with type (`store`/`warehouse`) | One context switcher, one FK everywhere |
| Menu scope | Per-location | Coffee and Resto have entirely different menus |
| Material scope | Global (shared across locations) | Enables easy transfer/mutasi between locations |
| Modifiers | Modifier Group + Options | Flexible, common in F&B POS |
| Modifier → recipe | Backlog (Phase 1: base recipe only) | UI complexity TBD |
| UoM | Chain conversion, 3-level (purchase/storage/recipe) | Real-world: karton → liter → ml |
| Cost method | Weighted average | Simpler than FIFO, appropriate for F&B |
| POS | Built in-house + Moka import | Full control, multi-source |
| Table service | Open bill (tab) + close bill (counter) | Both Coffee and Resto need it |
| Finance | Proper double-entry accrual accounting | AP, full reporting, akuntan-ready |
| HR | Full (shift, attendance, payroll with variable) | Monthly salary + bonus/lembur/potongan |
| CRM | Loyalty program + customer tracking | Retain customers, targeted promos |
| Transfer | Request-based, no approval, no variance | Keep it simple for now |
| Audit trail | Yes | Track who did what |
| Notifications | In-app only (Phase 1) | No email/WA yet |
| Platform | Web first | Mobile planned post-launch |

## Principles

1. **Single source of truth.** One canonical doc per rule. Reference it, don't duplicate.
2. **AI-friendly.** Structured Markdown, tables, ASCII diagrams. No images.
3. **Business-first in `product/`.** No code/SQL — that belongs in `server/` or `database/`.
4. **Keep current.** Delete outdated docs. No "TODO: update" markers.

---

**Next:** [product/readme.md](./product/readme.md) — Product documentation index.
