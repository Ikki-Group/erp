# Reporting Module

## Purpose

This module provides **read-model/analytics** services for reporting across domains.

## Architecture Pattern

This module follows the **CQRS Read-Model** pattern:
- **No cache**: Services query the database directly for optimal analytics performance
- **No mutations**: All services are read-only
- **Materialized views**: Reports are computed on-demand from the database
- **Domain-agnostic**: Does not enforce business rules, only aggregates data for reporting

## Services

- `SalesReportingService` - Sales analytics and reports
- `FinanceReportingService` - Financial reports and summaries
- `InventoryReportingService` - Inventory analytics
- `CrmReportingService` - Customer relationship analytics
- `PaymentReportingService` - Payment analytics

## Why No Cache?

Reporting queries are:
- High-volume and compute-intensive
- Often time-filtered (daily, weekly, monthly)
- Not latency-critical (admin/reports UI)
- Benefit from fresh data without cache invalidation complexity

If caching becomes necessary for specific reports, consider:
- Time-based TTL cache (e.g., 5-15 minutes)
- Scheduled materialized view refreshes
- Separate analytics database (OLAP)

## Dependencies

This module depends only on `DbClient` and does not depend on other domain services, as it reads directly from the database tables.

## Future Enhancements

- Add scheduled report generation
- Implement materialized views for heavy queries
- Consider separate analytics database for performance
