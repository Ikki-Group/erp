# Business Workflows & Operational Procedures

> **Purpose**: Document daily, weekly, and monthly operational workflows to guide system design

---

## 1. Daily Operations Cycle

### 1.1 Morning Stock Check & Ordering (06:00 - 09:00)

#### Scenario: Outlet Manager at Ikki Coffee Kitchen

**Current Pain**: Calls warehouse at 6 AM, waits 15 mins for response, gets fragmented info via WhatsApp

**Desired Flow (with ERP)**:

1. **Open App** (2 min)
   - Login (email/password)
   - Dashboard shows: "Ikki Coffee Kitchen" + "Stock as of 06:15 AM"
   - Color-coded stock status: Green (safe) | Yellow (low) | Red (critical)

2. **Quick Stock Check** (3 min)
   - Scroll through key ingredients: Espresso, Milk, Sugar, Cups, Lids
   - System shows: Current Qty | Min Threshold | Days to Stockout
   - Visual: Milk (150L) | Min: 100L | 2.1 days
   - Status bar: Yellow (approaching minimum)

3. **Create Stock Request** (2 min)
   - Click "Request Stock"
   - System pre-fills: Milk, suggests qty: 200L (2x reorder qty)
   - Manager can adjust qty
   - Submit request: timestamp logged, status: "pending warehouse"

4. **Warehouse Receives Request** (immediate)
   - Warehouse Manager alerted: "Stock request from Ikki Coffee"
   - Warehouse checks central stock
   - Confirms: 200L milk available in warehouse
   - Packs & prepares for delivery

5. **Outlet Receives Delivery** (by 08:30)
   - Driver delivers 200L milk to Ikki Coffee
   - Manager scans barcode or manually confirms receipt
   - System updates: Ikki Coffee stock += 200L, Warehouse stock -= 200L
   - Movement logged: "Transfer from Warehouse to Ikki Coffee - 200L Milk"

6. **Service Starts** (09:00)
   - Kitchen ready for service
   - Staff can see real-time stock via app (on tablet in kitchen)
   - As orders come in, stock auto-deducts (POS integration, Phase 2)

**System Records**:
- Stock request: timestamp, requester, qty, status
- Stock transfer: from location, to location, material, qty, driver, delivery time
- Stock movement ledger entry: +200L milk to Ikki Coffee

---

### 1.2 Service Hours: Sales & Consumption (09:00 - 21:00)

#### Scenario A: Iced Latte Sale at Ikki Coffee

**Current Pain**: Staff manually deducts items from checklist; mistakes common; no real-time COGS visibility

**Desired Flow (with ERP)**:

1. **Customer Orders Iced Latte**
   - POS registers sale: Iced Latte, $5.00
   - (Phase 2) POS syncs to ERP automatically

2. **Recipe Deduction (Automatic)**
   - ERP recipe: Iced Latte = 18g espresso + 150ml milk + 1 cup + 1 lid + 1 straw
   - System deducts from Ikki Coffee Kitchen stock (real-time)
   - Ledger entry: "Recipe: Iced Latte sold at Ikki Coffee"

3. **COGS Calculated**
   - Espresso cost: 18g × $0.50/g = $0.90
   - Milk cost: 150ml × $0.08/ml = $1.20
   - Cup/lid/straw cost: $0.30
   - Total COGS = $2.40
   - Gross margin on $5 sale: ($5 - $2.40) / $5 = 52%

4. **Stock Alert (if triggered)**
   - If milk stock falls below reorder point (100L)
   - System sends alert: "Milk stock low: 45L remaining (< 100L threshold)"
   - Manager phone notification: "Low stock alert"
   - Quick action: "Request stock"

**System Records**:
- Sale entry: product, qty, price, location, timestamp, COGS
- Stock movement: -18g espresso, -150ml milk, -1 cup, etc.
- Running daily total: "Today's COGS: $1,240 | Margin: 54%"

---

#### Scenario B: Waste Entry (Manual Logging)

**Current Pain**: Spoilage/waste not tracked; costs hidden; no accountability

**Desired Flow (with ERP)**:

1. **During Service**: Barista drops milk pitcher
   - Finds Ikki Coffee waste logger on tablet (quick-access icon)
   - Quick form: Material dropdown, Qty, Reason
   - Enters: Milk, 500ml, "dropped/broken"
   - Submits (timestamp auto-recorded)

2. **Alternative Scenario**: Milk expires
   - Chef checks expiration: "Best by 2026-04-25" (expired)
   - Logs waste: Milk, 200ml, "spoiled"

