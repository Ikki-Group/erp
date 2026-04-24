# Dashboard & Analytics

**Layer**: 3 (Aggregators - Depends on all Layer 0-2 modules)  
**Status**: MVP - KPI visibility  
**Complexity**: Medium (data aggregation, caching, real-time updates)

---

## 1. Overview

Dashboard is the executive view into the entire ERP. It aggregates sales, costs, inventory, and operational metrics into actionable insights for managers and owners. All data is scoped by location (LBAC) and time period.

---

## 2. Core Objectives

- **Real-Time KPIs**: Revenue, COGS, Gross Profit, margins at location/company level
- **Actionable Alerts**: Low stock, overdue payments, waste tracking
- **Performance Comparison**: Revenue/profitability by location, product, time period
- **Location Switching**: Toggle views between all locations, specific outlet, warehouse
- **Trend Analysis**: Daily/weekly/monthly trends to identify patterns

---

## 3. KPI Definitions

```
Revenue = Sum of all sales orders shipped (quantity × selling price)
COGS = Sum of all inventory deductions × material WAC cost
Gross Profit = Revenue - COGS
Gross Margin % = (Revenue - COGS) / Revenue × 100
Waste Cost = Sum of all waste movements × material cost
Waste % = (Waste Cost / (Revenue + Waste Cost)) × 100

Stock Value = Sum of (material quantity × material WAC cost) per location
Inventory Accuracy % = (Materials with zero variance / Total materials) × 100
Days of Stock = Stock Value / (Daily COGS × number of days)

Top Outlets = Ranked by revenue (descending)
Top Products = Ranked by units sold (descending)
Top Cost Drivers = Ranked by material COGS contribution
```

---

## 4. Dashboard Screens

### Screen 1: Executive Overview

**Top KPI Cards** (4 cards, last 30 days):
1. **Total Revenue**: Rp 45,000,000 (↑ 12% vs last month) [green trend]
2. **Total COGS**: Rp 15,000,000 (↑ 8% vs last month) [green trend]
3. **Gross Profit**: Rp 30,000,000 [highlighted]
4. **Gross Margin %**: 66.7% (↓ 0.5% vs last month) [yellow caution]

**Charts**:
- 7-Day Revenue Trend (line chart): Daily revenue with moving average
- Revenue by Location (pie chart): Ikki Coffee 60%, Ikki Resto 40%
- Revenue by Product Category (bar chart): Coffee drinks, Food, Merchandise

**Alert Panels**:
- Low Stock Items (5 items below threshold)
- Overdue B2B Invoices (2 invoices, total Rp 10M overdue)
- Critical Waste Alert (3kg milk spoiled yesterday, Rp 2.4M loss)

### Screen 2: Inventory Insights

**Stock Summary by Location**:
| Location | Total Materials | Stock Value | Accuracy | Days of Stock |
|----------|-----------------|-------------|----------|---------------|
| Gudang Utama | 45 items | Rp 125M | 98.2% | 45 days |
| Ikki Coffee | 32 items | Rp 8.5M | 95.1% | 8 days |
| Ikki Resto | 35 items | Rp 6.2M | 92.3% | 7 days |

**Low Stock Alert Table**:
| Material | Location | Current | Min | Max | Status | Action |
|----------|----------|---------|-----|-----|--------|--------|
| Fresh Milk | Ikki Coffee | 2L | 5L | 30L | 🔴 RED | Request 20L |
| Espresso | Ikki Resto | 3kg | 5kg | 20kg | 🟡 YELLOW | Monitor |

**Cost Drivers** (Top 10 materials by COGS):
1. Fresh Milk: Rp 3.2M/month (21%)
2. Espresso Beans: Rp 2.8M/month (19%)
3. Sugar: Rp 1.5M/month (10%)

### Screen 3: Product Performance

**Revenue by Product** (Top 20):
| Product | Units Sold | Revenue | COGS per Unit | Margin % | Trend |
|---------|------------|---------|---------------|----------|-------|
| Iced Latte | 1200 | Rp 6M | $1.065 | 78.7% | ↑ |
| Espresso Shot | 800 | Rp 2M | $0.45 | 82% | → |
| Iced Mocha | 600 | Rp 3.6M | $1.083 | 81.95% | ↓ |

**Profitability Matrix** (Stars/Dogs):
- High Volume + High Margin (Stars): Iced Latte
- High Volume + Low Margin (Cash Cows): [none in MVP]
- Low Volume + High Margin (Question Marks): Specialty drinks
- Low Volume + Low Margin (Dogs): [identify for removal]

### Screen 4: Location Performance

