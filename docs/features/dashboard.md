# Dashboard & Analytics

**Layer**: 3 (Aggregator) | **Status**: MVP | **Priority**: Important | **Estimate**: 16 hours

---

## 1. Overview

Dashboard is the first screen owner sees when logging in. It shows today's performance: revenue, profit, margins, waste, top items, location comparison. Owner glances at dashboard and instantly knows: "Good day" or "We have a problem."

---

## 2. Core Objectives

- **Quick Business Snapshot**: Key metrics at a glance (revenue, profit, margin %)
- **Real-Time Data**: Yesterday's data available this morning (not week-late)
- **Performance Comparison**: This week vs. last week, outlet A vs. outlet B
- **Problem Alerts**: Waste spike? Margin drop? Low stock? Flag immediately
- **Drill-Down Capability**: Click metric to see details (which item drives waste?)
- **Location-Aware**: Barista sees their outlet, manager sees assigned outlets, owner sees all

---

## 3. Use Cases & Workflows

### UC-001: Owner Morning Dashboard (Quick status check)

**Who**: Owner  
**When**: Start of day (check previous day's results)  
**Goal**: See yesterday's performance at a glance

**Steps**:
1. Owner logs in → sees Dashboard
2. Top card shows: "Ikki Coffee - Yesterday"
   - Revenue: $1,245.80 ✓
   - Profit: $865.30
   - Margin: 69.5%
3. Secondary metrics show:
   - Waste: $23.50 (normal)
   - Top item: Iced Latte (98 units)
   - Cash collected: $1,245
4. Location comparison: "Ikki Coffee +12% vs yesterday, Ikki Resto -5% (investigate)"
5. Alerts: "Waste at Ikki Resto up to $45 (was $30), check quality"

**Why it matters**: 
- Owner knows status in 30 seconds (no analysis needed)
- Alerts flag problems (waste spike, margin drop)
- Comparison shows trends (which outlet performing better)
- Can drill down for details if needed

---

### UC-002: Manager Shift Monitoring (During the day)

**Who**: Outlet Manager  
**When**: During shift (check current performance)  
**Goal**: Monitor real-time sales/operations

**Steps**:
1. Manager opens Dashboard (refreshes every 5 minutes)
2. Sees today so far:
   - Current Revenue: $520 (so far, expecting $1,200 total)
   - Current Transactions: 127
   - Average transaction: $4.09
   - Stock status: Fresh Milk 15L (above min), Cups 200 pcs (OK)
3. Sees alerts: "Iced Latte sales high, consider prep more batches"
4. Manager opens Kitchen Display System: Shows 8 pending orders
5. Alerts manager if waste spike detected during shift

**Why it matters**: 
- Real-time visibility (know if day is tracking well)
- Early alerts (can react mid-shift, not end-of-day)
- Inventory warnings (avoid mid-shift stockouts)
- Kitchen coordination (backlog visible)

---

### UC-003: Weekly Performance Review (Friday review)

**Who**: Owner  
**When**: End of week (Friday)  
**Goal**: Analyze week's performance, identify trends

**Steps**:
1. Owner opens Dashboard → selects "Last 7 Days"
2. Sees weekly summary:
   - Total Revenue: $8,450 (up 3% vs last week)
   - Total Profit: $5,890 (up 1% vs last week)
   - Avg Margin: 69.6%
   - Total Waste: $165 (normal)
3. Charts show:
   - Revenue trend: Mon $1,100 → Fri $1,400 (Friday best day)
   - Margin trend: Stable 69-70% all week ✓
   - Outlet comparison: Ikki Coffee outperforming Ikki Resto
4. Owner insights: "Promote outlet A's best practices to outlet B"

**Why it matters**: 
- Weekly trends visible (week-over-week performance)
- Outlet benchmarking (transparent comparison)
- Data-driven decisions (promote best practices)
- No manual reporting (all auto-calculated)

---

## 4. Recommended Enhancements (Phase 2+)

- **Customizable Widgets**: Owner chooses which metrics to display
  - Priority: Nice-to-have (personalization)
  - Why: Different owners care about different KPIs
  - Estimate: 8 hours

- **Mobile Dashboard**: Optimized view for phone/tablet
  - Priority: Important (owners check on the go)
  - Why: Quick check without logging into desktop
  - Estimate: 12 hours

- **Export/Share Reports**: Download dashboard as PDF/Excel
  - Priority: Nice-to-have (share with stakeholders)
  - Why: Investor updates, team briefings
  - Estimate: 6 hours

- **Predictive Alerts**: "At this pace, we'll hit $1,200 revenue today"
  - Priority: Nice-to-have (forecasting)
  - Why: Know if day will meet targets early
  - Estimate: 10 hours

- **Benchmark Comparison**: "Your margin 69%, industry avg 65%"
  - Priority: Nice-to-have (competitive insight)
  - Why: Know if performing above/below market
  - Estimate: 8 hours
