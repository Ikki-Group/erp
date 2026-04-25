# Financial Reporting & Analysis

**Layer**: 3 (Aggregator) | **Status**: MVP | **Priority**: Critical | **Estimate**: 36 hours

---

## 1. Overview

UMKM owners currently see P&L 1 week late (month-end close). By then, problems are baked in. Financial Reporting gives same-day dashboards so owner can see profit yesterday, spot margin leaks immediately, and make data-driven menu/pricing decisions.

---

## 2. Core Objectives

- **Real-Time P&L**: Owner sees previous day's profit (not 1-week delay for month-end)
- **Product Profitability**: Know margin % per menu item (drives menu engineering decisions)
- **Location Comparison**: Benchmark outlet performance (which is more efficient?)
- **Waste Visibility**: Quantify spoilage/damage by material and location (track & reduce)
- **Trend Analysis**: Sales trending up/down? Margins stable? Spot changes early
- **Decision Support**: Data-driven choices on pricing, menu items, locations

---

## 3. Use Cases & Workflows

### UC-001: Owner Checks Daily P&L (Morning review)

**Who**: Owner / General Manager  
**When**: Next morning (after previous day closes)  
**Goal**: See yesterday's profit, spot problems, make decisions

**Steps**:
1. Owner opens dashboard → sees "Ikki Coffee - April 23"
   - Revenue: $1,245.80
   - COGS: $380.50
   - **Profit: $865.30 (69.5% margin)**
2. Owner's reaction: "Good day" or "Something's wrong?"
3. Clicks "Details":
   - Top seller: Iced Latte (98 units, $470 revenue, 62% margin)
   - Low performer: Bottled Juice (12 units, $36 revenue, 15% margin)
   - Waste: $23.50 spoilage (📈 up from $18 yesterday)
4. Owner notices waste increasing → alerts barista manager: "We're wasting more. What's happening?"
5. Clicks "Compare Week" → sees yesterday vs. last week vs. last month (trends)

**Why it matters**: 
- Same-day profit visible (no waiting for month-end)
- Waste flagged immediately (can prevent pattern)
- Owner can react same day (e.g., retrain staff on care)
- Trends spotted early (address before margin erodes)

---

### UC-002: Analyze Menu Item Profitability (Weekly menu strategy)

**Who**: Manager / Owner  
**When**: Weekly management review  
**Goal**: Decide which items to promote, which to eliminate

**Steps**:
1. Manager opens "Product Profitability" → Last 7 days
2. Sees ranking:
   ```
   Product          Units Sold  Revenue   COGS    Profit   Margin%
   Americano        328         $1,148    $236    $912     79.4% ← High margin, low volume
   Cappuccino       412         $2,060    $578    $1,482   71.9%
   Iced Latte       654         $2,940    $892    $2,048   69.8% ← High volume, decent margin
   Vanilla Cake     156         $468      $187    $281     60.0%
   Bottled Juice    98          $294      $235    $59      20.0% ← Low margin, why sell?
   ```
3. Manager observations:
   - Americano: 79% margin but only 328 units (high profit/unit but low volume)
   - Bottled Juice: 20% margin (losing money after accounting for labor)
4. Manager decisions:
   - Promote Americano with combo discount (drive high-margin volume)
   - Drop Bottled Juice or renegotiate supplier (cost too high)
   - Feature Iced Latte in peak hours (high volume = revenue driver)
5. Reports to owner with data backup

**Why it matters**: 
- Data-driven menu engineering (not gut feel)
- Identify hidden profit leaks (low-margin items)
- Identify underutilized high-margin items
- Owner confident in pricing (justified by data)

---

### UC-003: Compare Location Performance (Multi-outlet benchmarking)

**Who**: Owner (multi-location)  
**When**: Monthly management review  
**Goal**: See which outlet is more profitable, identify best practices

**Steps**:
1. Owner opens "Location Comparison" → April 2026
2. Sees side-by-side P&L:
   ```
   Metric              Ikki Coffee    Ikki Resto    Delta        Winner
   Revenue             $45,230        $52,100       +15.2%       Ikki Resto
   COGS                $13,500        $19,800       +46.7%       ⚠️ Ikki Resto
   Gross Profit        $31,730        $32,300       +1.8%        Ikki Resto
   Gross Margin %      70.1%          62.0%         -8.1pp       Ikki Coffee ✓
   Units Sold          2,145          2,890         +34.8%       Ikki Resto
   Waste (Value)       $285           $580          +103.2%      ⚠️ Ikki Resto
   ```
3. Owner insights:
   - Ikki Resto has higher revenue but COGS is 46.7% higher (quality issue or supplier paying more?)
   - Coffee shop has better margin (70% vs 62%)
   - Resto waste is 2x coffee shop (training needed)
4. Owner calls Ikki Resto manager: "Your COGS is too high. Let's audit suppliers and waste control."
5. Calls Ikki Coffee: "Your margin is best in class. What are you doing right?"

**Why it matters**: 
- Transparent peer comparison (motivates teams)
- Identifies underperforming outlets (drill down to root cause)
- Identifies best practices (replicate across locations)
- Accountability (data-based, not opinion-based)

---

## 4. Recommended Enhancements (Phase 2+)

- **Variance Investigation**: Auto-flag abnormal days (sales down 20%, waste up 30%)
  - Priority: Important (catch problems fast)
  - Why: Anomalies indicate root causes (supplier issue, staff issue, etc)
  - Estimate: 16 hours

- **Customer Cohorts**: Repeat customer %, lifetime value, frequency trends
  - Priority: Important (loyalty program planning)
  - Why: Know customer quality (high-value vs. one-time)
  - Estimate: 20 hours

- **Expense Tracking**: Manual entry for non-inventory expenses (labor, rent, utilities)
  - Priority: Important (complete P&L, not just gross margin)
  - Why: Owner needs net profit, not just gross
  - Estimate: 16 hours

- **Forecast vs. Actual**: Compare expected profit to actual
  - Priority: Nice-to-have (forecasting accuracy)
  - Why: Improve forecasting over time
  - Estimate: 12 hours

- **Email Reports**: Auto send daily/weekly summaries to owner
  - Priority: Nice-to-have (convenience)
  - Why: Owner gets insights without logging in
  - Estimate: 8 hours

- **Variance Deep Dive**: Which items drive waste? Which items drive margin changes?
  - Priority: Important (root cause analysis)
  - Why: Data-driven improvements, not guessing
  - Estimate: 20 hours
