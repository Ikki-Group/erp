# Dashboard & Analytics

The Dashboard & Analytics module (Layer 3 - Aggregator) provides High-Level Management views that aggregate data across all underlying ERP modules. For Ikki Group (Ikki Coffee & Ikki Resto), this is the primary screen the Owner and General Manager will interact with daily to make business decisions.

## 1. Core Objectives
- **Holistic View**: Combine Sales Revenue (via Moka) and Inventory Costs (via Recipes & Materials) into real-time Gross Profit Margin metrics.
- **Actionable Insights**: Highlight completely depleted or low-stock items requiring immediate attention.
- **Location Switching**: Allow the Owner to toggle data views between "All Branches", "Ikki Coffee Only", or "Ikki Resto Only" using LBAC principles.

## 2. Key Features

### KPI metric cards
- **Total Revenue (Today/Month)**: Pulled from the Moka Sync Engine representing gross sales.
- **Total COGS (HPP)**: The accumulated cost of materials consumed by those sales, calculated by the Recipe Engine.
- **Gross Profit Margin**: `(Total Revenue - Total COGS) / Total Revenue`.
- **Top Outlet Performance**: Compare revenue generation between Ikki Coffee vs Ikki Resto.

### Operational Charts (Recharts)
- **7-Day Revenue Trend**: A line chart showing daily sales volume peaks (e.g., weekends vs weekdays).
- **Highest Volume Products (Top Sellers)**: Bar chart showing the most frequently sold menu items.
- **Top Cost Drivers**: A chart showing which raw materials (e.g., Fresh Milk, Ribeye Steak) are consuming the most budget, helping management decide if they need to renegotiate supplier prices.

### Immediate Action Panels
- **Low Stock Alerts Table**: A dedicated data grid showing materials that have fallen below their "Minimum Threshold" at specific locations (e.g., *Ikki Coffee Bar* only has 2kg of Espresso Beans left).
- **Pending Internal Requests**: Quick approval buttons for Outlet Managers to approve stock transfers from *Gudang Utama* to their specific outlet.

## 3. Technical Architecture (Proposed)

### Performance Optimization
- **Data Caching**: Analytics queries involving `JOIN`s across millions of rows (Sales + Recipes + Materials) will freeze the database if run globally. Caching results via Upstash Redis is mandatory.
- **Nightly Refresh**: Heavy analytical aggregations (like "Monthly Profit Margin") should be calculated in a background cron job at 3:00 AM and stored in a summary table, so the dashboard loads instantly for the Owner at 8:00 AM.
- **Aggregator Layer Isolation**: The `DashboardServiceModule` collects pre-calculated totals from lower-level services (`salesService.getRevenueToday()`, `inventoryService.getLowStock()`) rather than writing its own complex SQL joins into their tables.

## 4. Next Phase Recommendations
1. **Waste vs. Sales Ratio**: Track the total financial cost of "Spoiled/Broken" items vs "Sold" items to identify operational inefficiencies in the kitchen/bar.
2. **Sales Target Tracking**: Provide a visual progress bar tracking current month's revenue against predefined targets for Ikki Resto and Ikki Coffee.
