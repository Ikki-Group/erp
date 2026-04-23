# Ikki ERP: Business Vision & Strategy

> **Version**: 1.0  
> **Last Updated**: 2026-04-24  
> **Audience**: Stakeholders, Developers, Product Managers

---

## 1. Executive Vision

### 1.1 What We're Building

Ikki ERP is a modern, purpose-built Enterprise Resource Planning system designed specifically for **multi-location food & beverage businesses** with integrated warehouse operations. Our platform unifies inventory management, purchasing, production, sales, and analytics across restaurants, coffee shops, and warehouses—eliminating data silos and enabling data-driven decision-making.

### 1.2 Target Client Profile

**Primary**: Mid-scale F&B chains operating 2-10 locations with centralized warehouse operations
- **Ikki Group**: 2+ restaurants/cafes with shared central warehouse (Gudang Utama)
- **Operational Complexity**: Multi-outlet inventory coordination, recipe standardization, supplier management
- **Pain Points**: Manual order tracking, data fragmentation across outlets, lost profitability visibility

**Secondary**: Expandable to specialized food production (catering, manufacturing, meal prep)

### 1.3 Core Problems We Solve

| Problem | Impact | Our Solution |
|---------|--------|--------------|
| **Data Fragmentation** | Inventory at Outlet A doesn't sync with Central Warehouse. Purchasing decisions lack real-time visibility | Unified centralized database with real-time sync across locations |
| **Inefficient Ordering** | Manual spreadsheets and WhatsApp messages. Outlets often stock-out or overstock | Automated stock request system with intelligent reorder points |
| **Production Inefficiency** | Recipe costs unknown. Waste not tracked. Profitability per menu item unclear | Digital recipe management with automatic COGS calculation and waste tracking |
| **Purchasing Opacity** | No visibility into supplier performance. Manual PO tracking. Duplicate orders possible | Structured purchasing workflow with PO management and supplier analytics |
| **Reconciliation Hell** | Physical counts don't match system records. Manual adjustments error-prone | Systematic stock opname with digital sheets and variance reconciliation |
| **Decision Paralysis** | No visibility into sales trends, inventory turnover, or profitability by location | Real-time dashboards with KPIs, trends, and location-specific analytics |

---

## 2. Business Objectives & Success Metrics

### 2.1 Short-Term Goals (6 months)

1. **Operational Efficiency**
   - Reduce manual data entry by **80%**
   - Decrease order-to-fulfillment cycle time by **50%**
   - Eliminate double-entry errors in inventory transactions

2. **Inventory Accuracy**
   - Achieve **98%+ system-to-physical count accuracy**
   - Reduce stock-out incidents by **60%**
   - Decrease overstock incidents by **40%**

3. **Cost Visibility**
   - Enable per-outlet profitability tracking
   - Identify top 10% waste drivers (by cost)
   - Calculate accurate COGS per menu item

### 2.2 Medium-Term Goals (12 months)

1. **Revenue Impact**
   - Identify and eliminate $X cost leakages per location
   - Optimize recipe costs through material standardization
   - Enable data-driven menu engineering

2. **Scalability**
   - Support seamless addition of new outlets (0-6 hour onboarding)
   - Handle 10-50 daily transactions per location with <100ms response time
   - Support archive and multi-year historical analysis

3. **Integration Ecosystem**
   - Integrate with Moka POS for real-time sales-to-inventory sync
   - Connect with supplier APIs for automated pricing updates
   - Export financial data to accounting systems (future)

### 2.3 Success Metrics Dashboard

**Financial**
- COGS accuracy: ≥ 95%
- Gross margin improvement: +2-5% per location
- Waste as % of COGS: < 3%

**Operational**
- Inventory accuracy: ≥ 98%
- Order cycle time: < 4 hours
- System uptime: ≥ 99.5%

**User Experience**
- Daily active users: 100% of relevant staff
- Average task completion time: < 5 minutes
- User satisfaction: ≥ 4.2/5.0

---

## 3. Core Business Processes

### 3.1 The Ikki Operating Model

