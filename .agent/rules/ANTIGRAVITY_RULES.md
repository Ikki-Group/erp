---
trigger: always_on
---

# Antigravity Agent Rules: ERP Monorepo

These rules are designed to guide the Antigravity Agent in assisting with the development of the ERP Monorepo project. Follow these guidelines strictly to ensure code quality, consistency, and scalability.

## 1. Project Overview

This is a Monorepo workspace managed with `bun`.

### Structure

- **apps/web**: Frontend application (Vite, React, TypeScript).
- **apps/server**: Backend application (Bun, Elysia, Drizzle ORM).
- **packages/api**: Shared API definitions and SDK (Eden Treaty).

## 2. Technology Stack & Preferences

### General

- **Package Manager**: Always use `bun` (e.g., `bun install`, `bun run dev`, `bun add`).
- **Language**: TypeScript (Strict mode). No `any` unless absolutely necessary and documented.
- **Validation**: Zod v4 for all schema validation (API requests, forms, env vars).

### Frontend (`apps/web`)

- **Framework**: React 19 + Vite.
- **Styling**: Tailwind CSS v4.
  - Use `shadcn/ui` components as primitives.
  - Do not modify `components/ui` primitives directly unless necessary.
  - Extend styles via utility classes or `components/common`.
  - Design should be **Modern, Compact, and Responsive** (mobile-first).
- **State Management**:
  - Server State: Tanstack Query v5.
  - Client/UI State: Zustand.
  - URL State: Tanstack Router (search params).
- **Routing**: Tanstack Router (file-based routing in `src/routes`).
- **Forms**: Tanstack Form + Zod Adapter.
- **API Client**: Eden Treaty (`@ikki/api-sdk`).
- **Folder Structure**: Feature-Sliced Design inspiration.
  - `src/features/*`: Domain-specific modules (components, hooks, types).
  - `src/components/common/*`: Shared business components (Layouts, DataTables).
  - `src/components/ui/*`: Base UI primitives.
  - `src/lib/*`: Core utilities and configurations.

### Backend (`apps/server`)

- **Framework**: ElysiaJS.
- **Database**: Postgres with Drizzle ORM.
- **Architecture**: Service-Controller pattern.
- **Type Safety**: End-to-end type safety via Eden Treaty.

## 3. Coding Standards

### TypeScript

- **Strict Types**: Always define interfaces/types for props, state, and API responses.
- **No Implicit Any**: Avoid `any`. Use `unknown` with narrowing if type is truly dynamic.
- **Type Sharing**: Share types between frontend and backend via `packages/api` when possible.

### Component Design

- **Functional Components**: Use React Functional Components.
- **Props**: Use interface for Props.
- **Clean Code**: Keep components small. Extract logic to custom hooks (`use...`) inside `features/*/hooks`.

### File Organization

- **Colocation**: Keep related files close (e.g., `features/auth/components`, `features/auth/hooks`).
- **Naming**:
  - Components: PascalCase (`MyComponent.tsx`).
  - Hooks: camelCase (`useMyHook.ts`).
  - Utilities: camelCase (`myUtility.ts`).

## 4. Workflows

### 1. Planning & Analysis

- Before implementing, analyze the relevant `apps` or `packages`.
- Check `package.json` for dependencies.
- Plan the folder structure updates if adding new features.

### 2. Implementation

- Create data models/schemas (Zod) first.
- Implement core logic/hooks.
- Build UI components.
- Connect to API/Store.

### 3. Verification

- **Runs**: Always verify the app runs (`bun run dev`).
- **Types**: Run type checks (`bun tsc --noEmit`) to catch errors early.
- **Lint**: Ensure code follows linting rules.

## 5. Agent Behavior

- **Be Proactive**: If you see a missing type or potential bug, fix it or suggest a fix.
- **Be Concise**: specific solutions over long explanations.
- **Follow Patterns**: Respect existing patterns in the codebase (e.g., how `DataTable` is used).
- **Check Task List**: Always keep `task.md` updated with progress.
