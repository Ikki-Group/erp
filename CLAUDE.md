# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠 Development Commands

### Root Commands
- **Dev (Server)**: `bun run dev:server`
- **Dev (Web)**: `bun run dev:web`
- **Lint**: `bun run lint` (using Oxlint)
- **Format**: `bun run format` (using Oxfmt)
- **Check All**: `bun run check` (lint + format + knip)

### Backend (`apps/server`) Commands
- **Test**: `bun run test` (all tests) or `bun test src/path/to/test.ts` (single test)
- **Typecheck**: `bun run typecheck`
- **Verify**: `bun run verify` (lint + typecheck + knip + check-deps)
- **DB Operations**: `bun run db:generate`, `bun run db:migrate`, `bun run db:studio`, `bun run db:seed`
- **Dependency Audit**: `bun run check-deps` (circular dependency check via dpdm)

### Frontend (`apps/web`) Commands
- **Test**: `bun run test` (Vitest)
- **Typecheck**: `bun run typecheck`
- **Build**: `bun run build`

## 🏛 Code Architecture & Patterns

### Core Principles
- **Runtime**: Exclusively use **Bun**.
- **IDs**: Use **Serial Integers** for PKs/FKs. Avoid UUIDs unless specified.
- **Validation**: Use `@/core/validation` primitives (e.g., `zId`).
- **Composition**: Use **Spread-Shape Pattern** for Zod DTOs instead of `.extend()` to maintain clean TS inference.
  ```typescript
  export const MyDto = z.object({ ...BaseDto.shape, ...zId.shape })
  ```
- **Linting**: Uses **Oxlint** and **Oxfmt**. Do not add ESLint/Prettier configs.

### Backend Architecture (The Golden Path 2.1)
- **Structure**: Layer 0 (Service) → Layer 1 (Router).
- **DTOs**: Located in `dto/`. MUST append `Dto` suffix (e.g., `LocationDto`, `CreateLocationDto`).
- **Routers**: Use **Functional/Inline async handlers** in Elysia routers to ensure accurate type inference.
- **Service Layer**: Handles all DB mutations, business logic, auditing (via metadata spread), and telemetry (OpenTelemetry).
- **Dependency Injection**: Constructor-based injection managed in `src/modules/_registry.ts`.
- **Strict Layering**:
  - **Layer 0 (Core)**: `location`, `product`.
  - **Layer 1 (Master)**: `iam`, `materials`.
  - **Layer 1.5 (Security)**: `auth`.
  - **Layer 2 (Operations)**: `inventory`, `recipe`, `sales`.
  - **Layer 3 (Aggregators)**: `dashboard`, `tool`, `moka`.
- **Import Rules**: Modules can only depend on lower layers. Circular dependencies are forbidden.

### Frontend Architecture
- **Framework**: React 19 + Vite + Tailwind CSS v4.
- **Routing**: `@tanstack/react-router` (File-based routing in `src/routes/`).
- **State**: `@tanstack/react-query` v5 (Server state), `zustand` v5 (Local state).
- **Forms**: `@tanstack/react-form` + Zod.
- **API**: `ky` client factory in `src/lib/api/`.

## 📋 Templates & Reference
- **Templates**: Reference `docs/templates/` for standard DTO, Service, and Router implementations.
- **Reference Modules**: Use `src/modules/location/` and `src/modules/iam/` as the standard for implementation patterns.