**Outlet Comparison** (Last 30 Days):
| Metric | Ikki Coffee | Ikki Resto | Warehouse |
|--------|------------|-----------|-----------|
| Revenue | Rp 27M | Rp 18M | Rp 0 (wholesale) |
| COGS | Rp 8.1M | Rp 6.9M | - |
| Margin % | 70% | 61.7% | - |
| Transactions | 1500 | 1200 | 5 (B2B) |
| Avg Transaction | Rp 18K | Rp 15K | Rp 3M |
| Stock Accuracy | 96.2% | 92.3% | 98.8% |

---

## 5. Use Cases & Workflows

### UC-001: Daily Executive Review (Owner's morning routine)

**Actors**: Owner, General Manager  
**Precondition**: Previous day's sales completed

**Steps**:
1. Owner opens Dashboard at 8:00 AM
2. Views Yesterday's KPIs:
   - Revenue: Rp 1.8M (normal for Tuesday)
   - COGS: Rp 600K
   - Margin: 66.7%
3. Checks alerts:
   - Low Stock: Fresh Milk at Ikki Coffee (2L, below 5L minimum)
   - No overdue payments
   - No critical waste
4. Reviews Top Sellers: Iced Latte trending strong
5. Checks Inventory Accuracy: Ikki Coffee at 96.2% (good)
6. Decides: "Request warehouse to send milk to Ikki Coffee today"
7. Scrolls to "Pending Requests" panel, approves transfer request
8. Leaves for meetings, confident in operations

**Business Rules**:
- Yesterday's data finalized by 7:00 AM (batch job)
- Only shows data for locations user has LBAC access to
- Can toggle between locations with dropdown

---

### UC-002: Identify Underperforming Products (Monthly review)

**Actors**: Manager, Product Team  
**Precondition**: At least 30 days of sales data

**Steps**:
1. Manager filters: Last 30 days, Ikki Coffee location
2. Views "Product Performance" chart
3. Identifies "Dogs" (low volume + low margin):
   - Iced Tea: 45 units/month, margin 70% (but slow seller)
   - Bagel: 30 units/month, margin 35% (low margin + low volume)
4. Decision: Remove Bagel from menu, keep Iced Tea (potential)
5. Removes Bagel, updates Product.is_active = false
6. Dashboard auto-updates next refresh (cache invalidated)

---

### UC-003: Variance Investigation (When opname discrepancies arise)

**Actors**: Warehouse Manager, Finance  
**Precondition**: Stock opname just completed with large variance

**Steps**:
1. Opname reported: 3% milk variance (physical count lower than expected)
2. Warehouse Manager opens Dashboard → Inventory Insights
3. Filters: Material "Fresh Milk", Gudang Utama
4. Views Stock Ledger over last 7 days:
   - Inbound: 100L (GRN on 2026-04-18)
   - Transfers out: 120L (to Ikki Coffee on 2026-04-19, 2026-04-20)
   - Waste: 2L (logged on 2026-04-21)
   - Expected balance: 100 - 120 - 2 = -22L (ERROR: NEGATIVE!)
5. Investigation reveals:
   - GRN of 100L recorded, but only 95L physically received (transcription error)
   - Actual balance should be: 95 - 120 - 2 = -27L (also negative!)
   - Correction: First GRN was for 115L (not 100L)
   - Adjusted balance: 115 - 120 - 2 = -7L (still negative)
6. Further investigation: Transfer on 2026-04-20 was 50L (not 70L)
   - Corrected ledger: 115 - 120 - 50 - 2 = -57L (still wrong somehow)
7. Admin creates corrective StockMovement (adjustment) to match opname physical count

---

### UC-004: Waste Analysis (Find operational inefficiencies)

**Actors**: Kitchen Manager, Operations  
**Precondition**: Waste entries logged daily

**Steps**:
1. Manager opens Dashboard → Inventory → Waste % metric
2. Views: Waste % = 2.1% (healthy target: 2%)
3. Drills into waste by reason:
   - Expiration: 1.2% (spoilage, needs better stock rotation)
   - Damage: 0.6% (broken equipment, spillage)
   - Taste test: 0.3% (quality control)
4. Top waste materials:
   - Fresh Milk: Rp 800K this month (30% of waste cost)
   - Vegetables: Rp 600K (25% of waste cost)
5. Decision: Implement FIFO (First-In-First-Out) for milk to reduce expiration
6. Purchases shelf-life tracking labels for milk cartons
7. Monitors waste % next month

---

## 6. Data Model & Caching

### DashboardMetrics Table (Pre-calculated, refreshed nightly)

