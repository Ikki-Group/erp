# Dashboard Module

## Purpose

This module provides dashboard analytics and user settings.

## Architecture Pattern

### Settings Service
- Uses domain services (iam, location) for business logic
- Follows standard service pattern with cache

### Analytics Service (Read-Model)
- **Direct DB access**: Performs complex aggregation queries
- **Pattern**: Read-model/analytics layer (similar to reporting module)
- **Cache**: Uses cache with TTL for performance
- **No mutations**: All methods are read-only

## Why Analytics Uses Direct DB Access

Analytics queries are:
- Complex aggregations (P&L, top sales, etc.)
- Join multiple tables across domains
- Not simple CRUD operations
- Benefit from optimized SQL queries
- Cached with TTL for performance

Adding these aggregations to domain services would:
- Bloat service interfaces
- Mix concerns (domain logic vs analytics)
- Make services harder to maintain

This is a deliberate architectural choice for analytics/read-models.