3. **System Processing**:
   - Stock deducted: Ikki Coffee milk -500ml
   - Waste ledger entry: Material | Location | Qty | Reason | Cost | User | Time
   - Waste cost calculated: 500ml × $0.08/ml = $4.00
   - Daily waste summary updated

4. **Manager Review**:
   - Evening dashboard shows: "Today's waste: $34.50 (0.8% of revenue)"
   - Trend: Milk spoilage increasing (was 0.5% last week)
   - Alert: "Investigate milk spoilage - trend increasing"

**System Records**:
- Waste entry: material, location, qty, reason code, cost, user, timestamp
- Daily waste summary: total cost, % of revenue, breakdown by reason
- Waste trend analysis: 7-day, 30-day, YTD

---

### 1.3 End of Shift: Physical Count & Adjustments (20:00 - 21:00)

**Current Pain**: Manual stock opname takes 45 mins, error-prone, manager approval delayed until next day

**Desired Flow (with ERP)**:

1. **Shift Supervisor Initiates Opname**
   - App screen: "Start Stock Opname for Ikki Coffee Kitchen?"
   - System generates digital sheet: Milk | Espresso | Cups | etc.
   - Shows "Expected Stock (from system)" for each item

2. **Staff Counts Physical Stock**
   - 2-3 staff members count simultaneously (each counts separate section)
   - App shows: Material | Expected | Physical (input field)
   - Staff enters physical count: Milk [150 liters]
   - App auto-calculates variance: Physical (150) vs. Expected (148) = +2L
   - Status: Green (±5% ok)

3. **High Variance Investigation** (if triggered)
   - Example: Espresso expected 12kg, physical 10kg = -2kg (-17%)
   - Status: Red (> 5%)
   - System flags: "Investigation required"
   - Manager notes: "Espresso grinder issue - recalibrated after 2pm"

4. **Manager Review & Approval**
   - Manager views opname summary: Total variance 2.3% (acceptable)
   - Green items (✓): Milk, Sugar, Cups
   - Yellow items (?): Espresso (-2kg) - noted
   - Manager action: "Approve" or "Reject (request recount)"
   - Approves with timestamp

5. **System Adjustments**
   - System creates adjustment movements:
     - Milk: +2L (system records the gain)
     - Espresso: -2kg (system records the loss)
   - Stock ledger updated with adjustment entries
   - Opname marked "Complete"

6. **Data Locked**
   - Opname data cannot be modified after approval
   - Historical record preserved for audit
   - Accuracy metric updated: "Accuracy: 97.7%" (2.3% variance)

**System Records**:
- Opname sheet: expected stock per material
- Physical counts: entered by staff (timestamp, user)
- Variance analysis: auto-calculated, flagged if >5%
- Approval: manager sign-off, timestamp
- Adjustment movements: created automatically
- Accuracy metric: trended over time (daily, weekly, monthly)

---

## 2. Weekly Operations

### 2.1 Purchasing Review & Order Planning (Every Monday 10:00 AM)

**Participants**: Procurement Officer (Head Office), Warehouse Manager

**Workflow**:

1. **Demand Forecast** (15 min)
   - Procurement pulls weekly report: Material consumption by location
   - Report shows: "Milk usage last 7 days: 1,200L vs. 1,100L previous week"
   - Trend: +9.1% (possibly weekend increase)
   - Forecast: Expected consumption next 7 days: 1,280L (with 15% buffer)

2. **Current Stock Review** (10 min)
   - Warehouse stock: Milk = 450L
   - Days of stock: 450L / (1,280L ÷ 7) = 2.5 days
   - Reorder point: 500L minimum
   - Status: BELOW minimum (action required)

3. **Create Purchase Order** (10 min)
   - Procurement creates PO:
     - Supplier: "PT Milk Producer"
     - Material: Milk, Qty: 2,000L
     - Requested delivery: 2026-04-28 (48h from now)
     - Unit price: $0.06/L (negotiated rate)
     - PO total: $120
   - PO number: "PO-2026-04-24-001" (auto-generated)
   - PO sent to supplier via email (auto-generated)

4. **Review Supplier Performance** (10 min)
   - Procurement views supplier metrics:
     - PT Milk Producer: 94% on-time delivery, avg price $0.06/L, quality score: 9.2/10
     - Consider alternative: PT Dairy (88% on-time, $0.055/L, score: 8.5/10)
   - Decision: Continue with PT Milk Producer (reliability > 2% savings)

