# Domain docs

## Layout

**Single-context.** One `CONTEXT.md` and one `docs/adr/` directory, both at the repo root.

- `CONTEXT.md` — the domain model: the project's terminology, entities, and the relationships between them.
- `docs/adr/` — Architectural Decision Records, one file per decision (`NNNN-short-title.md`).

Neither exists yet; the `domain-modeling` skill creates them on first use.

## Consumer rules

- Before building a feature, read `CONTEXT.md` to ground your terminology in the project's domain language.
- Before changing an architectural decision, check `docs/adr/` for a prior ADR that covers it. Supersede rather than silently contradict.
- When you introduce or rename a domain term, update `CONTEXT.md`. When you make a significant architectural decision, record a new ADR.
