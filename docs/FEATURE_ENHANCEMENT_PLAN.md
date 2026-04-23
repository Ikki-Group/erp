# MVP Feature Documentation Enhancement Plan

**Created**: 2026-04-24  
**Goal**: Enhance 9 MVP feature docs dengan standardized structure, detailed specs, use cases, dan business logic

---

## Current State Analysis

### Line Counts (Baseline)
- auth.md: 38 lines (minimal, needs expansion)
- b2b_sales.md: 38 lines (minimal, needs expansion)
- dashboard.md: 42 lines (basic)
- iam.md: 62 lines (decent, can enhance)
- inventory.md: 47 lines (basic)
- location.md: 51 lines (basic)
- material.md: 52 lines (basic)
- product.md: 52 lines (basic)
- recipe.md: 47 lines (basic)

**Total**: 451 lines (very lean for 9 MVP features)

---

## Standard Feature Doc Template

Each feature doc should have:

```markdown
# [Feature Name]

## 1. Overview
- Purpose (1 paragraph)
- Layer & dependencies
- Key business value

## 2. Core Objectives
- 3-5 bullet points on what feature achieves

## 3. Key Entities & Relationships
- Entity list (what data does it manage?)
- Relationships diagram or list
- Data flow (input → output)

## 4. Use Cases & Workflows
- UC-001: Scenario description
  - Actors: who involved?
  - Steps: 5-10 steps
  - Business rules: constraints
  - Expected outcome

## 5. API Endpoints & Routes
- GET /list - List with filters
- GET /:id - Detail
- POST /create - Create
- PUT /:id - Update
- DELETE /:id - Delete
- [Custom endpoints]

## 6. Data Model
- Table definitions (brief)
- Key fields
- Validations
- Constraints

## 7. Business Rules & Validations
- Validation rules
- Business constraints
- Error scenarios

## 8. Integration Points
- What modules depend on this?
- What modules does this depend on?
- Data dependencies

## 9. Implementation Notes
- Caching strategy
- Performance considerations
- Batch operations
- Special patterns

## 10. Next Phase / Future Enhancements
```

---

## Enhancement Plan by Feature

### Layer 0 (Core - No Dependencies)

#### 1. **Product Management**
**Current**: 52 lines (bare minimum)  
**Enhancement**: 200-250 lines

Missing:
- [ ] Detailed product types & attributes
- [ ] Category hierarchy explanation
- [ ] SKU management strategy
- [ ] POS mapping (Moka integration prep)
- [ ] Use case: Create product with categories
- [ ] Use case: Update product pricing
- [ ] Data model with constraints
- [ ] API endpoint documentation

---

#### 2. **Location Management**
**Current**: 51 lines (has decent coverage)  
**Enhancement**: 150-180 lines

Missing:
- [ ] Clear location type use cases
- [ ] Detailed stock transfer path rules
- [ ] Use case: Setup new outlet
- [ ] Use case: Warehouse stock allocation
- [ ] Permission scoping per location
- [ ] API endpoints documentation
- [ ] Integration with IAM (LBAC)

---

### Layer 1 (Master Data)

#### 3. **Material / Raw Material Data**
**Current**: 52 lines (bare minimum)  
**Enhancement**: 250-300 lines

Missing:
- [ ] UOM (Unit of Measure) conversion system (critical!)
- [ ] Reorder point & quantity logic
- [ ] Minimum/maximum stock thresholds per location
- [ ] Material-Location binding explanation
- [ ] Cost tracking (WAC - Weighted Average Cost)
- [ ] Use case: Setup material with UOM conversion
- [ ] Use case: Check low stock alerts
- [ ] Use case: Request stock from warehouse
- [ ] Data model detail
- [ ] API endpoint documentation

---

#### 4. **Identity & Access Management (IAM)**
**Current**: 62 lines (best coverage so far)  
**Enhancement**: 200-250 lines

Missing:
- [ ] Role definitions (Admin, Manager, Staff, Viewer)
- [ ] Permission matrix (CRUD + Approve)
- [ ] Location-based access control (LBAC) explanation
- [ ] Use case: Create user with role + location
- [ ] Use case: Manage location managers
- [ ] Use case: Change user permissions
- [ ] Audit trail explanation
- [ ] API endpoint documentation

---

### Layer 1.5 (Security)

#### 5. **Authentication (Auth)**
**Current**: 38 lines (minimal!)  
**Enhancement**: 150-200 lines

Missing:
- [ ] JWT token structure & flow
- [ ] Login workflow
- [ ] Token refresh mechanism
- [ ] Password requirements
- [ ] Session management
- [ ] Use case: User login
- [ ] Use case: Token refresh
- [ ] Error scenarios (invalid credentials, expired token)
- [ ] API endpoints (/login, /refresh, /logout)
- [ ] Security best practices

---

### Layer 2 (Operations)

#### 6. **Inventory Operations**
**Current**: 47 lines (has good foundation)  
**Enhancement**: 300-350 lines

Missing:
- [ ] Stock movement types detailed (inbound, outbound, transfer, adjustment)
- [ ] Stock opname process detail (very important!)
- [ ] Waste tracking & categorization
- [ ] Stock ledger concept (append-only journal)
- [ ] Reserved stock explanation
- [ ] Use case: Daily stock check & order
- [ ] Use case: Inter-location transfer
- [ ] Use case: Waste entry logging
- [ ] Use case: Monthly opname
- [ ] Data model (StockMovement, StockLedger, StockOpname)
- [ ] API endpoints (transfer, waste, opname, ledger)
- [ ] Performance & accuracy metrics

