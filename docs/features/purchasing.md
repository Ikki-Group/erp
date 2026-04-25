# Purchasing & Supplier Management

**Layer**: 2 (Operations) | **Status**: MVP | **Priority**: Critical | **Estimate**: 32 hours

---

## 1. Overview

UMKM F&B businesses buy from suppliers via WhatsApp/calls with no paper trail. Costs spiral from paying different suppliers at different prices, stockouts from missed orders, and duplicate ordering across outlets. Purchasing module consolidates demand, tracks supplier performance, and ensures cost discipline.

---

## 2. Core Objectives

- **Cost Control**: Compare supplier prices before ordering (save 5-10% on materials)
- **Supplier Performance**: Track on-time delivery, product quality, reliability (pick best partners)
- **Consolidated Demand**: See total need across outlets, order in bulk (qualify for discounts)
- **Purchase History**: Know what was bought, when, at what price (spot trends, prevent mistakes)
- **Invoice Verification**: Match purchase order → received goods → invoice (prevent overpayment)
- **Budget Visibility**: See spending by material category vs. monthly budget

---

## 3. Use Cases & Workflows

### UC-001: Submit Stock Request (Outlet needs supplies)

**Who**: Outlet Manager  
**When**: Stock falls below reorder point (or manually requested)  
**Goal**: Signal warehouse/procurement team about need

**Steps**:
1. Manager opens "Create Request" → selects "Fresh Milk"
2. Enters: Qty 50L, Reason "Low stock", Needed by "Tomorrow morning"
3. Notes: "High season, expect 100+ cups/day"
4. System shows: Last price $1.50/L, Lead time 2 days, Current warehouse stock 100L
5. Submits → Procurement team gets notification

**Why it matters**: 
- Warehouse manager sees demand from all outlets (can consolidate)
- Procurement knows what's needed and when
- Prevents emergency orders (expensive) or stockouts (lost sales)

---

### UC-002: Create Purchase Order (Procurement decision)

**Who**: Procurement Officer  
**When**: After reviewing requests from multiple outlets  
**Goal**: Issue formal order to supplier

**Steps**:
1. Procurement sees: 3 requests for coffee mix (100L total from 3 outlets)
2. Instead of 3 separate orders, consolidates into 1 PO
3. Calls 2 suppliers: "Coffee Supplies Ltd wants $2.40/L, Fresh Import wants $2.50/L"
4. Chooses "Coffee Supplies Ltd" (better price & 95% on-time rate)
5. Creates PO: 100L @ $2.40/L = $240 (saves $10 vs. separate orders)
6. Manager reviews & confirms → PO sent to supplier

**Why it matters**: 
- Bulk orders = lower unit cost
- Supplier comparison = best pricing
- Consolidation = efficiency
- Audit trail = accountability

---

### UC-003: Receive Goods & Create GRN (Delivery arrives)

**Who**: Warehouse Manager  
**When**: Supplier delivers goods  
**Goal**: Record receipt, note any discrepancies

**Steps**:
1. Driver delivers 100L coffee mix to warehouse
2. Manager checks: PO says 100L, delivery label says 100L, counted contents = 97L (3L short)
3. Creates GRN: "Received 97L (3L short), no damage, notes on invoice"
4. Manager approves → Stock added to warehouse
5. Discrepancy logged: "Coffee Supplies Ltd: 97% accuracy" (tracked for supplier rating)

**Why it matters**: 
- Qty discrepancies caught immediately (not silent overcharges)
- Supplier performance tracked (on-time, accuracy %)
- Inventory reflects actual receipt (not PO quantity)

---

### UC-004: Verify Invoice (Invoice reconciliation)

**Who**: Finance Manager  
**When**: Supplier sends invoice  
**Goal**: Verify invoice matches order + receipt before payment

**Steps**:
1. Finance receives invoice from "Coffee Supplies Ltd": Invoice #INV-001, Amount $232.80
2. System checks:
   - PO: 100L @ $2.40 = $240 expected
   - GRN: 97L received
   - Invoice: $232.80 (should be 97L @ $2.40 = $232.80 ✓)
3. Three-way match passes ✓
4. Finance approves payment on due date (30 days net)

**Why it matters**: 
- Prevents invoice fraud (if supplier billed 100L when only 97L sent)
- Ensures correct payment (not over/under)
- Finance confidence in purchasing (trustworthy process)

---

## 4. Recommended Enhancements (Phase 2+)

- **Auto-Reorder**: Trigger PO when outlet stock falls below reorder point
  - Priority: Critical (prevents stockouts)
  - Why: UMKM biggest complaint = running out unexpectedly
  - Estimate: 20 hours

- **Supplier Comparison UI**: Show quotes from 2-3 suppliers before ordering
  - Priority: Important (cost optimization)
  - Why: Visible comparison drives cost discipline, competitive quotes
  - Estimate: 16 hours

- **Multi-Item PO**: Single PO with different materials from same supplier
  - Priority: Important (consolidation efficiency)
  - Why: One shipment, one invoice, lower coordination cost
  - Estimate: 12 hours

- **Budget Alerts**: Notify when spending approaches monthly limit
  - Priority: Important (cost control)
  - Why: CFO/Owner wants spending guardrails
  - Estimate: 8 hours

- **Supplier Portal**: Suppliers submit quotes, invoices online (not email)
  - Priority: Nice-to-have (large suppliers only)
  - Why: Faster, error-free communication channel
  - Estimate: 24 hours