5. **Approval by Finance** (async)
   - Finance reviews: PO total within budget, unit price within contract
   - Finance approves or requests review

**System Records**:
- Consumption history: material, location, qty per day, 30-day trend
- PO created: supplier, material, qty, price, delivery date, status
- Supplier performance: on-time %, price variance, quality score
- Budget tracking: cumulative PO amount vs. monthly budget

---

### 2.2 Stock Accuracy Review (Every Friday 2:00 PM)

**Participants**: Finance, Outlet Managers, Warehouse Manager

**Workflow**:

1. **Pull Accuracy Report**
   - Weekly accuracy dashboard: "Avg accuracy 97.2% (target: 98%)"
   - By location:
     - Ikki Coffee: 98.1% (✓ good)
     - Ikki Resto: 96.8% (⚠ watch)
     - Warehouse: 97.5% (✓ acceptable)

2. **Identify Problem Locations**
   - Ikki Resto variance too high
   - Drill down: Which materials are problematic?
     - Meat products: 94.3% (spoilage?)
     - Dairy: 95.8% (waste?)
     - Dry goods: 98.9% (ok)

3. **Root Cause Analysis**
   - Meet with Ikki Resto Manager
   - Question: "Why is meat variance so high?"
   - Manager: "New prep process; some portions wasted during training"
   - Action: Retraining session + improved portion control

4. **Corrective Action Plan**
   - Implement: Standard portioning guide, waste categorization
   - Next week re-measure: expect improvement to 97%+
   - Owner: Ikki Resto Manager
   - Deadline: 2026-05-01

**System Records**:
- Accuracy trend: daily, weekly, monthly aggregation
- By-location accuracy breakdown
- Root cause tracking: linked to corrective actions
- Follow-up status: open, in-progress, closed

---

## 3. Monthly Operations

### 3.1 Financial Close & Reporting (Month-End, Day 5)

**Participants**: Finance, Outlet Managers, Executive Team

**Workflow**:

1. **Verify Data Integrity** (2 hours)
   - Finance runs integrity checks:
     - All stock movements recorded? ✓
     - All opname closures completed? ✓ (2026-04-20 all locations)
     - All waste entries logged? ✓ (no gaps in daily records)
     - All cost prices updated? ✓ (last GRN: 2026-04-18)

2. **Generate Ledger Report** (1 hour)
   - Stock ledger query: 2026-04-01 to 2026-04-30
   - For each material:
     - Opening balance (2026-03-31)
     - Inbound (GRN qty + cost)
     - Outbound (recipe deduction qty + cost)
     - Adjustments (opname variance)
     - Closing balance (2026-04-30)
     - Weighted Average Cost (WAC) per unit

3. **Calculate COGS** (1 hour)
   - COGS = Σ (material qty consumed × WAC)
   - Total COGS April: $12,450
   - Breakdown by location:
     - Ikki Coffee: $7,200 (revenue $13,500, margin 46.7%)
     - Ikki Resto: $5,250 (revenue $10,800, margin 51.4%)

4. **Waste Analysis** (30 min)
   - Total waste cost April: $340
   - Waste as % of revenue: 1.4% (target: <1.5%, acceptable)
   - By category:
     - Spoilage: 65% (milk, meat)
     - Dropped/broken: 25% (cups, plates)
     - Test tasting: 10% (quality control)
   - Recommendation: Improve milk storage (temperature alert? Phase 2)

5. **Profitability by Item** (1 hour)
   - Top 5 profitable items (highest margin):
     1. Affogato: 62% margin
     2. Espresso: 58% margin
     3. Cappuccino: 55% margin
     4. Croissant (sourced): 48% margin
     5. Iced Tea: 64% margin
   - Bottom 5 (lowest margin):
     1. Bottled Water: 18% margin (low COGS, low selling price)
     2. Whole Milk (retail): 22% margin
     3. Coffee Beans (bulk): 25% margin
   - Action: Consider menu engineering (promote high-margin items)

6. **Dashboard Report** (30 min)
   - Finance generates April Performance Dashboard:
     - Revenue: $24,300 (vs. budget $24,000, +0.3%)
     - COGS: $12,450 (vs. budget $12,600, -1.2%, favorable)
     - Gross Profit: $11,850 (48.8% margin, vs. budget 47.5%)
     - Waste: $340 (1.4%, vs. budget 1.5%)
     - Stock accuracy: 97.2% (target 98%)
     - Stock turnover: 4.2x (monthly consumption / avg inventory)

