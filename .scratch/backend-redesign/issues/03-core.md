# 03: Core (Location, Company, Numbering)

**What to build:** Locations typed as store/warehouse with server-enforced capability; a singleton Company with a company-wide tax rate POS can read; and race-free document numbering that resets daily per location.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Location CRUD (`handle*`, RBAC): one entity, `type` store/warehouse, unique immutable `code`; store-only capability enforced by pure rules (`assertIsStore`); deactivation blocked when stock ≠ 0; ≥1 active store (ADR-0008).
- [ ] Company singleton settings; only `company.update`; single company-wide tax rate exposed via `CompanyApi.getTaxRate()` (ADR-0008).
- [ ] Numbering `PREFIX-LOCATION-YYYYMMDD-SEQ`, daily reset per location per type, Asia/Jakarta, via atomic upsert on `document_sequences` inside the UoW — no race, no gap on rollback (ADR-0008).
- [ ] Unit tests (capability asserts, number formatting) + integration (numbering under concurrency, deactivation block); `verify` + `test` pass.