---

#### 7. **Recipe & Bill of Materials**
**Current**: 47 lines (basic)  
**Enhancement**: 200-250 lines

Missing:
- [ ] BOM (Bill of Materials) structure
- [ ] Recipe versioning concept
- [ ] COGS (Cost of Goods Sold) calculation
- [ ] Yield / serving size concept
- [ ] Optional components (garnish, extras)
- [ ] Use case: Create recipe with components
- [ ] Use case: Calculate recipe cost
- [ ] Use case: Update recipe for cost control
- [ ] Data model (Recipe, RecipeComponent)
- [ ] COGS calculation example
- [ ] API endpoints
- [ ] Integration with inventory (auto-deduction on sale)

---

#### 8. **Sales & Distribution (B2B Sales)**
**Current**: 38 lines (minimal!)  
**Enhancement**: 250-300 lines

Missing:
- [ ] Sales order lifecycle (draft → confirmed → shipped → delivered)
- [ ] Inventory allocation & reservation concept
- [ ] Order fulfillment workflow
- [ ] Use case: Create sales order (customer order)
- [ ] Use case: Confirm order (allocate stock)
- [ ] Use case: Ship order (deduct inventory)
- [ ] Use case: Handle stockout situation
- [ ] Use case: Cancel order (release reserved stock)
- [ ] Data model (SalesOrder, SalesOrderLine)
- [ ] COGS recognition on shipment
- [ ] API endpoints (create, confirm, ship, cancel)
- [ ] Integration with inventory & recipe

---

### Layer 3 (Aggregators)

#### 9. **Dashboard & Analytics**
**Current**: 42 lines (very basic)  
**Enhancement**: 200-250 lines

Missing:
- [ ] KPI definitions (Revenue, COGS, Waste, Stock Value, Margin)
- [ ] Dashboard screens (KPI cards, charts, location filters)
- [ ] Metrics calculations
- [ ] Use case: Daily performance check
- [ ] Use case: Monthly profitability review
- [ ] Use case: Identify waste drivers
- [ ] Use case: Track inventory accuracy
- [ ] Chart types (line, bar, pie, area)
- [ ] Real-time vs. batch data refresh
- [ ] API endpoints (KPI endpoints, report generators)
- [ ] Location-specific vs. system-wide views

---

## Priority & Implementation Order

### Phase 1: Core Foundation (Week 1)
**Priority**: HIGH (blocks all other features)
1. **Product** (Layer 0) - Foundation for all
2. **Location** (Layer 0) - Geographic scoping
3. **Material** (Layer 1) - Inventory foundation

### Phase 2: Identity & Operations (Week 2)
**Priority**: HIGH
4. **IAM** (Layer 1) - User permissions, LBAC
5. **Auth** (Layer 1.5) - System access control
6. **Inventory** (Layer 2) - Core transactional feature

### Phase 3: Business Logic (Week 3)
**Priority**: MEDIUM
7. **Recipe** (Layer 2) - Cost calculation
8. **Sales** (Layer 2) - Revenue generation
9. **Dashboard** (Layer 3) - Reporting & insights

---

## Enhancement Structure Per Doc

Each doc should grow from ~50 lines to ~200-300 lines with:

### Additions by Type:

**Use Cases** (most valuable):
- 4-6 detailed use cases per feature
- Step-by-step workflows
- Actor identification
- Business rules & constraints
- Expected outcomes
- Error scenarios

**Data Model**:
- Entity listings
- Key fields & types
- Relationships
- Validations
- Constraints
- Indexes

**API Endpoints**:
- Endpoint path & method
- Request/response format
- Authentication required
- Error responses
- Example payloads

**Business Rules**:
- Validation constraints
- State transitions
- Permissions/access rules
- Integration requirements

**Implementation Notes**:
- Caching strategy
- Batch operations
- Performance considerations
- Common patterns

---

## Success Criteria

✅ Each doc has:
- Clear use cases (4-6 per feature)
- Data model documented
- API endpoints listed
- Business rules explicit
- Integration points clear
- ~200-300 lines of content

✅ Docs follow consistent template
✅ Cross-references between docs work
✅ Developers can implement from docs alone
✅ AI agents can understand scope from docs

---

## Effort Estimate

| Feature | Current | Target | Effort |
|---------|---------|--------|--------|
| Product | 52 | 250 | 2 hours |
| Location | 51 | 180 | 1.5 hours |
| Material | 52 | 300 | 2.5 hours |
| IAM | 62 | 250 | 2 hours |
| Auth | 38 | 200 | 2.5 hours |
| Inventory | 47 | 350 | 3 hours |
| Recipe | 47 | 250 | 2 hours |
| Sales | 38 | 300 | 3 hours |
| Dashboard | 42 | 250 | 2 hours |

**Total Effort**: ~20 hours (5 days @ 4 hrs/day)

---

## Next Step

Ready to begin enhancement phase. Should I:
1. **Start with Core Layer 0** (Product, Location, Material)?
2. **Start with highest value** (Inventory - most complex)?
3. **Start with user-facing** (Sales, Dashboard)?

Recommendation: **Start with Layer 0 → Layer 1 → Layer 2 → Layer 3** (bottom-up) to ensure dependencies understood first.

---

**Status**: Plan Created, Ready for Implementation  
**Blockers**: None  
**Next**: Begin with Product enhancement
