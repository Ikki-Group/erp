# Location Management

**Layer**: 0 (Core) | **Status**: MVP | **Priority**: Critical | **Estimate**: 12 hours

---

## 1. Overview

UMKM F&B chains have multiple outlets (Ikki Coffee, Ikki Resto, warehouse). Location module tracks each outlet's name, address, settings (hours, manager, capacity). All data is filtered by location—sales are per-outlet, inventory is per-location, staff assignments are location-specific.

---

## 2. Core Objectives

- **Multi-Outlet Support**: Manage multiple physical locations in one system
- **Location Identity**: Name, address, manager, timezone, business hours for each outlet
- **Data Isolation**: Barista at Outlet A can't see Outlet B's inventory/sales
- **Location Settings**: Configure outlet-specific settings (open hours, delivery partner, payment methods)
- **Headquarters Support**: Central warehouse tracked as separate location (can see all outbound stock)

---

## 3. Use Cases & Workflows

### UC-001: Admin Creates New Outlet (Business expansion)

**Who**: Admin / Owner  
**When**: Opening new outlet (Ikki Coffee branch #3)  
**Goal**: Set up new location in system

**Steps**:
1. Admin opens "Create Location"
2. Enters: Name "Ikki Coffee - BSD", Address "Jl. Serpong 123", City "Tangerang"
3. Sets: Manager "Pak Rendi", Opening hour "06:00", Closing "21:00"
4. Sets: Type "Outlet" (vs "Warehouse", "Head Office")
5. Saves → System creates Location record
6. Can now assign staff, create inventory for this location, run outlet-specific reports

**Why it matters**: 
- New outlet live in system immediately
- Staff can be assigned to specific location
- Sales/inventory tracked per outlet
- Reports show location-specific P&L

---

### UC-002: View Multi-Location Dashboard (Owner perspective)

**Who**: Owner  
**When**: Checking business performance  
**Goal**: See all outlets at a glance

**Steps**:
1. Owner opens Dashboard → sees list of locations
2. Selects "Ikki Coffee" → sees revenue $1,245, profit $865, waste $23.50
3. Selects "Ikki Resto" → sees revenue $1,850, profit $980, waste $45
4. Selects "Compare All" → side-by-side comparison of all outlets
5. Owner can drill down to any outlet for details

**Why it matters**: 
- Owner sees complete picture
- Easy comparison (which outlet performs better)
- Spot problems early (location with high waste)

---

### UC-003: Configure Location-Specific Settings

**Who**: Location Manager / Admin  
**When**: Updating outlet operations  
**Goal**: Set outlet rules (hours, payment methods, delivery partners)

**Steps**:
1. Manager opens "Settings" for "Ikki Coffee"
2. Configures:
   - Opening hours: "06:00 - 21:00" (closes at 9pm)
   - Delivery partner: "GrabFood, Gojek" (for delivery orders)
   - Payment methods: "Cash, Card, GCash" (what we accept)
   - Max capacity: "80 customers" (fire code limit)
3. Saves → Settings apply to this location only

**Why it matters**: 
- Each outlet can have different hours/rules
- Payment methods match local market
- System aware of outlet constraints

---

## 4. Recommended Enhancements (Phase 2+)

- **Location Hierarchy**: Organize outlets by region/district
  - Priority: Nice-to-have (large chains 10+ outlets)
  - Why: Better organization as chain grows
  - Estimate: 8 hours

- **Location Photos**: Store outlet appearance, menu board photos
  - Priority: Nice-to-have (visual documentation)
  - Why: Training, consistency checks, marketing
  - Estimate: 4 hours

- **Distance/Delivery Zone Mapping**: Show location on map, set delivery radius
  - Priority: Nice-to-have (delivery optimization)
  - Why: Know which outlet serves which neighborhoods
  - Estimate: 12 hours

- **Location Consolidation**: Merge outlet data (closing/relocating outlet)
  - Priority: Nice-to-have (rare but needed)
  - Why: Reorg scenario (merge two small outlets)
  - Estimate: 6 hours
