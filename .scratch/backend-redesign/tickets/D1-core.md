# D1 · Core domain (Location, Company, Numbering)

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: D0 ✅ (auth/iam)

## Resolution (2026-09-13)

**Decision:** Location as one entity with server-enforced type capability; deactivation blocked on non-zero stock; race-free atomic-upsert numbering (Asia/Jakarta) inside the UoW; Company singleton with a single company-wide tax rate consumed via `Api`. Full decision in [`docs/adr/0008-core-domain.md`](../../../docs/adr/0008-core-domain.md).

Settled Q1–Q4:
- Q1: `type` (store/warehouse) capability enforced server-side via pure rules (assertIsStore), not a UI label.
- Q2: deactivation blocked when stock exists — a destructive-admin exception to non-blocking (consistent with F4 spirit, like transfer-out).
- Q3: numbering via atomic upsert `INSERT ... ON CONFLICT DO UPDATE seq+1 RETURNING`, inside the UoW, Asia/Jakarta date — race-free, one round-trip.
- Q4: Company singleton, single company-wide tax rate consumed by POS via `CompanyApi.getTaxRate()`; currency-lock recorded not enforced (Finance out of scope).

## Question

Press the Core domain design: Location (store vs warehouse as one entity with a type — is that right?), Company settings (single-company, tax rate consumed by POS), and document numbering (per-location daily-reset format `ORD-<LOC>-<YYYYMMDD>-<seq>`). Are these models correct for how Ikki actually operates?

## Notes

- Raw material to press: `docs/product/02-prd-core.md`, `02-prd-core-numbering.md`. Review, don't copy.
- Existing code: `location` is the reference simple module (ADR-0001). Numbering exists (`generateNumber`, `document_sequences` table with `(prefix, locationId, date)` unique).
- Consult grilling + domain-modeling. Update `CONTEXT.md` domain terms as they crystallize.
