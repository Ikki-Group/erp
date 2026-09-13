# D1 · Core domain (Location, Company, Numbering)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: F1 ✅ F2 ✅ F3 ✅ F5 ✅ F6 ✅ F4 ✅ (foundation complete)

## Question

Press the Core domain design: Location (store vs warehouse as one entity with a type — is that right?), Company settings (single-company, tax rate consumed by POS), and document numbering (per-location daily-reset format `ORD-<LOC>-<YYYYMMDD>-<seq>`). Are these models correct for how Ikki actually operates?

## Notes

- Raw material to press: `docs/product/02-prd-core.md`, `02-prd-core-numbering.md`. Review, don't copy.
- Existing code: `location` is the reference simple module (ADR-0001). Numbering exists (`generateNumber`, `document_sequences` table with `(prefix, locationId, date)` unique).
- Consult grilling + domain-modeling. Update `CONTEXT.md` domain terms as they crystallize.
