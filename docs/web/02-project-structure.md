# Project Structure

Folder conventions, feature module layout, and route file organization for `apps/web`.

## Top-Level Layout

```
apps/web/
├── src/
│   ├── components/          ← shared UI components
│   │   └── ui/             ← shadcn/base-ui primitives (generated)
│   ├── config/              ← app-wide config
│   │   └── endpoint.ts     ← all API endpoint URLs (manual, later generated)
│   ├── features/            ← business logic per module
│   │   ├── auth/
│   │   ├── location/
│   │   ├── material/
│   │   ├── menu/
│   │   ├── pos/
│   │   ├── inventory/
│   │   └── ...
│   ├── hooks/               ← shared hooks (non-feature-specific)
│   ├── lib/                 ← framework utilities
│   │   ├── api/            ← HTTP client, endpoint factories, errors
│   │   ├── validation/     ← shared Zod schemas, response wrappers
│   │   └── utils.ts        ← cn() and general utilities
│   ├── providers/           ← React context providers
│   │   ├── auth-provider.tsx
│   │   └── location-provider.tsx
│   ├── routes/              ← TanStack Router file-based routes
│   │   ├── __root.tsx
│   │   ├── login.tsx
│   │   ├── _authenticated.tsx
│   │   └── _authenticated/
│   │       ├── index.tsx
│   │       ├── settings/
│   │       ├── master/
│   │       ├── pos/
│   │       └── inventory/
│   ├── main.tsx             ← React entrypoint
│   ├── router.tsx           ← Router creation + context injection
│   ├── routeTree.gen.ts     ← auto-generated (never edit)
│   └── styles.css           ← Tailwind entry
├── components.json          ← shadcn/ReUI registry config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Feature Module Structure

Each feature module lives in `src/features/{module}/` and follows this internal layout:

```
features/location/
├── dto/                     ← TypeScript types (from server contracts)
│   ├── location.dto.ts
│   └── index.ts
├── api.ts                   ← endpoint definitions (defineQuery/defineMutation)
├── queries.ts               ← TanStack Query hooks (if needed beyond api.ts)
├── components/              ← module-specific UI components
│   ├── location-form.tsx
│   ├── location-table.tsx
│   └── location-switcher.tsx
└── lib/                     ← module-specific utilities, transforms
    └── format-location.ts
```

### Rules

1. **dto/** contains types copied or derived from server contracts. When codegen is ready, these are generated. Until then, manually maintained.
2. **api.ts** defines all endpoints for the module using `defineQuery`/`defineMutation`/`defineResource`. This is the single file that knows the HTTP details.
3. **queries.ts** is optional — only needed if you build custom hooks on top of the raw endpoint definitions (e.g., composing multiple queries).
4. **components/** holds UI specific to this module. Shared UI goes in `src/components/`.
5. **lib/** holds transforms, formatters, or constants specific to this module.

### Naming

| Item           | Convention                | Example                    |
| -------------- | ------------------------- | -------------------------- |
| Feature folder | kebab-case (module name)  | `features/payment-method/` |
| DTO file       | `{entity}.dto.ts`         | `material.dto.ts`          |
| Component file | kebab-case                | `material-form.tsx`        |
| API file       | always `api.ts`           | `features/material/api.ts` |
| Hook file      | `use-{name}.ts`           | `use-stock-alerts.ts`      |

## Route File Organization

Routes use TanStack Router's file-based convention. Route files are **thin** — they define the route config, optional loaders, and render a page component (inline for simple pages, imported from features for complex ones).

```
routes/
├── __root.tsx                       ← root layout (providers, devtools)
├── login.tsx                        ← public login page
├── _authenticated.tsx               ← layout: auth guard + app shell
└── _authenticated/
    ├── index.tsx                    ← dashboard
    ├── settings/
    │   ├── company.tsx
    │   ├── users.tsx
    │   └── roles.tsx
    ├── master/
    │   ├── locations.tsx
    │   ├── materials.tsx
    │   ├── uom.tsx
    │   ├── suppliers.tsx
    │   ├── menu.tsx
    │   ├── recipes.tsx
    │   └── payment-methods.tsx
    ├── pos/
    │   ├── orders.tsx
    │   ├── tables.tsx
    │   ├── shifts.tsx
    │   └── vouchers.tsx
    └── inventory/
        ├── stock.tsx
        ├── transfers.tsx
        ├── receiving.tsx
        └── opname.tsx
```

### Route File Thickness

- **Simple pages** (CRUD list + detail): inline page component in the route file. No separate feature component needed.
- **Complex pages** (POS order creation, multi-step forms, dashboards): route file imports the page component from `features/{module}/components/`.

```tsx
// Simple — inline
export const Route = createFileRoute('/_authenticated/master/locations')({
  component: LocationsPage,
})

function LocationsPage() {
  // small enough to live here
}
```

```tsx
// Complex — import from feature
import { PosOrderPage } from '@/features/pos/components/pos-order-page'

export const Route = createFileRoute('/_authenticated/pos/orders')({
  component: PosOrderPage,
})
```

## Module Scope Classification

Routes are organized by whether they are global or location-sensitive:

| Route Group               | Location-Sensitive? | Notes                            |
| ------------------------- | ------------------- | -------------------------------- |
| `settings/*`              | No                  | Company, IAM are global          |
| `master/locations`        | No                  | Managing locations themselves     |
| `master/uom`              | No                  | Global conversion system         |
| `master/materials`        | Partial             | List global, assignment per-loc  |
| `master/suppliers`        | No                  | Suppliers serve all locations    |
| `master/menu`             | **Yes**             | Menus are per-location           |
| `master/recipes`          | **Yes**             | Tied to location menus           |
| `master/payment-methods`  | **Yes**             | Per-location config              |
| `pos/*`                   | **Yes**             | All POS ops are per-location     |
| `inventory/*`             | **Yes**             | Stock is per-location            |

Location-sensitive pages read from the location context and include `?loc=` in the URL for shareability.

## Shared Directories

### `src/components/`

Shared, non-feature-specific UI components:

```
components/
├── ui/              ← shadcn/ReUI generated primitives (button, dialog, etc.)
├── app-shell/       ← sidebar, header, location-switcher
├── data-table/      ← reusable DataTable built on TanStack Table + ReUI
└── form/            ← shared form field components (form-input, form-select, etc.)
```

### `src/lib/`

Framework-level utilities:

```
lib/
├── api/             ← HTTP client, endpoint factories, error types
│   ├── client.ts   ← fetch wrapper (base URL, credentials, error handling)
│   ├── endpoint.ts ← defineQuery, defineMutation, defineResource
│   ├── resource.ts ← CRUD sugar
│   ├── errors.ts   ← ApiError class
│   ├── http.ts     ← low-level request function
│   ├── types.ts    ← shared type utilities
│   └── validate.ts ← Zod parse-or-throw with dev logging
├── validation/      ← shared Zod schemas
│   ├── index.ts    ← zc (common schemas), zq (query helpers), response wrappers
│   └── response.ts ← createSuccessResponseSchema, createPaginatedResponseSchema
└── utils.ts         ← cn(), general utilities
```

### `src/config/`

App-wide configuration:

```
config/
├── endpoint.ts      ← all API endpoint URLs (single registry)
└── constant.ts      ← API_URL, app-wide constants
```

## Import Aliases

| Alias | Resolves to     |
| ----- | --------------- |
| `@/`  | `apps/web/src/` |

Use `@/` for all imports. Never relative paths beyond the current feature module.

---

**Next:** [03-api-layer.md](./03-api-layer.md) — HTTP client and endpoint factory patterns.