7. **Executive Review**
   - CFO reviews dashboard with Ikki Group leadership
   - Insights: Margin improved vs. prior month (+1.8%) due to waste reduction
   - Concerns: Stock accuracy in Ikki Resto - investigate
   - Next month focus: Target 98%+ accuracy, maintain margin >48%

**System Records**:
- Ledger finalized (locked, cannot modify after approval)
- COGS report: by material, by location, total
- Waste report: cost, % of revenue, breakdown by reason
- Profitability report: by product, by location, margin analysis
- Dashboard metrics: KPIs, trends, variance from budget

---

### 3.2 Supplier Performance Review (Every 3 Months)

**Participants**: Procurement Officer, Finance, Supplier Relationship Manager

**Workflow** (TBD Phase 2 - Purchasing module):

---

### 3.3 Menu Engineering & Optimization (Every 3 Months)

**Participants**: Chef, Manager, Finance, Executive Team

**Workflow**:

1. **Analyze Item Profitability**
   - Pull 3-month profitability report (per item, per location)
   - Focus: Margin %, contribution %, velocity (units sold)
   - Matrix:
     - High margin + high velocity = "Stars" (promote further)
     - High margin + low velocity = "Puzzles" (examine demand drivers)
     - Low margin + high velocity = "Workhorses" (optimize cost)
     - Low margin + low velocity = "Dogs" (consider removal)

2. **Cost Optimization**
   - Example: "Latte" margin declined from 54% to 51%
   - Root cause: Milk cost increased $0.02/L
   - Options:
     a) Raise price (customer impact?)
     b) Reduce portion (quality impact?)
     c) Find cheaper supplier (quality risk?)
   - Decision: Negotiate better milk pricing with current supplier

3. **Menu Adjustments**
   - Add: High-margin seasonal item (if demand exists)
   - Remove: "Dogs" (low margin, low volume)
   - Redesign: Reduce portion size on low-margin items? Adjust price?

4. **Implementation**
   - Update recipe with new portion sizes/costs
   - Train staff on new recipes
   - Update POS menu/prices
   - Monitor: Track sales & margin change

**System Records**:
- Historical product performance: sales, COGS, margin, volume
- Menu change history: what changed, when, impact on sales
- Cost change tracking: supplier price changes, impact on margin

---

## 4. Operational Constraints & Business Rules

### 4.1 Inventory Rules

| Rule | Rationale | System Enforcement |
|------|-----------|-------------------|
| No negative stock | Physical impossibility | API rejects movement if qty > available |
| Stock cannot move without record | Audit trail required | StockMovement entry created before location change |
| Opname must complete before month-close | Data integrity | System blocks month-close if pending opname |
| High variance (>5%) requires approval | Quality control | Adjustment auto-created only after manager sign-off |
| Waste entry needs reason code | Root cause analysis | Waste logger UI makes reason mandatory |
| Cost price can only update via GRN | Prevent arbitrary changes | No manual cost edits; only GRN updates cost |

### 4.2 Permission Rules

| Role | Can Do | Cannot Do |
|------|--------|----------|
| **Staff** | Log waste, count opname, view own location stock | Edit opname counts after submitted, approve variances |
| **Manager** (Outlet) | Approve opname, create stock requests, view outlet profitability | Approve high-variance adjustments, view other locations (except read) |
| **Manager** (Warehouse) | Process transfers, conduct opname, manage warehouse stock | Create POs, delete stock records |
| **Procurement** | Create POs, review supplier metrics, monitor costs | Approve expense adjustments, delete GRNs |
| **Finance** | Approve month-close, review profitability, COGS validation | Modify ledger after finalization, create stock movements |
| **Admin** | All operations, user management, system settings | [None, full access] |

### 4.3 Timing Constraints

| Operation | Expected Duration | SLA |
|-----------|-------------------|-----|
| Stock request to delivery | 4 hours | < 6 hours (same-day delivery) |
| Opname entry to approval | 30 minutes | < 1 hour (within shift) |
| Monthly ledger finalization | < 2 hours | Day 5 of month |
| Supplier delivery confirmation | 15 minutes | < 30 min (upon receipt) |
| Waste entry to audit | Real-time | Within 5 minutes of logging |

---

## 5. Exception Handling

### 5.1 Stock Discrepancy Resolution

**Scenario**: Physical count 20% below system record

**Process**:
1. Immediate: Halt stock movements to location (lock inventory)
2. Investigation: Was there data entry error? System bug? Physical loss/theft?
3. Verification: Recount affected materials (double-check)
4. Root cause: Document suspected cause (e.g., "manual deduction during system downtime")
5. Approval: Manager + Finance approve adjusted balances
6. Implementation: Create adjustment movement
7. Prevention: Implement control to prevent recurrence