```
DAILY OPERATIONS CYCLE
├── Morning: Stock Check & Ordering
│   ├─ Outlet checks stock levels on app
│   ├─ System highlights low-stock items vs. min threshold
│   └─ Outlet submits automated stock request
├── Mid-Day: Warehouse Operations
│   ├─ Warehouse packs stock request
│   ├─ Records transfer (from Warehouse to Outlet)
│   └─ Outlet receives & confirms in system
├── Service Hours: Sales & Consumption
│   ├─ POS captures sales
│   ├─ ERP auto-deducts recipe materials
│   ├─ Staff logs waste/spoilage manually
│   └─ Outlet can request emergency stock
└── End of Shift: Physical Count
    ├─ Staff performs stock opname (using app sheet)
    ├─ System flags discrepancies vs. expected
    └─ Manager approves adjustments (if variance > threshold)

WEEKLY/MONTHLY CYCLES
├── Weekly: Purchasing Review
│   ├─ Procurement reviews stock velocity & demand forecast
│   ├─ Creates Purchase Orders to suppliers
│   └─ Tracks delivery ETAs
├── Monthly: Reporting & Analysis
│   ├─ Finance closes books with certified ledgers
│   ├─ Outlet managers review profitability dashboards
│   ├─ Identify cost optimization opportunities
│   └─ Planning for next month
└── Quarterly: Strategic Review
    ├─ Analyze trends across all locations
    ├─ Menu engineering based on profitability
    └─ Supplier performance review & negotiation
```

### 3.2 Key User Roles & Responsibilities

| Role | Location | Key Activities | System Access |
|------|----------|-----------------|---|
| **Head Chef / Manager** | Outlet | Check inventory, create stock requests, log waste, approve opname adjustments | Full outlet-level access |
| **Barista / Staff** | Outlet | Log waste, contribute to opname counts | Limited—view only, log waste |
| **Warehouse Manager** | Gudang Utama | Receive orders, process transfers, manage warehouse inventory | Full warehouse access |
| **Procurement Officer** | Head Office | Create purchase orders, track supplier performance | Purchasing module full access |
| **Finance/Controller** | Head Office | Review ledgers, approve high-variance adjustments, generate reports | Read-only + approval rights |
| **System Administrator** | Head Office | User management, role assignment, system config | Full system access |

---

## 4. Strategic Differentiators

### 4.1 Why Ikki ERP vs. Generic ERP?

| Aspect | Generic ERP | Ikki ERP |
|--------|------------|----------|
| **Design** | One-size-fits-all | Purpose-built for F&B + warehouse |
| **User Interface** | Complex, 50+ menu items | Streamlined, 5-7 key functions |
| **Deployment** | Weeks to setup | Days to deploy |
| **Cost** | $1000s/month | Flexible SaaS pricing (TBD) |
| **Support** | Generic tech support | F&B domain experts |
| **Integration** | Limited POS support | Native Moka + extensible |
| **Speed** | Bureaucratic workflows | Fast, outlet-friendly UX |

### 4.2 Competitive Advantages

1. **Domain Expertise**: Built by people who understand F&B operations, not generic software engineers
2. **Speed**: Optimized for 5-second stock checks and 30-second orders, not 10-minute data entry forms
3. **Real-Time Visibility**: Live inventory across all outlets with push alerts (vs. batch overnight updates)
4. **Cost Intelligence**: Automatic COGS, waste tracking, and profitability per menu item
5. **Scalability**: Designed to grow from 2 to 50 outlets without architectural rewrites

---

## 5. Phased Rollout Strategy

### Phase 1: MVP (Current) — Core Operations
**Target**: Ikki Coffee + Ikki Resto only
**Timeline**: By 2026-Q2
**Scope**:
- Inventory management across 2 locations
- Manual stock requests and transfers
- Basic opname and adjustments
- Dashboard with stock and cost visibility

**Success Criteria**:
- 100% staff adoption (Chef, Manager, Warehouse staff)
- System-to-physical accuracy ≥ 95%
- Manual processes reduced by 60%

### Phase 2: Scale & Integration (Q3 2026)
**Scope**:
- Moka POS integration for real-time sales→inventory
- Purchasing module (PO, GRN, supplier tracking)
- Advanced recipe costing
- Predictive ordering (ML-based)
- Multi-outlet expansion (3-5 locations)

