# Feature Documentation Template (Product Analyst)

> **Purpose**: Define UMKM features from business perspective  
> **Audience**: Product Managers, UMKM stakeholders, Designers  
> **NOT for**: Technical implementation details (that's for developers later)

---

## Template Structure (5 Sections)

Every feature document has these sections:

```
1. Header (Metadata)
2. Overview (Business context)
3. Core Objectives (What problems solved)
4. Use Cases & Workflows (How UMKM staff use it)
5. Recommended Enhancements (Future ideas)
```

---

# [Feature Name]

**Layer**: [0-3] (Master Data / Operations / Aggregator)  
**Status**: MVP | Phase 2 | Phase 3  
**Priority**: Critical | Important | Nice-to-have  
**Estimate**: [hours for developers, if known]

---

## 1. Overview

**1-2 sentences**: What is this feature and why does UMKM owner care?

State the business problem it solves:
- What pain point exists today?
- How much does this problem cost the business?
- What becomes possible after this feature?

**Example**:
> UMKM F&B owners need real-time visibility into profitability by outlet and menu item. Currently they see P&L 1 week late (month-end close), so can't make timely pricing/menu decisions. Financial Reporting gives same-day dashboards so owner can react immediately to margin leaks.

---

## 2. Core Objectives

List **3-5 main business outcomes** this feature enables:

- **Objective 1**: Clear, business-focused benefit (not "enables queries", but "shows profit per item")
- **Objective 2**: What data/visibility it provides
- **Objective 3**: Cost/efficiency improvement for UMKM
- **Objective 4** (optional): Accountability or tracking aspect
- **Objective 5** (optional): Decision-making capability

**Guidelines**:
- Answer "Why does the UMKM owner care?" for each objective
- Use business language, avoid jargon
- Focus on outcomes, not implementation

**Example**:
```
- Real-Time P&L: Owner sees profit for previous day (not 1-week delay)
- Product Profitability: Know margin % for each menu item (drives menu engineering)
- Location Comparison: Benchmark outlet performance (which is more efficient?)
- Waste Visibility: Identify and quantify losses (where's the bleeding?)
- Trend Analysis: Spot changes early (sales up/down? margins stable?)
```

---

## 3. Use Cases & Workflows

Describe **2-4 realistic scenarios** showing how UMKM staff interact with feature.

For each use case:

### UC-[Number]: [Brief Title] ([Staff role])

**Who**: [Staff job title, e.g., Barista, Manager, Owner]  
**When**: [Trigger, e.g., morning, end of shift, weekly review]  
**Goal**: [What they want to accomplish]

**Steps** (simple, 2-5 steps):
1. Staff does X (what they see/click)
2. System does Y (what system shows)
3. Staff makes decision Z (outcome)

**Why it matters**: [Business impact for UMKM]

**Example**:
```
### UC-001: Owner Checks Daily P&L (Morning review)

**Who**: Owner/Manager  
**When**: Next morning (after previous day completes)  
**Goal**: See if outlet made money yesterday, spot problems

**Steps**:
1. Owner opens dashboard → sees "Ikki Coffee: $1,245 revenue, $865 profit, 69% margin"
2. Owner clicks "Compare" → sees yesterday was $1,100 revenue, $740 profit
3. Owner notices: "Revenue up 13% but margin down 2pp - why?" → Clicks products
4. System shows: "Bottled Juice sales doubled (normally 2%, now 4% of mix) but 20% margin"
5. Owner decides: "Promote higher-margin items this week, check juice supplier pricing"

**Why it matters**: 
- Owner can respond to trends same-day (not 1 week late)
- Can make data-driven menu/pricing decisions
- Identifies underperforming products quickly
```

---

## 4. Recommended Enhancements (Phase 2+)

List **3-5 feature ideas** that would improve this module but are NOT in MVP scope.

For each enhancement:

**Enhancement Name**: Brief description of what + why
- **Priority**: Critical | Important | Nice-to-have
- **Why**: Business benefit for UMKM
- **Estimate** (if known): X hours for developers

**Example**:
```
- **Budget Tracking**: Compare spending vs. monthly budget per category
  - Priority: Important (cost control, prevents overspending)
  - Why: UMKM owners need to stay within cash constraints
  - Estimate: 12 hours

- **Auto-Reorder**: Trigger purchase orders when stock below threshold
  - Priority: Critical (prevents stockouts)
  - Why: UMKM biggest pain = running out unexpectedly
  - Estimate: 20 hours
```

---

## Quick Checklist

Before submitting feature doc:

- [ ] **Business problem clear**: Why does UMKM owner care?
- [ ] **Real UMKM scenario**: Uses actual Ikki Coffee / Ikki Resto context
- [ ] **Staff perspective**: Describes what barista/manager/owner actually does (not "system processes")
- [ ] **Numbers used**: $1.74, 45 units, 69% margin (not generic amounts)
- [ ] **Language simple**: High school grad would understand
- [ ] **Workflows short**: 2-5 steps, not complex sequences

---

## Document Maintenance

- **Last Updated**: YYYY-MM-DD
- **Owner**: [Name]
- **Status**: ✅ Current | ⚠️ Outdated | 🔄 In Progress

Update when requirements change or enhancements move to MVP.

---

## Example Structure (One Page)

```
# Sales (POS)

**Layer**: 2 | **Status**: MVP | **Priority**: Critical | **Estimate**: 40h

## Overview
UMKM outlets need fast customer checkouts. Baristas currently use manual tally or basic iPad POS. 
System must handle member discounts, split payments, and auto-deduct inventory instantly.

## Core Objectives
- Fast Checkout: < 30 seconds per order (vs. manual 2-5 min)
- Accurate Inventory: Auto-deduct stock prevents over-selling
- Payment Flexibility: Cash, card, split payment, member discount in one screen
- Real-Time Sales Data: Feed financial reports, not manual entry
- Member Tracking: Repeat customers get automatic discounts

## Use Cases

### UC-001: Ring Up Customer Order
**Who**: Barista | **When**: During service | **Goal**: Quick checkout

**Steps**:
1. Barista searches product "Iced Latte"
2. Enters quantity: 2, notes "1 extra shot"
3. Customer pays: $7.00 cash
4. System prints receipt, deducts inventory

**Why**: Checkout in 20 seconds, inventory accurate, audit trail created

### UC-002: Member Discount
**Who**: Barista | **When**: Customer says "I'm a member" | **Goal**: Apply discount

**Steps**:
1. Barista taps "Lookup Customer" → searches phone
2. System finds "Budi", shows "Member 10% off"
3. Total $11.25 (instead of $12.50)
4. Receipt shows discount applied

**Why**: Loyalty reward, retention, customer feels valued

## Enhancements (Phase 2+)

- **Queue Display**: Visual board showing pending orders to kitchen
  - Priority: Important (kitchen coordination)
  - Why: Reduces morning chaos, improves order accuracy
  - Estimate: 12 hours

- **Digital Payments**: Accept QR code, e-wallet (GCash, OVO)
  - Priority: Critical (customer expectation 2026)
  - Why: Reduces cash handling, safer transactions
  - Estimate: 32 hours
```

---

## Tips for Success

✅ **Start with owner's question**
- Not: "What features should the POS have?"
- But: "How can we make checkout 5x faster?"

✅ **Use real numbers**
- Not: "process transaction"
- But: "$7.00 Iced Latte, 2 qty, member discount applied"

✅ **Show staff actions, not system functions**
- Not: "System deducts inventory from ledger"
- But: "Barista hits 'Checkout' → stock auto-updates → receipt prints"

✅ **Keep workflows minimal**
- 2-5 steps max
- If more = problem is too big, split into sub-features

✅ **Enhancements are honest backlog**
- Don't sneak Phase 2 ideas into MVP
- Don't over-engineer MVP
- Clear prioritization (what's truly critical?)

---

**Goal**: This template helps product analysts **discover and articulate** UMKM feature ideas in business language, without diving into technical implementation details.

Developers build from this; they add the data models, SQL, caching patterns, etc. later.
