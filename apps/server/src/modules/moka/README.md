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
- Depends on `FinanceServiceModule` for account/journal operations
- Depends on external `Logger` for sync operation logging

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
