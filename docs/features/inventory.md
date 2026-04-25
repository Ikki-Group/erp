# Inventory Management

**Layer**: 2 (Operations) | **Status**: MVP | **Priority**: Critical | **Estimate**: 24 hours

---

## 1. Overview

Inventory tracks every bag of coffee, liter of milk, and box of cups across all outlets and warehouse. Every stock movement (receive from supplier, transfer to outlet, use in production, waste) is logged. Owner needs real-time stock visibility to prevent stockouts and eliminate waste.

---

## 2. Core Objectives

- **Real-Time Stock Visibility**: See how much Fresh Milk at each outlet right now (not yesterday)
- **Complete Audit Trail**: Every movement logged (who, when, why, how much)
- **Location Isolation**: Warehouse milk separate from Outlet A milk (no cross-contamination)
- **Monthly Reconciliation**: Physical count vs. system (opname) catches shrinkage early
- **FIFO/Cost Tracking**: Know cost of stock consumed (for COGS calculation)
- **Transfer Coordination**: Outlet requests stock, warehouse approves & ships

---

## 3. Use Cases & Workflows

### UC-001: Receive Stock from Supplier (GRN creation)

**Who**: Warehouse Manager  
**When**: Supplier delivers goods  
**Goal**: Add stock to warehouse inventory

**Steps**:
1. Driver delivers 50L Fresh Milk
2. Manager checks: PO says 50L, actual delivery = 48L (2L short)
3. Manager records: "Received 48L, 2L discrepancy" (note reason)
4. System adds 48L to warehouse stock
5. Discrepancy tracked for supplier rating (98% accuracy)

**Why it matters**: 
- Accurate inventory (system matches physical)
- Discrepancies caught immediately (not silent loss)
- Supplier performance tracked (80% on-time? 95% accuracy?)

---

### UC-002: Outlet Requests Stock Transfer (Low stock alert)

**Who**: Outlet Manager  
**When**: Stock low ("We only have 3L milk left, need 20L")  
**Goal**: Request stock from warehouse

**Steps**:
1. Manager sees: Fresh Milk 3L (Min: 20L) ⚠️
2. Creates "Stock Request": 20L milk, needed today
3. Warehouse Manager approves request
4. Warehouse packs 20L milk, ships to outlet
5. System transfers: Warehouse milk -20L, Outlet milk +20L
6. Outlet manager confirms receipt in system

**Why it matters**: 
- No stockouts (stock visible, proactive reorder)
- Fair distribution (warehouse controls allocations)
- Audit trail (who requested, warehouse approved)
- Prevents outlet over-ordering

---

### UC-003: Monthly Physical Count (Stock opname)

**Who**: Manager / Staff  
**When**: End of month  
**Goal**: Verify system stock matches physical count

**Steps**:
1. Manager opens "Start Opname" for Ikki Coffee, April
2. System shows expected stock:
   - Fresh Milk: 45L (expected)
   - Espresso Beans: 12kg
   - Paper Cups: 250 pcs
3. Staff physically count items at outlet
4. Manager records actual counts:
   - Fresh Milk: 43L (expected 45L = 2L missing)
   - Espresso Beans: 12kg ✓
   - Paper Cups: 240 pcs (10 missing)
5. System flags variances:
   - Milk: 2L short (4.4% variance) → investigate
   - Cups: 10 short (4% variance) → spillage/waste
6. Manager notes reasons: "Milk: 1L spilled during transfer, 1L expired"
7. System adjusts inventory, logs waste

**Why it matters**: 
- System accuracy verified (not silent shrinkage)
- Waste visibility (4% cups loss identified)
- Root cause tracked (prevents patterns)
- Controls fraud (missing stock alerts manager)

---

## 4. Recommended Enhancements (Phase 2+)

- **Barcode Scanning**: Scan materials during receiving/transfer
  - Priority: Important (speed & accuracy)
  - Why: Faster than manual entry, error-free
  - Estimate: 12 hours

- **Auto-Reorder**: Trigger purchase request when stock below min
  - Priority: Critical (prevents stockouts)
  - Why: UMKM can't manually check daily
  - Estimate: 20 hours

- **Stock Forecasting**: Predict demand for next week
  - Priority: Nice-to-have (planning optimization)
  - Why: Order exact quantity needed (prevent overstock)
  - Estimate: 24 hours

- **Waste Tracking Dashboard**: Visualize waste trends by material
  - Priority: Important (reduce losses)
  - Why: Identify patterns (spoilage on Mondays?)
  - Estimate: 12 hours
