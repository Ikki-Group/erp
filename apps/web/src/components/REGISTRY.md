# Ikki ERP Web — Component Registry

> **AI DIRECTIVE**: Read this file BEFORE creating any UI component.
> If a component already exists here, USE IT. Do not duplicate.
> When adding a new component, update BOTH this file AND the corresponding `registry.ts`.

## Layer: layout (6 components)
| Component | Import | Usage |
|---|---|---|
| `AppLayout` | `@/components/layout/app-layout` | Root shell with sidebar. Used once in `/_app` route only. |
| `Page` | `@/components/layout/page` | Page container. Wrap every route page. Use `Page.BlockHeader` for headers. |
| `FormLayout` | `@/components/layout/form-layout` | Form page layouts. Use `FormLayout.Grid` for columns, `FormLayout.CardSection` for grouped fields. |
| `FormDialog` | `@/components/layout/form-dialog` | Dialog form layout. Use with `createCallable`. Pass `form.DialogActions` as footer, children as form fields. |
| `Breadcrumbs` | `@/components/layout/breadcrumbs` | Auto-generated breadcrumbs. Already in AppLayout. |
| `PageHeader` | `@/components/layout/page-header` | Standalone header for modals/panels. |
| `Primitives` | `@/components/layout/primitives` | Low-level: `Section`, `SectionHeader`, `SectionContent`. |

## Layer: form (6 components)
| Component | Import | Usage |
|---|---|---|
| `useAppForm` | `@/components/form` | Core form hook with Zod validation. Includes **Smart Fields** (Input, Select, Date, Checkbox, etc.) via `AppField` render props. |
| `useFieldContext` | `@/components/form` | Access field state in custom renderers. |
| `Field, FieldLabel, FieldError` | `@/components/form/form-tanstack` | TanStack-integrated field primitives with unified error display logic. |
| `field.Input, field.Select, field.Checkbox, field.Switch` | `@/components/form` | **Smart Components**: Automatically handle labels, descriptions, and error states. Use inside `AppField`. |
| `FormComponent` | `@/components/form/form-component` | Layout wrapper (`form.Form`) and action buttons (`form.SimpleActions`). |
| `FieldBase` | `@/components/form/form-field-component` | Base primitive for building custom smart fields. |

## Layer: data-table (7 components)
| Component | Import | Usage |
|---|---|---|
| `DataTable` | `@/components/data-table` | Core table renderer. Prefer `DataTableCard` for standard pattern. |
| `useDataTable` | `@/components/data-table/use-data-table` | Creates TanStack Table instance from columns + data + state. |
| `useDataTableState` | `@/components/data-table/use-data-table-state` | URL-synced table state (search, pagination, filters). Always use first. |
| `DataTableColumnHeader` | `@/components/data-table/data-table-column-header` | Sortable column header. |
| `DataTablePagination` | `@/components/data-table/data-table-pagination` | Pagination controls. Already in DataTableCard. |
| `DataTableToolbar` | `@/components/data-table/data-table-toolbar` | Toolbar with search + column toggles. |
| `FilterBar` | `@/components/data-table/filter-bar` | Advanced filter chips. |

## Layer: blocks (15 components)
### blocks/data-display
| Component | Import | Usage |
|---|---|---|
| `StatusBadge` | `@/components/blocks/data-display/status-badge` | Status badge from config map. Use `createStatusBadge(map)` for presets. |
| `BadgeDot` | `@/components/blocks/data-display/badge-dot` | Compact dot indicator for tables. |
| `DataList` | `@/components/blocks/data-display/data-list` | Key-value pairs for detail pages. |
| `DescriptionList` | `@/components/blocks/data-display/description-list` | Semantic dl/dt/dd list. |
| `DetailCard` | `@/components/blocks/data-display/detail-card` | Card + DescriptionList for entity details. |
| `ChartCard` | `@/components/blocks/data-display/chart-card` | Card wrapper for Recharts. Use `ChartGrid` for dashboards. |

### blocks/feedback
| Component | Import | Usage |
|---|---|---|
| `EmptyState` | `@/components/blocks/feedback/empty-state` | No-data placeholder with icon + action. |
| `ConfirmDialog` | `@/components/blocks/feedback/confirm-dialog` | Imperative confirm. Call: `await ConfirmDialog({...})`. |
| `LoadingPage` | `@/components/blocks/feedback/loading-page` | Full-page spinner for Suspense fallbacks. |
| `ErrorBoundary` | `@/components/blocks/feedback/ErrorBoundary` | React error boundary. Already at root. |
| `NotFoundPage, ErrorPage` | `@/components/blocks/feedback/error-pages` | Pre-styled 404/403/error pages. |

### blocks/card
| Component | Import | Usage |
|---|---|---|
| `DataTableCard` | `@/components/blocks/card/data-table-card` | **Standard list page pattern.** Card + table + toolbar + pagination. |
| `CardSection` | `@/components/blocks/card/card-section` | Content grouping card. |
| `CardStat` | `@/components/blocks/card/card-stat` | KPI metric card for dashboards. |

### blocks/brand
| Component | Import | Usage |
|---|---|---|
| `IkkiLogo` | `@/components/blocks/brand/logo` | Official brand logo. |

## Layer: providers (1 component)
| Component | Import | Usage |
|---|---|---|
| `ThemeSwitcher, ThemeListener` | `@/components/providers/theme` | Theme toggle + meta sync. ThemeListener in app root. |

## Standard Page Patterns

### List Page (Table)
```tsx
import { Page } from '@/components/layout/page'
import { FeatureTable } from '@/features/[domain]/components/[domain]-table'

// Route file: only compose, never define UI
function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title="..." action={<Button>Create</Button>} />
      <Page.Content><FeatureTable /></Page.Content>
    </Page>
  )
}
```

### Create/Edit Page (Form)
```tsx
import { Page } from '@/components/layout/page'
import { FormLayout } from '@/components/layout/form-layout'

function RouteComponent() {
  return (
    <Page size="md">
      <Page.BlockHeader title="..." back={{ to: '/...' }} />
      <Page.Content>
        <FormLayout>
          <FormLayout.CardSection title="...">
            <FormLayout.Grid>...</FormLayout.Grid>
          </FormLayout.CardSection>
          <FormLayout.Actions>...</FormLayout.Actions>
        </FormLayout>
      </Page.Content>
    </Page>
  )
}
```

### Detail Page
```tsx
import { Page } from '@/components/layout/page'
import { DetailCard } from '@/components/blocks/data-display/detail-card'

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title="..." back={{ to: '/...' }} />
      <Page.Content>
        <DetailCard title="Info" items={[...]} />
      </Page.Content>
    </Page>
  )
}
```
