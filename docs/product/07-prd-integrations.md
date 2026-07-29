# PRD: Integrations

Specifications for external system integrations — POS sync, e-commerce, and payment gateways.

## POS Integration (Moka)

### Purpose

Ingest sales transactions from Moka POS into the ERP automatically.

### Sync model

| Aspect | Approach |
| ------ | -------- |
| Direction | One-way: Moka → ERP |
| Trigger | Periodic polling (every 5 min) + webhook (if available) |
| Idempotency | Moka transaction ID used as dedup key |
| Conflict | ERP is system of record for stock; Moka is system of record for sales |

### Data synced

| Moka entity | ERP entity | Notes |
| ----------- | ---------- | ----- |
| Transaction | Sales Order | With lines, payments, discounts |
| Item | Product | Mapped via external ID |
| Payment | Payment record | Method mapped to ERP payment methods |
| Customer | Customer | Phone-based matching |

### Key features

- Product mapping: link Moka item IDs to ERP product IDs.
- Location mapping: link Moka outlet to ERP location.
- Sales-type detection: infer from Moka order type (dine-in, GoFood, etc).
- Automatic journal entry generation on sync.
- Sync cursor: track last synced timestamp to avoid re-processing.
- Error handling: failed syncs queue for retry with exponential backoff.

### Business rules

- Duplicate transactions (same Moka ID) are silently skipped.
- Unmapped products halt the sync for that transaction (notify user).
- Stock deduction happens on sync (not at Moka sale time).
- Historical backfill: sync up to 90 days of past transactions on first setup.

## Future integrations (Phase 3+)

### E-commerce (Tokopedia, Shopee)

- Ingest orders as sales.
- Map marketplace SKU to ERP product.
- Track marketplace fees as expenses.

### Payment gateway (Midtrans, Xendit)

- Reconcile gateway settlements with ERP payment records.
- Auto-match by reference number.
- Flag discrepancies (MDR fees, chargebacks).

### Accounting export (Jurnal.id)

- Export journal entries in Jurnal.id CSV format.
- One-way push for businesses that keep Jurnal as primary books.

## Integration architecture

```
[External System] → [Adapter Layer] → [ERP Service Layer]
                         ↓
              engine/     (API calls, auth, rate limiting)
              sync/       (cursor tracking, dedup, retry)
              mapping/    (entity mapping, transformation)
```

Each integration is a module with:
- `engine/` — raw API client for the external system.
- Standard sub-entity modules for configuration, sync cursors, and mapping tables.
- No direct DB access from engine — all persistence via sibling service modules.

---

**Next:** [08-prd-analytics.md](./08-prd-analytics.md) — Analytics and reporting.
