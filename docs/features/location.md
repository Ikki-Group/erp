# Location Management

The Location Management module is a core (Layer 0) system that provides the physical structure of the ERP. It defines the operational areas specifically tailored for the Ikki Group (Ikki Coffee, Ikki Resto, and supporting warehouses) and serves as the backbone for Location-Based Access Control (LBAC).

## 1. Core Objectives
- **Operational Clarity**: Accurately mirror the client's business structure (Outlets and Storage/Warehouses).
- **Inventory Tracking**: Provide dedicated spaces to monitor raw materials (e.g., coffee beans, syrups, food ingredients) and ready-to-sell products.
- **Authorization Context**: Act as the primary data filter for User Roles via LBAC (e.g., separating Ikki Coffee data from Ikki Resto data).
- **Simplicity**: Ensure minimal friction when transferring stock between central warehouses and individual outlets.

## 2. Location Hierarchy (Simplified)

Locations are kept flat and minimal to perfectly suit a restaurant/cafe business model operations:

1.  **Warehouse (Gudang Utama)**: Centralized storage for bulk items and raw materials before they are distributed.
2.  **Outlet (Cabang/Store)**: Active selling locations (e.g., "Ikki Coffee", "Ikki Resto"). 

> **Note:** We avoid overly complex deep hierarchies (like Zone -> Rack -> Bin) in favor of a straightforward Outlet and Warehouse system to keep daily operations fast and practical.

## 3. Location Classifications

### Physical Locations
- **Internal Storage**: Standard areas for stock keeping (Warehouses & Outlet Kitchens/Bars).
- **POS / Display**: Customer-facing areas where stock (like retail coffee bags or merchandise) is available for immediate sale.

### Virtual Locations
- **Adjustment Hub / Waste**: A virtual location used to account for broken items, expired ingredients, or stock opname discrepancies.

## 4. Key Features

### Foundation for LBAC
- Every user (e.g., Barista, Chef, Cashier) is bound to one or more **Locations**.
- Transactional queries (Stock requests, Invoices, Opname) are automatically mapped to the user's active location context.
- **Root Users (Owner/Manager)** bypass these filters to view consolidated reports across all Ikki Coffee and Ikki Resto operations.

### Status Lifecycle
- **Active**: Open for daily transactions, material transfers, and sales.
- **Deactivated**: Hidden from operational menus but preserved for historical reporting (e.g., a closed popup booth or old warehouse).

## 5. Technical Architecture

### Performance & Simplicity
- **Flat Querying**: Since the hierarchy is shallow (Central Warehouse <-> Outlets), standard relational queries are highly performant without needing complex recursive SQL.
- **Caching**: Frequently accessed location lists can be cached in Redis for fast UI rendering across the app.

## 6. Next Phase Recommendations

1.  **Low-Stock Alerts per Outlet**: Dedicated minimum thresholds for Ikki Coffee vs. Ikki Resto.
2.  **Simplified Internal Transfers**: 1-click stock request forms from Outlet to Central Warehouse.
