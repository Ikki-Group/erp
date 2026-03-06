# ERP Backend Code of Conduct

This document defines the architectural principles, project structure, and coding standards for an **ERP backend** built with **TypeScript, Elysia, Zod, Mongoose, and Drizzle**.

This document is **opinionated and non-negotiable**. Its purpose is to ensure long-term scalability, readability, consistency, and maintainability across the entire codebase.

---

## 1. Core Architecture Principles

### 1.1 Domain-First (Package by Feature)

- The project **must be structured by business domain**, not by technical layers.
- Each domain (module) is isolated and self-contained.

**REQUIRED**

- `modules/warehouse`
- `modules/inventory`
- `modules/auth`

**FORBIDDEN**

- Root-level `controllers/`, `services/`, or `models/` folders

---

### 1.2 Framework-Agnostic Core

- Business logic **must not depend on Elysia**.
- Domain logic must be reusable across HTTP, CLI, workers, and tests.

---

### 1.3 Zod as Single Source of Truth

Zod schemas are the authoritative source for:

- Validation
- Type inference
- OpenAPI documentation

**STRICT RULES**

- Do not write manual `interface` or `type` definitions if `z.infer` can be used
- Do not duplicate request/response schemas

---

## 2. Standard Project Structure

```
src/
├── app.ts
├── server.ts

├── config/
├── shared/
├── infrastructure/
│   ├── mongoose/
│   └── drizzle/

├── modules/
│   └── <domain>/
│       ├── *.route.ts
│       ├── *.controller.ts
│       ├── *.service.ts
│       ├── *.repository.ts
│       ├── *.schema.ts
│       ├── *.types.ts
│       ├── *.model.ts
│       └── *.errors.ts

└── bootstrap/
```

---

## 3. Layer Responsibilities

### 3.1 Route Layer (`*.route.ts`)

- Defines HTTP endpoints
- Integrates Elysia with OpenAPI
- Maps requests to controllers

**FORBIDDEN**

- Business logic
- Database access

---

### 3.2 Controller Layer (`*.controller.ts`)

- Translates HTTP input/output to domain calls
- Relies on Zod for validation

**ALLOWED**

- Input/output mapping

**FORBIDDEN**

- Business rules
- Direct database access

---

### 3.3 Service Layer (`*.service.ts`)

- Contains all business rules
- Orchestrates use cases

**REQUIRED**

- Stateless services
- Explicit dependency injection via constructor

---

### 3.4 Repository Layer (`*.repository.ts`)

- Abstracts data access
- Repository interfaces belong to the domain

**RULES**

- Services depend only on repository interfaces
- Database implementations are infrastructure details

---

### 3.5 Model Layer (`*.model.ts`)

- Database-specific implementation (Mongoose / Drizzle)
- Must not leak into controllers or services

---

## 4. Dependency Injection Rules

- All dependencies must be wired in the **composition root**
- Never instantiate services inside other services

**VALID FLOW**

```
controller → service → repository
```

---

## 5. Error Handling

- Use domain-specific error classes (`*.errors.ts`)
- Never throw generic `Error` from service layer

**REQUIRED**

- Errors must represent business rule violations

---

## 6. Database Usage Rules

### 6.1 Mongoose

- Used for operational and transactional data
- Schemas should be minimal; logic belongs in services

### 6.2 Drizzle

- Used for relational data, reporting, and cross-domain queries

**RULE**

- Domain logic must remain database-agnostic

---

## 7. ERP-Specific Mandatory Rules

Every ERP module **must** support:

- `createdAt`, `updatedAt`
- `createdBy`, `updatedBy`
- Activity or audit logging

Audit logic belongs in the **service layer**, not only in middleware.

---

## 8. Testing Guidelines (High Level)

- Test business logic at the service layer
- Mock repositories in unit tests
- Do not test business rules via controllers

---

## 9. Anti-Patterns (Strictly Forbidden)

❌ Business logic inside routes
❌ Controllers accessing databases directly
❌ Manual types duplicating Zod schemas
❌ Global shared service singletons
❌ Business rules hidden in middleware

---

## 10. Final Principle

> **An ERP backend is a long-term investment.**

Readability > short-term speed
Consistency > individual freedom
Domain > framework

This document defines the minimum engineering standard for all ERP backend modules.
