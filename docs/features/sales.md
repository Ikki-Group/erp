# Sales (POS)

**Layer**: 2 (Operations) | **Status**: MVP | **Priority**: Critical | **Estimate**: 40 hours

---

## 1. Overview

UMKM F&B outlets need fast customer checkouts without friction. Baristas currently spend 2-5 minutes per order (manual tally or slow iPad systems). Fast POS with member discounts and real-time inventory auto-deduction is table stakes for F&B operations.

---

## 2. Core Objectives

- **Fast Checkout**: Complete order in < 30 seconds (search product → qty → pay → receipt)
- **Accurate Inventory**: Every sale instantly deducts stock (prevents over-selling, no manual reconciliation)
- **Payment Flexibility**: Support cash, card, split payment, member discounts in single interface
- **Real-Time Sales Data**: Feed P&L dashboards (not manual data entry at month-end)
- **Member Retention**: Repeat customers identified, automatic discounts applied, loyalty tracked

---

## 3. Use Cases & Workflows

### UC-001: Ring Up Customer Order (Normal sale)

**Who**: Barista  
**When**: During service (morning rush, afternoon)  
**Goal**: Process customer order in <1 minute

**Steps**:
1. Barista searches/scans product: "Iced Latte"
2. Enters quantity: 2, adds notes: "1 extra shot"
3. System shows total: $7.00, stock available: 45 units
4. Customer pays cash
5. System prints receipt, deducts inventory

**Why it matters**: 
- Speed = throughput (more customers served per hour)
- Inventory auto-deduction = no manual tracking needed
- Audit trail = accountability for staff

---

### UC-002: Member Gets Discount

**Who**: Barista  
**When**: Customer mentions "I'm a member"  
**Goal**: Apply discount, build loyalty

**Steps**:
1. Barista taps "Lookup Customer" → searches by phone number
2. System finds "Budi Santoso", shows "Member since Jan 2026, Total spent: $150"
3. Shows available: "10% Member Discount"
4. Total $12.50 → $11.25 after discount
5. Receipt shows discount + member status

**Why it matters**: 
- Repeat customers feel valued (retention)
- Owner sees member frequency (loyalty program data)
- Competitive advantage (customer gets benefit)

---

### UC-003: Void or Refund Transaction

**Who**: Barista/Manager  
**When**: Customer unhappy ("This coffee is cold")  
**Goal**: Issue refund, track discrepancy

**Steps**:
1. Barista recalls transaction from 10 min ago
2. Manager approves refund (if > $10)
3. System voids transaction, reverses inventory
4. Refunds $7.00 to customer payment method
5. Receipt marked "VOID" with reason + timestamp

**Why it matters**: 
- Customer satisfaction (quick resolution)
- Inventory accuracy (void reverses deduction)
- Fraud prevention (refunds tracked for audits)

---

## 4. Recommended Enhancements (Phase 2+)

- **Queue Display**: Visual board in kitchen showing pending orders
  - Priority: Important (reduces morning chaos)
  - Why: Kitchen staff see order pipeline, reduces missed/delayed orders
  - Estimate: 12 hours

- **Digital Payments**: Accept QR codes, e-wallets (GCash, OVO, Dana)
  - Priority: Critical (customer expectation in 2026)
  - Why: Reduces cash handling, faster payments, safer transactions
  - Estimate: 32 hours

- **Tip Prompt**: "Add tip?" prompt after card payment
  - Priority: Nice-to-have (increases revenue 3-5%)
  - Why: Normalized in many markets, improves staff income
  - Estimate: 4 hours

- **Multi-Location Reporting**: Sales roll-up across all outlets
  - Priority: Important (HQ visibility)
  - Why: Owner sees total system sales, compares outlets
  - Estimate: 8 hours

- **Combo Bundling**: Create product combos with auto-discount
  - Priority: Important (menu engineering)
  - Why: Drive higher-margin item combinations
  - Estimate: 16 hours
