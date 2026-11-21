# F1 · Canonical module standard for GPT-Luna

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: —

## Resolution (2026-09-13)

**Decision:** Ratify the **flat-hybrid** layout as the canonical module standard, adding one requirement — pure business logic lives in DB-free files (`*.rules.ts` / `*.calculator.ts`) separate from orchestration. Full decision recorded in [`docs/adr/0001-module-standard.md`](../../../docs/adr/0001-module-standard.md).

Key points settled through grilling (Q1–Q7):
- Q1: flat-hybrid ratified (supersedes archived five-folder ADR-0001) + mandatory pure-domain separation.
- Q2: mechanical simple-vs-complex rule (1 entity + CRUD = simple/flat; sub-entities OR cross-module atomic effect OR heavy read = complex/sub-folders). Refs: `location` / `menu`+`iam`.
- Q3: pure logic in `*.rules.ts`; `*.calculator.ts` required when money/qty math exists (free of `Number()`).
- Q4: naming `IXxxRepo`+`XxxRepo`, `XxxService` with `handle*` — keep what the code uses.
- Q5: infra deps from registry `ctx` (no global-cache import); cross-module deps via static `Api` type (no duck-typing). `location` conforms; `menu` corrected when next touched.
- Q6: unit tests required for calculator/rules; integration atomicity test detail deferred to F2.
- Q7: barrel `index.ts` exports only `ModuleDescriptor` + `Api`; internals never leak. Cross-module comms *shape* (port vs event) deferred to F2.

Also created `CONTEXT.md` (structural glossary).

## Question

What is the single canonical shape of one backend module, such that GPT-Luna can build modules consistently and docs never drift from code again?

Press: flat-hybrid (`*.service.ts` class + `handle*`, as the current `location` module actually is) vs the archived five-folder layout (`domain/app/infra/contract/http` + `make*()` use-case functions + `RepoPort/RepoDrizzle`) vs a third option. Decide file layout, naming, where business logic lives, simple-vs-complex module distinction, and what the copy-from reference module is. The old plan's spec and code disagreed here — this ticket kills that ambiguity. Output: an ADR defining the module standard.

## Notes

- Owner said the code layer is "basically ok" — bias toward ratifying what works over inventing new structure, unless grilling exposes a real weakness.
- Must be mechanical enough for GPT-Luna to follow without judgment calls.
- Consult `codebase-design` (module/interface/depth/seam) and `grilling` + `domain-modeling`.
