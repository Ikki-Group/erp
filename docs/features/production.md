# Production & Recipe Costing

**Layer**: 2 (Operations) | **Status**: MVP | **Priority**: Important | **Estimate**: 20 hours

---

## 1. Overview

UMKM baristas/cooks make drinks inconsistently ("bit more milk today") = different costs each time. With standardized recipes and batch recording, every cappuccino has same cost, same quality. Waste (spillage, testing, trimming) becomes visible and traceable.

---

## 2. Core Objectives

- **Standardized Recipes**: Same formula across all outlets (consistency + training)
- **Accurate Recipe Cost**: Know exact cost per cappuccino (drives menu pricing)
- **Waste Visibility**: Track spoilage, testing, trimming (identify and reduce losses)
- **Yield Tracking**: Compare planned vs. actual output (spot training issues)
- **Batch Recording**: Log when batch made, who made it, actual cost (audit trail)
- **Variance Analysis**: Identify if costs drifting above recipe standard

---

## 3. Use Cases & Workflows

### UC-001: Create Standard Recipe (HQ process)

**Who**: Head Chef / Menu Manager  
**When**: New item added or standardization project  
**Goal**: Define single recipe for all outlets

**Steps**:
1. Chef opens "Create Recipe" → selects product "Cappuccino"
2. Defines ingredients:
   - Fresh Milk: 0.2L @ $1.50/L = $0.30
   - Espresso Beans: 18g @ $0.08/g = $1.44
   - Water: 0.3L = negligible
   - **Total cost: $1.74 per cappuccino**
3. Sets: Prep time 3 minutes, Yield 1 cappuccino
4. Notes: "Double shot espresso, steam milk to 60°C, 1:1 milk-to-espresso ratio"
5. Marks as "Active" → Available at all outlets immediately

**Why it matters**: 
- All locations make same recipe (no improvisation)
- COGS locked in ($1.74 per item)
- Training material for new baristas
- Prevents cost creep ("little extra today" = margin gone)

---

### UC-002: Record Production Batch (Daily staff action)

**Who**: Barista / Cook  
**When**: Before morning rush (prep batch)  
**Goal**: Log when batch made, track actual output

**Steps**:
1. Barista opens "Record Batch" → selects "Cappuccino (v1)"
2. Enters: Plan to make 50 cappuccinos this morning
3. After making: Actually made 48 (2 failed due to steamer dial adjustment)
4. Notes: "Used 2 as test batches to dial in temperature"
5. System calculates:
   - Planned cost: 50 × $1.74 = $87
   - Actual: 48 cappuccinos made
   - Waste: 2 units (reason: "testing")
   - Cost per unit: $87 ÷ 48 = $1.81 (4% above standard)
6. Manager reviews & approves

**Why it matters**: 
- Actual cost ($1.81) vs. standard ($1.74) visible
- Waste reason documented (temperature test, not carelessness)
- Variance flagged if > 5% (investigate)
- Accountability (who made batch, when)

---

### UC-003: Analyze Cost Variance (Weekly review)

**Who**: Manager / Head Chef  
**When**: Weekly performance review  
**Goal**: Spot trends in production efficiency

**Steps**:
1. Manager opens "Production Report" → Last 7 days
2. Sees:
   ```
   Recipe           Standard  Actual   Variance  Batches
   Cappuccino       $1.74     $1.80    +3.4%     12
   Iced Latte       $1.50     $1.50    0%        10
   Croissant        $0.85     $0.95    +11.8%    8 ⚠️
   ```
3. Croissant above standard → drills down:
   - Batch 1 (Apr 21): 95 actual vs 100 planned (trimming waste)
   - Batch 2 (Apr 22): 92 actual vs 100 planned (trimming 8%)
   - Batch 3 (Apr 23): 100 actual vs 100 planned (perfect)
4. Manager talks to pastry chef: "Your trimming technique is causing waste. Let's practice knife skills."
5. Next week croissants back to standard

**Why it matters**: 
- Cost variance visible early (fix before margin erodes)
- Specific feedback to staff (not vague criticism)
- Continuous improvement culture (track, identify, fix)

---

## 4. Recommended Enhancements (Phase 2+)

- **Batch Scheduling**: Plan daily batches based on demand forecast
  - Priority: Important (reduce waste, optimize labor)
  - Why: Know when to make coffee, cookies, pastries (not random)
  - Estimate: 16 hours

- **Recipe History**: Track recipe changes over time (what changed, when, why)
  - Priority: Nice-to-have (documentation)
  - Why: Understand why costs shifted, A/B test recipes
  - Estimate: 8 hours

- **Ingredient Substitution**: If material not available, suggest alternative
  - Priority: Nice-to-have (flexibility in supply chain issues)
  - Why: Don't stop production if milk supplier fails
  - Estimate: 12 hours

- **Staff Recipe Assignments**: Track which staff trained on which recipes
  - Priority: Nice-to-have (onboarding)
  - Why: Know who can make what, schedule accordingly
  - Estimate: 6 hours

- **Multi-Step Recipes**: Support complex items (dough → fold → bake)
  - Priority: Nice-to-have (bakery operations)
  - Why: Some items made in stages, need stage tracking
  - Estimate: 24 hours
