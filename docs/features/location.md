# Location Management

The Location Management module is a core (Layer 0) system that provides the hierarchical physical structure of the ERP. It defines where physical products are stored and serves as the backbone for Location-Based Access Control (LBAC).

## 1. Core Objectives
- **Spatial Hierarchy**: Precisely represent physical warehouses in a structured tree format.
- **Inventory Granularity**: Enable item tracking down to specific Bins or Racks.
- **Authorization Context**: Act as the primary data filter for User Roles via LBAC.
- **Accurate Classification**: Differentiate between physical storage, transit areas, and virtual reconciliation points.

## 2. Location Hierarchy (Tree Structure)

Locations are organized using a recursive parent-child relationship to mirror physical reality:
1.  **Warehouse / Branch**: The primary administrative unit (e.g., "Jakarta Central Hub", "Bandung Warehouse").
2.  **Zone**: Specific functional areas (e.g., "Cold Storage", "Bulk Area", "Hazardous Materials").
3.  **Rack / Aisle**: Organizational structures within a zone.
4.  **Bin / Slot**: The smallest addressable physical unit where items are stored.

## 3. Location Classifications

### Physical Locations
- **Internal Storage**: Standard areas for long-term or short-term stock keeping.
- **Transit / Shipping**: Temporary staging areas for Goods Receipts (Inbound) or Deliveries (Outbound).
- **POS / Display**: Customer-facing areas where stock is available for immediate retail sale.

### Virtual Locations
- **Quarantine / Damaged**: Restricted locations for items awaiting inspection or disposal.
- **Lost & Found**: Tracking for physical stock discrepancies discovered during audits.
- **Adjustment Hub**: A system-level virtual location used to balance stock during "Stock Opname" (Cycle Counting).

## 4. Key Features

### Foundation for LBAC
- Every user is bound to one or more **Locations**.
- All transactional queries (Invoices, Transfers, Stock Ledgers) are automatically scoped by the user's active location context.
- **Root Users** bypass these filters for a consolidated global view.

### Materialized Path Navigation
- System uses hierarchical pathing (e.g., `JKT-01/ZONE-A/RACK-05`) for high-speed child lookups and reporting aggregation across sub-locations.

### Status Lifecycle
- **Active**: Open for all incoming and outgoing stock transactions.
- **Locked / Maintenance**: Restricted from stock movement (useful during physical cleaning or inventory audits).
- **Deactivated**: Hidden from operational menus but preserved for historical reporting.

## 5. Technical Architecture (Proposed)

### Performance Optimization
- **Caching Level**: Cached location tree in Redis for rapid application-wide navigation components.
- **Recursive Querying**: Optimized SQL using Common Table Expressions (CTE) or Materialized Paths for low-latency tree traversal.

### Data Integrity
- **Transactional Safety**: Strict foreign key constraints prevent deleting locations that contain active inventory balances.
- **Semantic Validation**: Logic to prevent illogical hierarchies (e.g., placing a Warehouse inside a Bin).

## 6. Roadmap & Next Phase Recommendations

1.  **Unique QR/Barcode Labels**: Automated generation of labels for every specific Bin to support handheld scanning workflows.
2.  **Warehouse Capacity Management**: Define maximum volume/weight limits per location to prevent physical overstocking.
3.  **Spatial Mapping**: Visual floor plan integration to help warehouse staff locate items efficiently.
4.  **Auto-Replenishment Logic**: Trigger internal transfers between Zones based on minimum threshold settings.