```sql
CREATE TABLE dashboard_metrics (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  metric_date DATE,
  revenue DECIMAL(15, 2),
  cogs DECIMAL(15, 2),
  gross_profit DECIMAL(15, 2),
  gross_margin_pct DECIMAL(5, 2),
  waste_cost DECIMAL(12, 2),
  waste_pct DECIMAL(5, 2),
  transaction_count INTEGER,
  CONSTRAINT unique_location_date UNIQUE(location_id, metric_date)
)

CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(metric_date);
```

### Caching Strategy

```typescript
const DASHBOARD_CACHE_KEYS = {
  METRICS: (locationId: number, days: number) => `dashboard.metrics.${locationId}.${days}d`,
  LOW_STOCK: (locationId: number) => `dashboard.low_stock.${locationId}`,
  TOP_PRODUCTS: (locationId: number, days: number) => `dashboard.top_products.${locationId}.${days}d`,
  WASTE: (locationId: number, days: number) => `dashboard.waste.${locationId}.${days}d`,
}

// Cache TTL: 1 hour (refreshed every hour)
// Nightly batch (3:00 AM): Pre-calculate daily metrics
// User load: Query cache (sub-second response)
```

---

## 7. API Endpoints & Routes

### GET `/dashboard/overview`
**Query**: `?location_id=1&period=30` (days)
**Response**:
```json
{
  "kpis": {
    "revenue": { "value": 45000000, "trend": "+12%" },
    "cogs": { "value": 15000000, "trend": "+8%" },
    "gross_profit": 30000000,
    "gross_margin_pct": 66.7
  },
  "alerts": {
    "low_stock": 5,
    "overdue_invoices": 2,
    "waste_items": 3
  }
}
```

### GET `/dashboard/inventory`
**Query**: `?location_id=1&sort=stock_value`
**Response**: Stock summary, low stock table, cost drivers

### GET `/dashboard/products`
**Query**: `?location_id=1&period=30&limit=20`
**Response**: Top products, profitability matrix data

### GET `/dashboard/locations`
**Query**: `?period=30`
**Response**: Location comparison table

### GET `/dashboard/waste-analysis`
**Query**: `?location_id=1&period=30`
**Response**: Waste by reason, waste by material, trends

---

## 8. Integration Points

### Upstream Dependencies (reads from):
- **Sales** (Layer 2): Revenue, transaction count
- **Inventory** (Layer 2): Stock movements, waste, current stock
- **Recipe** (Layer 2): COGS per product
- **Material** (Layer 1): Material costs, stock value
- **Location** (Layer 0): Location filtering (LBAC)
- **IAM** (Layer 1): User permissions for LBAC

### Downstreams:
- None (dashboard is read-only aggregator)

---

## 9. Implementation Notes

### Batch Processing (Nightly 3:00 AM)

```typescript
// Run via cron job
async function refreshDailyMetrics() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  for (const location of allLocations) {
    const revenue = await salesService.getRevenueByDate(location.id, yesterday)
    const cogs = await inventoryService.getCOGSByDate(location.id, yesterday)
    
    await dashboardRepo.upsertMetrics({
      location_id: location.id,
      metric_date: yesterday,
      revenue,
      cogs,
      gross_profit: revenue - cogs,
      gross_margin_pct: (revenue - cogs) / revenue * 100,
    })
  }
  
  // Invalidate all dashboard caches
  await cache.deleteMany({ keys: Object.values(DASHBOARD_CACHE_KEYS) })
}
```

### LBAC Filtering

```typescript
// Dashboard auto-filters by user's locations
async handleGetMetrics(filter: DashboardFilterDto, userId: number) {
  const userLocations = await getUserAssignedLocations(userId)
  
  // If user at single location, show that location
  // If user at multiple, show aggregated + per-location breakdown
  // If root user, show all
  
  const locationIds = userId === 1 ? allLocationIds : userLocations
  return dashboardService.getMetrics(locationIds, filter)
}
```

---

## 10. Future Enhancements (Phase 2+)

- **Custom Dashboards**: Users create personal dashboard layouts
- **Alert Configuration**: Set thresholds for low stock, variance %, waste %
- **Email Reports**: Daily/weekly digest emailed to manager
- **Predictive Analytics**: Forecast stock needs, predict sales trends
- **Comparison Reports**: YoY, month-over-month growth
- **Export to Excel**: Download metrics for external reporting
- **Mobile Dashboard**: Simplified view for phones
- **Real-Time Updates**: WebSocket push for live KPI changes

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: All Layer 0-2 modules  
**Estimated Implementation**: 8-10 hours
