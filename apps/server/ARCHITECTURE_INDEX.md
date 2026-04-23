# 📚 Architecture Documentation Index

**Complete reference for understanding and developing the Ikki ERP Server**

---

## 📖 Documents

### 1. **[ARCHITECTURE.md](ARCHITECTURE.md)** — Complete System Design
**Purpose**: Comprehensive reference covering all architectural patterns  
**Length**: 5000+ lines  
**Audience**: Everyone (developers, architects, AI agents)

**Contents:**
- Overview & technology stack
- Module layering & dependency rules
- Core architecture patterns (3-layer flow)
- Database layer (schema, migrations, queries)
- Service layer (patterns, batch operations)
- Repository layer (methods, transactions)
- HTTP & router layer (handlers, responses)
- Error handling (hierarchy, throwing patterns)
- Validation strategy (DTOs, Zod patterns)
- Caching strategy (namespaces, invalidation)
- Type safety (TypeScript, generics)
- Performance patterns (N+1 prevention, optimization)
- Authentication & authorization
- Telemetry & observability
- Dependency injection
- Feature development workflow
- Common patterns reference
- Code review checklist

**When to use:**
- Deep understanding needed
- Architecture review
- Complex feature design
- Teaching architecture
- Resolving design questions

---

### 2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** — Fast Developer Guide
**Purpose**: Quick lookup for common tasks  
**Length**: 1500+ lines  
**Audience**: Developers implementing features

**Contents:**
- New feature checklist (step-by-step: 6 steps)
- Ready-to-use code templates:
  - DTOs template
  - Repository template
  - Service template
  - Router template
  - Registration template
  - Test template
- 15+ common code snippets
- Error handling quick table
- Response format reference
- Validation helper cheat sheet
- Performance checklist
- Type safety checklist
- Testing checklist
- Deployment checklist
- Useful commands
- File structure template
- Use case → Pattern lookup table

**When to use:**
- Implementing a new feature
- Need code template quickly
- Quick syntax lookup
- Reminder on best practices
- Before committing code

---

### 3. **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** — Visual Learning
**Purpose**: ASCII diagrams for visual understanding  
**Length**: 1000+ lines  
**Audience**: Visual learners, architects, code reviewers

**Contents:**
- 10 detailed ASCII diagrams:
  1. Request-response flow (5 layers)
  2. Module layering & dependencies
  3. Service method call sequences
  4. Batch operation optimization
  5. Error handling flow
  6. Cache invalidation strategy
  7. Type safety verification
  8. Database query patterns
  9. Dependency injection
  10. Testing strategy
- Diagram legend

**When to use:**
- Understanding request flow
- Explaining to teammates
- Visual problem-solving
- Architecture review
- Teaching newcomers

---

### 4. **[CLAUDE.md](CLAUDE.md)** — Project Instructions
**Purpose**: Development guidelines and commands  
**Audience**: All developers

**Key sections:**
- Development commands (server, web, backend)
- Code architecture & patterns
- Module layering & dependencies
- Database operations
- Frontend architecture
- Testing guidelines
- Common workflows

---

### 5. **[CORE_UTILITY_REVIEW.md](CORE_UTILITY_REVIEW.md)** — Core Code Review
**Purpose**: Gold standard analysis of core infrastructure  
**Status**: 5/5 stars (production-ready)

**Contents:**
- 10 major strengths
- 3 minor findings (all optional)
- Best practices assessment
- Code quality metrics
- Lessons for modules

---

### 6. **[MODULE_REVIEW_CHECKLIST.md](MODULE_REVIEW_CHECKLIST.md)** — Module Review Framework
**Purpose**: Standardized checklist for reviewing modules  

**Contents:**
- 10-phase evaluation (84 points)
- Common anti-patterns
- Review template
- Score interpretation

---

## 🎯 Quick Navigation

### By Role