**System Support**:
- Exception log: Track all high-variance opname events
- Investigation notes: Free-form text field for root cause
- Approval workflow: Multi-step sign-off required
- Remediation tracking: Actions taken to prevent recurrence

### 5.2 Delayed Stock Transfer

**Scenario**: Stock requested at 06 AM, not received by 14:00 (8 hours late)

**Process**:
1. Alert: Manager receives notification "Stock transfer delayed"
2. Escalation: If >4 hours overdue, escalate to Warehouse Manager
3. Communication: Warehouse confirms ETA or acknowledges issue
4. Root cause: Traffic? Picking error? Prioritization?
5. Resolution: Expedite or propose alternative (use outlet's current stock differently)
6. Follow-up: Prevent pattern (if recurring issue)

**System Support**:
- Transfer tracking: Estimated vs. actual delivery time
- Overdue alert: Auto-notification if not confirmed within 6 hours
- History: Track patterns (which suppliers/routes are slow?)

---

## 6. Seasonal Variations & Scaling

### 6.1 High-Volume Periods (Weekends, Holidays)

**Challenges**:
- Sales velocity increases 2-3x
- Stock consumption higher
- Opname difficult during busy service
- Staff availability strained

**Adaptations**:
- Pre-stock Thursday/Friday (anticipate weekend demand)
- Shorten opname scope (count every 2nd location, alternate days)
- Increase waste entry frequency (more opportunities for loss)
- Float staff between locations (support high-demand outlets)

**System Support**:
- Demand forecast: Historical comparison (this weekend vs. last year)
- Stock recommendation: Pre-stock alerts 48 hours before
- Opname flexibility: Can split across multiple days
- Real-time alerts: Low-stock notifications (prevent stockout)

### 6.2 Adding New Outlets (Scaling)

**Timeline to Onboard 3rd Location**:

| Task | Duration | Blockers |
|------|----------|----------|
| Setup location master data | 30 min | Must have manager assigned |
| Assign materials to location | 1 hour | Must have reorder point + min/max configured |
| Staff training (2 hours) | 2 hours | Must have demo environment |
| Initial stock receipt (GRN) | 2 hours | Depends on supplier delivery |
| First opname (verification) | 1 hour | Validate system accuracy |
| **Total Time-to-Live** | **~6 hours** | All above completed successfully |

**System Requirements**:
- Template location setup: Pre-configured material assignments (copy from similar location)
- Training mode: Demo data environment
- Onboarding checklist: Step-by-step guide
- Data migration: Historical data import (if migrating from old system)

---

## 7. Integration with External Systems (Phase 2+)

### 7.1 Moka POS Integration

**Sync Frequency**: Every 15 minutes

**Data Flow**:
- POS → ERP: Sales transactions, void/waste events
- ERP → POS: Stock availability alerts, menu updates (future)

**Reconciliation**:
- Daily: Compare POS revenue with ERP revenue
- Weekly: Reconcile inventory counts (POS movements vs. ERP ledger)
- Monthly: Validate COGS match between systems

**Example Integration**:
- 14:00 Iced Latte sold at Ikki Coffee (POS)
- 14:02 POS syncs to ERP: Product "Iced Latte", Qty 1, Price $5.00
- 14:03 ERP recipe deduction: -18g espresso, -150ml milk, -1 cup, -1 lid
- 14:03 ERP COGS recorded: $2.40
- 14:04 Stock updated: Available milk now 149L (from 149.15L)

---

## 8. Glossary of Operational Terms

| Term | Definition | System Equivalent |
|------|-----------|-------------------|
| **Permintaan Barang** | Stock request from outlet to warehouse | Stock request (SO table) |
| **Pengiriman Barang** | Stock delivery from warehouse to outlet | Stock transfer (Movement type: transfer) |
| **Opname** | Physical inventory count; reconciliation | StockOpname table |
| **Penyesuaian** | Stock adjustment after opname | Adjustment movement |
| **Gudang Utama** | Central warehouse | Location (type: warehouse) |
| **Scrap/Waste** | Discarded items (spoilage, damage) | Waste entry (Movement type: outbound) |
| **COGS** | Cost of goods sold | Calculated from material costs × qty consumed |
| **Margin** | Profit as % of revenue | (Revenue - COGS) / Revenue |
| **Stock Turnover** | How many times inventory replaced per month | COGS / avg inventory value |

---

**Document Owner**: Operations Team
