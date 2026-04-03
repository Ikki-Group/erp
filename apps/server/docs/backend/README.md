# Backend Style Guide & Standards

Welcome to the Ikki ERP Backend Standards. This repository represents the **Golden Path 2.0** — our definitive architectural standard for building scalable, type-safe, and efficient enterprise backend services.

## 🏛️ Core Architecture

This guide organizes our standards into the following areas:

| Area | Purpose |
| :--- | :--- |
| [📂 Project Structure](./standards/project-structure.md) | Module-based organization and the layered architecture. |
| [📝 DTO (Data Transfer Objects)](./standards/dto.md) | Zod schema composition and type-name matching patterns. |
| [🛠️ Service Layer (Layer 0)](./standards/service.md) | Business logic orchestration, performance, and caching. |
| [🚦 Router Layer (Layer 1)](./standards/router.md) | Elysia route definitions, validation, and response handlers. |
| [🗄️ Database (Drizzle ORM)](./standards/database.md) | Naming conventions, efficiency (Integers), and audit helpers. |
| [🚨 Error & Validation](./standards/error-validation.md) | Standard error classes and validation rules. |

## 🚀 The Golden Path 2.0 Principles

1.  **Strict Type Safety**: We eliminate all `any` and `@ts-ignore`. If a type is unknown, use Zod to narrow it.
2.  **Storage Efficiency**: We favor **Serial Integers** for IDs unless a cross-system UUID is strictly required. High performance and low index latency are foundational.
3.  **Consistency Over Convenience**: We follow standardized naming and composition patterns (`...Base.shape`) to ensure that every domain module (Location, IAM, Assets, etc.) feels familiar and maintainable.
4.  **Separation of Concerns**: Business logic belongs in **Services**. Request handling and authorization belong in **Routers**.
5.  **Auditability**: Every record must track its lifecycle (created, updated, deleted, and synced) using standardized core helpers.

## 🤝 Reference Implementations

The following modules represent the "Perfect Implementation" of these standards:
- `src/modules/location/`
- `src/modules/iam/`

Always refer to these modules when starting a new feature.

---

> [!IMPORTANT]
> Adherence to these standards is mandatory for all contributions. If a pattern isn't documented here, check the reference implementation or discuss with the lead architect.