### Phase 3: Ecosystem & Intelligence (Q4 2026+)
**Scope**:
- Financial integration (accounting system export)
- Advanced reporting & BI
- Supplier management portal
- Mobile apps for staff (Android/iOS)
- Menu engineering dashboard

---

## 6. Technical Foundation

### 6.1 Why Modern Tech Stack?

**Technology Choice Rationale**:
- **Bun + TypeScript**: Fast runtime, single language across stack, superior developer experience
- **ElysiaJS**: Type-safe REST API framework, automatic OpenAPI docs
- **React 19**: Modern UI with optimal performance for data-heavy operations
- **PostgreSQL**: Proven reliability for financial/inventory data; ACID transactions mandatory
- **Drizzle ORM**: Type-safe queries prevent SQL injection and data corruption

### 6.2 Design Principles

1. **Type Safety First**: Zero `any` types. Compile-time errors > runtime errors
2. **Performance**: Sub-100ms response times for all operations (including pagination)
3. **Auditability**: Every write includes actor ID (who + when + what changed)
4. **Resilience**: Transactions for all multi-step operations, automatic retries
5. **Observability**: Full request tracing, structured logging, error tracking

---

## 7. Risk Management & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| **Data Loss** | Low | Critical | Daily backups, point-in-time recovery, redundant replicas |
| **System Downtime** | Low | High | 99.5% uptime SLA, auto-scaling, failover mechanisms |
| **User Adoption** | Medium | High | Intensive training, Champions program, phased rollout |
| **Integration Delays** | Medium | Medium | Moka API contract finalized early, clear API specs |
| **Feature Scope Creep** | Medium | Medium | Strict MVP boundary, Phase 2/3 roadmap |
| **Security Breach** | Low | Critical | Encryption at rest/transit, regular penetration testing, SOC 2 compliance (Phase 2) |

---

## 8. Success Criteria (Go/No-Go Decision Points)

### Pre-Launch (MVP Validation)
- [ ] All 4 core modules coded + tested (Location, Material, Inventory, Recipe)
- [ ] Ikki Coffee + Ikki Resto fully onboarded (100% staff trained)
- [ ] System-to-physical accuracy ≥ 95% for 4 consecutive weeks
- [ ] Zero critical bugs; <5 medium bugs in production
- [ ] User satisfaction ≥ 4.0/5.0 from team feedback

### Phase 2 Gate (Scale Decision)
- [ ] Demonstrated measurable cost savings (ROI positive)
- [ ] Moka integration tested with live POS data
- [ ] 3rd location ready to onboard with <6 hour setup
- [ ] Historical data (90 days) validated and clean

---

## 9. What Success Looks Like (12 Months)

✅ **Ikki Group is fully digital**
- No more manual spreadsheets or WhatsApp orders
- Every outlet manager uses the system daily
- Real-time visibility into inventory across all locations

✅ **Cost reduction achieved**
- Identified and eliminated $X/month in waste
- Recipe standardization improved margins by X%
- Purchasing negotiation powered by supplier performance data

✅ **System runs itself**
- Low-stock alerts automatically notify outlets
- Purchasing suggestions auto-generated for approval
- Opname discrepancies flagged and resolved in <24 hours

✅ **Data-driven decisions**
- Monthly profitability reports by location and menu item
- Trend analysis guides menu engineering
- Supplier performance visible to stakeholders

✅ **Ready to scale**
- Framework proven and documented
- 3rd location add zero friction
- Clear roadmap for next 12 months

---

## 10. Next Steps

1. **Stakeholder Review** (Week 1): Finalize vision with C-level + operations team
2. **Detailed PRD** (Week 2): Convert this vision into comprehensive feature specifications
3. **Architecture Review** (Week 2-3): Validate technical design against objectives
4. **Team Alignment** (Week 3): Engineering, product, operations alignment on MVP boundary
5. **Development Sprint** (Week 4+): Full-speed feature development

---

**Prepared by**: AI Architecture Assistant  
**Reviewed by**: [Stakeholder names TBD]  
**Approval Date**: [TBD]
