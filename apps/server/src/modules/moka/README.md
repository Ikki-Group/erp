# Moka Integration Module

## Purpose

This module handles **third-party integration** with Moka POS system for syncing sales data.

## Architecture Pattern

This is an **integration module** that follows the **Ports & Adapters** pattern:

- **Configuration**: Stores Moka credentials (email, password) per outlet
- **Sync Cursor**: Tracks synchronization state for incremental updates
- **Transformation**: Converts Moka data format to internal domain format
- **History**: Logs all sync operations for audit and debugging

## Integration Scope

Based on the Moka development plan:

- **Product Sync**: Manual trigger - fetches products and categories from Moka
- **Sales Sync**: Cronjob - automatically syncs sales transactions
- **Applies to**: Locations/outlets that have products configured

## Services

- `MokaConfigurationService` - Manages Moka credentials per location
- `MokaSyncCursorService` - Tracks sync state and cursors
- `MokaScrapHistoryService` - Logs sync operations
- `MokaTransformationService` - Transforms Moka data to domain format
- `MokaScrapService` - Orchestrates sync operations

## Special Architecture Notes

### Direct DB Access

The `MokaTransformationService` receives `db` directly (not through repos) because:

- It performs bulk data transformation and insertion
- May need to write to multiple domain tables (finance accounts, journals)
- Transformation logic is complex and benefits from direct transaction control
- This is acceptable for integration layers that are boundary adapters

### Dependencies

- Depends on `FinanceModule` for account/journal operations
- Depends on external `Logger` for sync operation logging

### `engine/` — Moka POS API Adapter (Intentional Exception)

The `engine/` folder (`moka-auth.service.ts`, `moka-category.service.ts`, `moka-engine.ts`,
`moka-product.service.ts`, `moka-sales.service.ts`, `moka-utils.ts`) is a **pure third-party
API adapter** that calls Moka's external POS API directly (authentication, category/product
fetch, sales fetch).

It intentionally has **no `.contract.ts`, `.repo.ts`, `.module.ts`, or `index.ts`**, and is
**exempt from the standard CRUD module template**, because:

- It has no persisted entity of its own — it only calls Moka's remote HTTP API and returns
  raw response shapes (see `scrap/scrap-raw.types.ts`).
- There is nothing to store via a repo/port — all "repo-like" persistence for Moka data lives
  in the `configuration/`, `scrap/scrap-history/`, and `scrap/scrap-sync-cursor/` sub-entities,
  which the `scrap/` orchestration layer (`MokaScrapService`) already wires together.
- Forcing a contract/repo/module.ts onto a stateless API-client layer would add indirection
  with no benefit.

This is a deliberate, documented exception to `docs/server/MODULE_STANDARD.md`, consistent
with how `auth/` has no `.repo.ts` (delegates persistence entirely to other modules) and
`tool/` has no `.contract.ts`/`.repo.ts` (pure orchestration, no owned entity).

## Sync Flow

1. **Manual Trigger**: Admin initiates product/category sync via UI
2. **Cronjob**: Sales sync runs automatically on schedule
3. **Cursor Tracking**: Each sync updates cursor to enable incremental syncs
4. **Transformation**: Moka data is transformed to internal format
5. **Persistence**: Transformed data is saved to relevant domain tables
6. **History**: Sync operation is logged for audit

## Future Enhancements

- Support two sync methods: upload JSON vs fetch from machine
- Deeper integration into sales feature
- Retry logic for failed syncs
- Webhook support for real-time sync