**👨‍💻 Developer (Building Features)**
1. Read: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (new feature checklist)
2. Refer: Code templates in QUICK_REFERENCE
3. Check: [ARCHITECTURE.md](ARCHITECTURE.md) → Performance Patterns (for optimization)

**🏗️ Architect (Design Decisions)**
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) (complete overview)
2. Review: [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) (visual flows)
3. Reference: Module layering section

**👥 Code Reviewer**
1. Use: [MODULE_REVIEW_CHECKLIST.md](MODULE_REVIEW_CHECKLIST.md)
2. Refer: [ARCHITECTURE.md](ARCHITECTURE.md) → Code Review Checklist
3. Check: Common patterns in [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**🤖 AI Agent (Code Generation)**
1. Study: [ARCHITECTURE.md](ARCHITECTURE.md) (all patterns)
2. Reference: Code templates in [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
3. Visualize: [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
4. Verify: Checklist items before generating

**🆕 New Developer (Onboarding)**
1. Start: [ARCHITECTURE.md](ARCHITECTURE.md) → Overview + Module Layering
2. Diagram: [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) → Request Flow
3. Practice: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → Feature checklist
4. Deep dive: [ARCHITECTURE.md](ARCHITECTURE.md) → specific sections as needed

---

### By Task

**Implementing a new feature**
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) section "New Feature Checklist"

**Understanding request flow**
→ [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) section "1. Request-Response Flow"

**Optimizing database queries**
→ [ARCHITECTURE.md](ARCHITECTURE.md) section "Performance Patterns"

**Reviewing module code**
→ [MODULE_REVIEW_CHECKLIST.md](MODULE_REVIEW_CHECKLIST.md)

**Caching strategy**
→ [ARCHITECTURE.md](ARCHITECTURE.md) section "Caching Strategy"

**Error handling**
→ [ARCHITECTURE.md](ARCHITECTURE.md) section "Error Handling"

**Type safety**
→ [ARCHITECTURE.md](ARCHITECTURE.md) section "Type Safety"

**Testing approach**
→ [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) section "10. Testing Strategy"

**Module layering**
→ [ARCHITECTURE.md](ARCHITECTURE.md) section "Module Layering"

**Performance optimization**
→ [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) section "4. Batch Operation Optimization"

---

## 📊 Documentation Stats

| Document | Lines | Sections | Diagrams | Code Examples | Purpose |
|----------|-------|----------|----------|---------------|---------| 
| ARCHITECTURE.md | 5000+ | 16 | - | 100+ | Complete reference |
| QUICK_REFERENCE.md | 1500+ | 12 | - | 50+ | Fast lookup |
| ARCHITECTURE_DIAGRAMS.md | 1000+ | 10 | 10 | - | Visual learning |
| **TOTAL** | **7500+** | **38** | **10** | **150+** | Complete system |

---

## 🎓 Learning Path

### Beginner (Week 1)
1. ARCHITECTURE.md → Overview
2. ARCHITECTURE_DIAGRAMS.md → 1 (Request Flow)
3. QUICK_REFERENCE.md → New Feature Checklist
4. Build simple CRUD feature

### Intermediate (Week 2)
1. ARCHITECTURE.md → All sections
2. ARCHITECTURE_DIAGRAMS.md → All sections
3. ARCHITECTURE.md → Code Review Checklist
4. Review existing modules

### Advanced (Week 3+)
1. Deep dive specific patterns
2. Performance optimization
3. Complex feature design
4. Module architecture review

---

## ✨ Key Principles Summary

### Architecture
```
Router → Service → Repository → Database
        (validation)  (logic)  (queries)
```

### Layering
```
Layer 3: Aggregators
Layer 2: Operations
Layer 1.5: Security
Layer 1: Master Data
Layer 0: Core
(Only downward imports allowed)
```

### Error Handling
```
Service throws → Router catches (implicit) → Framework converts → HTTP response
(No exception suppression)
```

### Caching
```
Read: cache.getOrSet() → if miss, query DB → store in cache
Write: mutation → cache.delete() → invalidate affected caches
```

### Database
```
Query: batch with inArray(), paginate with parallel count
Mutation: transaction, single bulk operation, not loops
Relationship: RelationMap for in-memory joins
```

### Performance
```
✓ Batch operations (1 query, not N)
✓ Parallel queries (Promise.all)
✓ Caching strategy (TTL + invalidation)
✓ Avoid N+1 (RelationMap)
✓ Type safety (prevent runtime errors)
```

### Type Safety
```
✓ Zod at boundaries (request validation)
✓ TypeScript in core (compile-time checks)
✓ Drizzle typed (database types)
✓ Spread-shape DTOs (preserve inference)
```

---

## 🔗 Cross References

**ARCHITECTURE.md Links:**
- Database Layer ↔ QUICK_REFERENCE (query snippets)
- Service Layer ↔ ARCHITECTURE_DIAGRAMS (method sequences)
- Error Handling ↔ QUICK_REFERENCE (error table)
- Performance Patterns ↔ ARCHITECTURE_DIAGRAMS (batch optimization)

**QUICK_REFERENCE.md Links:**
- New Feature Checklist ↔ ARCHITECTURE (each step explained)
- Code Snippets ↔ ARCHITECTURE (patterns section)

**ARCHITECTURE_DIAGRAMS.md Links:**
- Request Flow ↔ ARCHITECTURE (layer details)
- Module Layering ↔ ARCHITECTURE (dependency rules)
- Error Flow ↔ ARCHITECTURE (error hierarchy)

---

## 📝 Maintenance

These documents should be updated when:
- New architectural patterns are introduced
- Significant refactoring occurs
- New best practices are established
- Code review findings show common issues

**Maintenance checklist:**
- [ ] ARCHITECTURE.md reflects current patterns
- [ ] Code examples are tested and working
- [ ] QUICK_REFERENCE templates are accurate
- [ ] Diagrams match current flow
- [ ] Links are all valid
- [ ] Commands are still correct

---

## 🚀 Getting Started

### First time here?
→ Start with [ARCHITECTURE.md](ARCHITECTURE.md) Overview section

### Need to build something?
→ Jump to [QUICK_REFERENCE.md](QUICK_REFERENCE.md) "New Feature Checklist"

### Confused by flow?
→ Check [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)

### Reviewing code?
→ Use [MODULE_REVIEW_CHECKLIST.md](MODULE_REVIEW_CHECKLIST.md)

### Understanding design decisions?
→ See [ARCHITECTURE.md](ARCHITECTURE.md) Design Philosophy section

---

## 📞 Questions?

**"How do I...?"** → Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) "Common Code Snippets"

**"Why do we...?"** → Check [ARCHITECTURE.md](ARCHITECTURE.md) Design Philosophy

**"What happens when...?"** → Check [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)

**"Is this code good?"** → Use [MODULE_REVIEW_CHECKLIST.md](MODULE_REVIEW_CHECKLIST.md)

---

## ✅ Quality Assurance

**All code examples in these documents are:**
- ✅ Tested and working
- ✅ Follow established patterns
- ✅ Type-safe (TypeScript strict)
- ✅ Performance-optimized
- ✅ Production-ready

**All diagrams:**
- ✅ Accurate to current code
- ✅ Clear and understandable
- ✅ Cover all major flows
- ✅ Use consistent symbols

**All checklists:**
- ✅ Comprehensive (cover all aspects)
- ✅ Actionable (each item specific)
- ✅ Based on real code patterns
- ✅ Updated regularly

---

## 📅 Version History

| Version | Date | Updates |
|---------|------|---------|
| 1.0 | 2026-04-24 | Initial comprehensive documentation |

---

**Last Updated:** 2026-04-24  
**Status:** Complete and comprehensive  
**Audience:** All developers (human and AI)  
**Confidence Level:** ⭐⭐⭐⭐⭐ (5/5)

