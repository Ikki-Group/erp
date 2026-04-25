# Feature Documentation Standard - Product Analyst Guide

> **For**: Product Managers, Business Analysts, UMKM Strategists  
> **Not for**: Technical implementation (developers have separate architecture docs)  
> **Last Updated**: 2026-04-24

---

## Quick Summary

Ikki ERP is built for **UMKM F&B operations** with 4 core features that answer critical business questions:

| Question | Feature | Benefit |
|----------|---------|---------|
| "How many customers? How much revenue?" | **Sales (POS)** | Fast checkout, real-time sales data |
| "What does each item cost to make?" | **Production** | Recipe standardization, waste visibility |
| "What are we spending on suppliers?" | **Purchasing** | Cost control, supplier performance tracking |
| "Are we profitable? Which outlet wins?" | **Financial Reporting** | Same-day P&L, location benchmarking, trend analysis |

---

## Documentation Template (5 Sections Only)

Every feature document has this simple structure:

1. **Header**: Layer, Status, Priority, Effort estimate
2. **Overview**: Business problem + why UMKM owner cares (1-2 sentences)
3. **Core Objectives**: 3-5 business outcomes (what problems does it solve?)
4. **Use Cases & Workflows**: 2-4 real UMKM scenarios (what does staff actually do?)
5. **Recommended Enhancements**: 3-5 Phase 2+ ideas (future improvements)

**That's it.** No technical deep dives (no data models, no SQL, no implementation notes). That's for developers later.

---

## Writing Guidelines for Product Analysts

### ✅ Start with the UMKM problem

❌ "Create a POS system with transaction management"  
✅ "Baristas spend 2-5 minutes per checkout. We need sub-30-second processing with member discounts."

### ✅ Use real numbers

❌ "Process orders and apply discounts"  
✅ "$1.74 cappuccino, member discount takes it to $1.57, printed receipt in <5 seconds"

### ✅ Show staff perspective

❌ "System deducts inventory from ledger"  
✅ "Barista hits Checkout → Stock auto-updates → Receipt prints"

### ✅ Keep workflows simple

Max **2-5 steps** per use case. If more = break into sub-features.

### ✅ Business language throughout

- "Margin", "repeat customers", "cost control", "efficiency"
- Not: "ACID transactions", "normalization", "caching strategies"

---

## Feature Catalog - What We Have

### ✅ Foundation (Existing)
- Auth (login, JWT tokens)
- IAM (role-based access control)
- Location (multi-outlet management)
- Product (menu items, pricing)
- Material (ingredients, packaging)
- Inventory (stock ledger)
- Dashboard (KPI overview)

### 🚀 Core Operations (Designed Today)
- **Sales (POS)** - Customer transactions, receipts, member discounts
- **Purchasing** - Supplier orders, cost control, GRN matching
- **Production** - Recipe standardization, batch costing, waste tracking
- **Financial Reporting** - P&L dashboards, product profitability, location benchmarking

---

## Phase 2+ Backlog Ideas

### High Priority (Q3 2026)
- **Auto-Reorder**: Trigger POs when stock falls below threshold (prevents stockouts)
- **Expense Tracking**: Track non-inventory costs (labor, rent, utilities) for complete P&L
- **Waste Root Cause**: Deep analysis of spoilage patterns (identify & eliminate 5-10% COGS losses)
- **Digital Payments**: Accept QR codes, e-wallets GCash, OVO (customer expectation 2026)

### Medium Priority (Q4 2026)
- **Customer Loyalty**: Track repeat customers, points, tiers (increase retention)
- **Batch Scheduling**: Optimize when to make items based on demand (reduce waste, labor)
- **Supplier Comparison UI**: Show quotes from multiple vendors before ordering (cost optimization)
- **Budget Alerts**: Notify when spending approaches monthly limit (cost control)

### Lower Priority (2027+)
- **Barcode Scanning**: Scan during receiving/sales
- **Mobile App**: Staff access on phones/tablets
- **Multi-Language UI**: Bahasa Indonesia, local languages
- **Supplier Portal**: Vendors submit quotes/invoices online
- **Email Reports**: Auto daily/weekly insights to owner

---

## UMKM-First Design Principles

Every feature follows these principles:

### 1. **Simplicity**
- Minimal workflows (2-3 steps, max)
- Fast learning (staff trained in <2 hours)
- Obvious UX (intuitive, not feature-rich)

### 2. **Speed**
- POS checkout < 30 seconds
- Reports load in < 2 seconds
- No waiting for calculations

### 3. **Transparency**
- Every transaction logged (who, when, what)
- Calculations shown (owner understands P&L)
- Variance alerts (problems flagged immediately)

### 4. **Cost-Conscious**
- MVP has no expensive integrations
- Works offline (UMKM WiFi unreliable)
- Mobile + Desktop (not smartphone-only)

### 5. **Actionable Data**
- Comparisons shown (yesterday vs. today, outlet A vs. B)
- Trends flagged (spot problems early)
- Opportunities highlighted (what to promote/drop)

---

## Feature Development Checklist

Before submitting a feature document:

- [ ] **Business problem clear**: Why does the UMKM owner care?
- [ ] **Real scenario**: Uses Ikki Coffee / Ikki Resto context (not generic)
- [ ] **Staff actions**: Shows what barista/manager actually does
- [ ] **Numbers used**: $1.74, 45 units, 69% margin (not generic amounts)
- [ ] **Simple language**: High school education grad would understand
- [ ] **Short workflows**: 2-5 steps max, not complex sequences
- [ ] **Enhancements realistic**: Phase 2 ideas are feasible, not blue-sky

---

## How to Use This Standard

### If you're discovering a new feature idea:
1. Read the template (`FEATURE_TEMPLATE.md`)
2. Copy it → fill with your feature idea
3. Focus on: overview (problem), objectives (why it matters), use cases (real workflows)
4. Skip technical details (that's for developers)
5. Submit for PM + tech lead review

### If you're reviewing a feature:
1. Check: Is the business problem clear?
2. Check: Are use cases realistic for UMKM?
3. Check: Are enhancements reasonable for Phase 2?
4. Ask: Would an UMKM owner find this valuable?

---

## Success Metrics

**Feature is good if:**

✅ Owner can explain the business benefit (not just technical feature)  
✅ Staff can use it without training (intuitive)  
✅ UMKM owner makes better business decisions because of it  
✅ Solves a real pain point (not "nice to have")  
✅ Implementation effort is reasonable (not 200+ hours)

---

## Document Locations

```
/docs/
├─ FEATURE_TEMPLATE.md                 (Template: copy this)
├─ FEATURE_DOCUMENTATION_STANDARD.md   (This file)
└─ features/
   ├─ sales.md                         (POS system)
   ├─ purchasing.md                    (Supplier management)
   ├─ production.md                    (Recipe costing)
   └─ financial-reporting.md           (P&L analysis)
```

---

**Role**: As Product Analyst, you design UMKM-focused features in business language.  
**Output**: Clear, concise feature specs that developers can build from.  
**Goal**: Solutions that actually solve UMKM problems.

✨ **Keep it simple. Focus on the problem. Let the business value shine.** ✨
