---
title: "ADR-0001: Frontend Ecosystem Lockdown for UX/DX Overhaul"
status: "Accepted"
date: "2026-04-07"
authors: "Antigravity, Rizqy"
tags: ["architecture", "frontend", "decision", "ui", "ux"]
supersedes: ""
superseded_by: ""
---

# ADR-0001: Frontend Ecosystem Lockdown for UX/DX Overhaul

## Status

**Accepted**

## Context

The Ikki ERP application is undergoing a massive UI, UX, and DX overhaul, prioritizing small business usability and long-term developer experience. During the initial planning phase, a debate arose regarding whether to introduce new technologies or leverage existing ones. It was decided that to maintain operational stability and reduce refactoring overhead, the frontend technology stack must strictly adhere to the dependencies already present in `apps/web/package.json`. Additionally, the existing UI component library (`shadcn` components) must not be tampered with directly.

## Decision

We will lock down the frontend technology stack for the UI/UX overhaul to the following existing ecosystem:
- **Routing & State**: `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-form`.
- **Data Visualization**: `@tanstack/react-table`.
- **UI Components & Styling**: `shadcn` (with strict no-edit policy on `apps/web/src/components/ui/`), `@base-ui/react`, and `@tailwindcss/vite` (Tailwind V4).
- **Icons**: `lucide-react` and `@hugeicons/react`.

Any custom styling or layout composition must be done at the page or composite-component level, never by altering the foundational `shadcn` elements.

## Consequences

### Positive

- **POS-001**: Drastically reduces initial setup time as dependencies are already installed and resolving.
- **POS-002**: Maintains consistency across the application by preventing ad-hoc modifications to base UI components.
- **POS-003**: Ensures a top-tier Developer Experience (DX) by utilizing the modern, type-safe TanStack ecosystem.

### Negative

- **NEG-001**: Restricts the ability to quickly hack or fix underlying bug in `shadcn` components without ejecting or composing wrappers around them.
- **NEG-002**: Requires higher proficiency in Tailwind CSS to compose complex layouts without touching base components.

## Alternatives Considered

### Introduce completely new UI framework (e.g., Mantine or Chakra UI)

- **ALT-001**: **Description**: Rip out shadcn and Base UI in favor of a monolithic UI framework.
- **ALT-002**: **Rejection Reason**: Rejected to avoid breaking existing functionality and to respect the user constraint of sticking to the existing `package.json`.

### Direct modification of Shadcn components

- **ALT-003**: **Description**: Allow developers to edit `apps/web/src/components/ui/*.tsx` files to meet bespoke design needs.
- **ALT-004**: **Rejection Reason**: Explicitly forbidden by stakeholder to preserve component integrity and allow for easier future updates.

## Implementation Notes

- **IMP-001**: All new pages (starting with *Operasional & Stok*) must be routed through `@tanstack/react-router`.
- **IMP-002**: Any UI variations (e.g., a differently styled button) must be achieved by wrapping the base `Button` component and passing custom Tailwind V4 utility classes.
- **IMP-003**: Data fetching must route through `@tanstack/react-query` to ensure caching and synchronization with the Elysia/Drizzle backend.

## References

- **REF-001**: Next implementation target: Phase 3 (Operasional & Stok overhaul).
