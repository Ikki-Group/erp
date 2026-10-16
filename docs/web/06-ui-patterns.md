# UI Patterns

Shared workflow modules remove repeated orchestration from views; features retain validation, API mapping, permissions, and business rules. Use `apps/web/COMPONENT_GUIDE.md` for component selection and `apps/web/DESIGN.md` for visual authority.

## Resource lists

Reference consumers: `routes/_authenticated/master/materials/index.tsx` and `suppliers/index.tsx`.

`useResourceList` builds on `useServerTable`. The route owns validated URL search and maps it to its API query; the controller owns table state, result extraction, query-state precedence, and pagination resets. There is no second local copy of list search.

```tsx
const search = Route.useSearch()
const query = useQuery({
  ...materialResource.list.queryOptions({
    page: search.page,
    limit: search.pageSize,
    q: search.q,
    categoryId: search.categoryId,
  }),
  throwOnError: false,
})
const list = useResourceList({
  query,
  columns,
  search,
  onSearchChange: (next) => navigate({ search: next }),
  hasFilters: (value) => value.categoryId !== undefined,
})
```

The query envelope is `{ data: T[], meta: { total: number } }`; the query exposes `isPending`, `isFetching`, `isError`, and `refetch`. Free-text `q` counts as an active filter automatically. Extra filters remain typed through `list.setFilters({ categoryId })`, which resets page 1. Table search/sort/pagination preserve those extra filters. Do not advertise server sorting unless the endpoint supports and receives it.

`EntityListPage` accepts `list`, not separate loading/error/empty flags. `createAction` is defined once and reused in the header and unfiltered empty state. `actions` adds secondary header actions. `toolbar` remains available during failure and empty states.

State contract:
- `initial-loading`: skeleton rows, without a false empty prompt.
- `initial-error`: retryable error with header and filters retained.
- `ready` + `isRefreshing`: retain current rows and show refresh status.
- `refresh-error`: retain loaded rows and show inline retry.
- `record-empty`: feature-specific initial empty state and create action.
- `filtered-empty`: no matching results, with filters still available.

Queries feeding an inline-state module use `throwOnError: false`; otherwise global network-error throwing bypasses the module and can unmount work. HTTP authorization still belongs to the backend. `useServerTable` remains the lower-level choice for specialized views using `DataTable` directly; `useClientTable` serves small in-memory datasets.

## Typed columns

`createEntityColumns<T>()` from `@/components/data-table` provides `code`, `text`, `quantity`, `money`, `date`, `status`, `booleanStatus`, and `actions`. It owns the existing cell conventions, not entity policy.

```tsx
const col = createEntityColumns<MaterialDto>()
const columns = [
  col.code('code', { header: 'Code', size: 100 }),
  col.text('name', { header: 'Name', size: 200 }),
  col.booleanStatus('isActive', { header: 'Status' }),
]
```

Numeric headers align with numeric cells; null is an em dash, not zero. `cellProps` configures a renderer (for example quantity units or text truncation); ordinary TanStack options and custom `cell` renderers remain available. `StatusBadge` represents workflow state; plain `Badge` represents a category/type.

## Entity editors

Reference consumers: Materials, Suppliers, Units of Measure, Locations, custom Roles, Users, Recipes, Menu Items, and Payment Methods create/edit routes with feature-owned form hooks and mappings. Location editors retain their wider identity/contact layout while using the same lifecycle; system roles are presentation-only. Company Settings uses the same lifecycle with an explicit on-page saved baseline.

The feature owns:
1. Form values, defaults, and a form-shape Zod schema.
2. `toXxxFormValues(entity)` and `toXxxInput(values)`.
3. Its create/update choice and feature-specific error translation.
4. JSX field layout, not a JSON form-generation schema.

`useEntityEditor` composes `useEntityForm` with mutation execution, success feedback, and a stable editing-session baseline. Resource `.fetch()` already owns invalidation; do not invalidate the same query again in the view. `onSaved` stays route-owned navigation. Failed mutations remain inline and retain entered values.

`useEntityForm` owns the named `EntityForm<TValues>` contract, including registered app fields and validation state. Editor hooks return it; feature types such as `RecipeEditorForm` and `CompanyForm` specialize it with their form values instead of deriving a public contract with `ReturnType<typeof hook>`.

```tsx
function NewMaterialPage() {
  const navigate = useNavigate()
  const onDone = () => navigate({ to: '/master/materials' })
  const form = useMaterialForm({ onSaved: onDone })
  return (
    <EntityEditorPage title="Add Material" form={form} onCancel={onDone} submitLabel="Create">
      <MaterialFormFields form={form} />
    </EntityEditorPage>
  )
}
```

`EntityEditorPage` owns form context, submit-error presentation, and unsaved-navigation protection through existing `FormPage`. Do not add a duplicate `AppForm`, `FormError`, or guard around it. Render edit sessions only after detail data resolves, with `key={entity.id}`. Same-entity background updates do not overwrite drafts; a different entity starts a new keyed session. `DetailBoundary` keeps a mounted editor through refresh failures and offers retry rather than discarding the draft.

On-page editors may omit `onSaved` and provide `baselineAfterSave(payload, result)` to map the successfully submitted payload to the new baseline. This is opt-in: ordinary navigated editors keep their initial session baseline. The rebase preserves top-level fields changed during the request, compared by identity; values must be immutable, with no deep merge implied. Later edits remain guarded even after an earlier successful submission. Company Settings is the reference consumer.

For forms that do not need mutation lifecycle orchestration, `useEntityForm` still owns on-change/on-submit validation and error translation. TanStack normalizes `{ form: message, fields: {} }` into `errorMap.onSubmit` as a string; `FormError` reads that normalized value. An error caught by the submit callback must still count as unsaved even if TanStack marks that callback resolved.

## Relation lookup fields

Render feature-owned fields inside an `AppField` whose value is `number | null`:

```tsx
<form.AppField name="baseUomId">
  {() => <UomLookupField label="Base UoM" />}
</form.AppField>
```

Direct imports:
- `features/material/components/material-lookup-field`: `MaterialLookupField`.
- `features/material/components/category-lookup-field`: `CategoryLookupField`.
- `features/supplier/components/supplier-lookup-field`: `SupplierLookupField`.
- `features/uom/components/uom-lookup-field`: `UomLookupField`.
- `features/location/components/location-lookup-field`: `LocationLookupField`.
- `features/iam/components/role-lookup-field`: `RoleLookupField`.
- `features/menu/components/menu-item-lookup-field`: `MenuItemLookupField`, with required `locationId`.

Shared props: `label`, `placeholder?`, `description?`, `disabled?`, `excludeIds?`. Exclusions hide another assignment row's choices while preserving this field's current selection and detail resolution. Material adds optional `locationId` for assignment-scoped choices and `onSelect(entity | null)` for decisions such as default UOM; omitting the location retains the global lookup. Supplier defaults to active-only purchasing options; `activeOnly={false}` enables broader selection. Selected inactive suppliers still resolve by detail.

`ResourceLookupField` and `useResourceLookup` own debounced server search, 25-record pages and Load more, canonical resource caching, selection outside the current page, error/retry states, and accessible field wiring. Search failures are not empty results. A failed selected-record fetch preserves the selected ID and any known label. Lists never silently stop at the first 100 records. Enter during pending search cannot select a stale option or submit the enclosing form.

Keep endpoint filters and display mapping in feature adapters. Location detail currently rejects inactive locations server-side; the field exposes a retryable selected-record failure rather than inventing a label.

## Operational line items

`LineItemEditor` is shared by receiving and transfer wizards. It owns add/remove controls, responsive row layout, array errors, stable identity, and focus transitions. The feature supplies `rows`, `createRow`, `onAdd`, `onRemove`, `renderFields`, `fieldCount`, labels, and optional header actions.

- Create each row with `createLineItem(values)` once. Its `clientKey` remains stable while field-array indices change.
- Never key rows by index. Deleting a middle row must preserve the following row's values and mounted controls.
- Map mutation DTO fields explicitly; `clientKey` is UI state, not an API field.
- Added rows focus their first editable control. Removal focuses the next row, previous row, or Add when empty.
- Every row retains real field labels, including visually repeated rows.
- Receiving owns supplier-catalogue import and unit prices. Transfers own location rules and material base-UOM defaulting.
- Review labels resolve detail keys shared with the lookups. Receiving subtotals/totals use exact decimal-string arithmetic, not floating-point totals.

Keep the existing wizard/form validation and domain constraints in the feature. The shared editor is not a universal transaction schema.

## Consequential actions

`useWorkflowAction<TEntity>` composes permission/availability checks, confirmation, pending-state suppression, execution, retry, and success feedback:

```tsx
const deletion = useWorkflowAction<MaterialDto>({
  availability: () => canDelete,
  confirmation: (material) => ({
    title: 'Delete material?',
    description: `Remove "${material.name}" from the list? Existing records are retained.`,
    confirmLabel: 'Delete',
    variant: 'destructive',
  }),
  execute: (material) => removeMut.mutateAsync({ id: material.id }),
  successMessage: 'Material deleted successfully.',
})
```

Call `deletion.run(entity)` and use `deletion.isPending` for presentation. Availability is checked before opening and again before execution; it may return a reason string. One interaction owns one dialog and one in-flight execution, including retries. A failed execution leaves Cancel and Try Again visible and never announces success. Backend authorization and resource invalidation remain unchanged. Do not describe soft deletion as irreversible destruction.

Locations use feature-owned `useLocationDelete({ onDeleted? })` in both list and detail views. Despite the API verb, the operation deactivates the location; history remains. The backend lists and resolves active locations only, so the list supports search/type filters, not an unsupported inactive-status filter. Units and conversions are permanently deleted; their confirmation copy and server constraint failures remain distinct.

## Lightweight dialog forms

Use `formDialog({ content: ({ close }) => ... })` for a focused quick-add, not a complex editor. Use `FormRoot` for native form submission and `FormDialogFooter` for submit/cancel. Feature fields can use ordinary `useEntityForm` here. Full-page entity editors use `EntityEditorPage` instead.

Callable dialog roots (`FormDialog`, `Confirm`) are mounted outside `AuthProvider` and the authenticated location provider. Resolve permissions in the authenticated caller and pass explicit capability props into dialog content; calling `usePermissionCheck` from that content throws. This is presentation gating only; the server remains authoritative if access changes while a dialog is open.

UOM conversion creation uses `useEntityEditor` in the dialog with `FormRoot` and `FormDialogFooter`. Both relations use `UomLookupField`; no first-999 list or separate selector cache exists. `UomLabel` resolves canonical detail keys for conversion rows and offers retry on failures. Factors remain decimal strings, distinct-unit validation stays local, and category/uniqueness restrictions stay server-owned. Conversion create/delete actions honor their respective UOM permissions.

## IAM editor policy

`useRoleForm({ role?, onSaved })` owns custom-role DTO mapping and mutation lifecycle. `saveRole` rejects system roles before issuing a request. `RoleDetails` is a presentation-only system-role view: permission search remains usable, but no editing session, submit handler, or mutation is created. Role deletion requires `iam.delete` and a non-system role; the backend still rejects roles assigned to users.

`useUserEditor({ user?, onSaved })` returns `{ form, mode }`. Profile and assignment mappings live in `features/iam/user-form-values.ts`; orchestration lives in `user-editor-save.ts`. User fields remain JSX, with `withForm` preserving their inferred field types. Username is locked after creation; passwords appear only during create or in the separate reset dialog, never in update payloads.

Assignment rows use stable client-only keys and nullable role/location selections. Global scope permits distinct global roles; selected-location scope permits one role per location. Changing scope clears the draft assignments. Lookup exclusions prevent duplicate choices, while schema validation remains authoritative for the form. Client keys and scope UI state never enter API payloads.

Account creation and access changes are separate server requests, not an atomic transaction. The editing session retains a confirmed created account ID if later requests fail. An explicit **Retry save** refreshes current user detail, removes obsolete assignments before adding missing ones, and does not recreate the account or repeat committed assignment requests. Errors state that the account is saved but access changes may be incomplete; no rollback is claimed. There are no automatic retries, persisted passwords, or stored drafts. The retained ID is session-local: after leaving/reloading a partially completed create flow, reopen the existing account rather than create it again. A create request whose response is lost remains an ambiguous outcome; this frontend does not invent server idempotency.

Backend authorization, owner-global-only and last-owner restrictions remain server-owned. Frontend permission gates are presentation safeguards, not replacements. `resetUserPassword` owns its form, mutation, success feedback, and session-signout explanation; callers only await it and must not add a second success toast. User deactivation uses the shared pending-safe confirmation workflow.

## Supplier pricing and material locations

`PricingTable({ supplierId, permissions })` accepts `{ read, create, update, delete }` capabilities resolved by the Suppliers route. It uses shared table/list-state primitives with local 20-row pagination because an embedded dialog does not own route search. Changing supplier starts a new paging session. Initial failures render retry instead of empty; refresh failures retain rows. Removing the final row on a final page returns to a valid page after fresh query data arrives.

`PricingForm` owns `useEntityEditor`, `FormRoot`, and `FormDialogFooter`; the caller supplies `canSave` and close callbacks. Material and UOM fields use canonical searchable lookups. Material identity is visible but immutable on edit; update payloads contain only price, unit, and minimum quantity. Decimal values stay strings end to end: `CurrencyField` accepts Indonesian comma-decimal display, DTOs receive dot-decimal canonical values, and price cells use string grouping rather than float conversion or rounded IDR formatting. Blank minimum means null; zero means zero. Labels resolve detail queries rather than capped preload arrays. Pricing create/update/delete each honor the corresponding supplier permission.

`LocationAssignment({ materialId, permissions })` accepts `{ canRead, canAssign, canUnassign }`; the caller combines material/location read permissions and passes distinct material.create/material.delete write capabilities. `useLocationAssignment` owns 25-row server search/pagination independently of the complete by-material assignment set. Read-only users see status without mutation controls. Initial assignment failure never paints every location as unassigned. Stale relation status remains visible after refresh failure, but writes stay disabled until a successful read.

An assignment mutation retains the requested desired state and uses no automatic retries. A failed/lost response exposes an inline Retry for that action; Retry first fetches authoritative assignments and only writes if the desired state is still unmet. This prevents duplicate assignment or accidental inversion after a committed request whose response was lost. A ref guard spans mutation and awaited invalidation/refetch. Paging, search, query retry, and independent assign/unassign permissions remain available as appropriate.

Material relation cache keys distinguish prefixes from IDs: `keys.byMaterial()` / `keys.byLocation()` return `[endpoint]`; the ID variants return `[endpoint, id]`. Mutations invalidate prefixes in the resource layer. A `[endpoint, null]` key is not a prefix of `[endpoint, 125]` and must not be used for broad invalidation. Views do not add another invalidation convention.

## Recipes and company settings

Recipes use full-page `/master/recipes/new` and `/master/recipes/$recipeId` editors, not callable dialogs. Feature mappings keep yield and ingredient quantities as decimal strings, strip client-only row keys, and omit the immutable menu item from updates. `LineItemEditor` supplies stable row identity, focus, and a one-row minimum; feature fields retain their own validation. Material and menu searches use the editing session's location, with canonical detail resolution for existing selections outside a search page.

The recipe editor pins its initial location. Changing the header location (including All Locations) preserves the draft, freezes relation choices, removes the save action, and offers a return-to-session-location action. Submission also checks the live location and write permission before making a request. Returning to the correct location restores editing without remounting. Failed saves retain input and offer explicit retry.

The recipe list remains global, while HPP follows the active location. Its endpoint does not support free-text search or sorting, so the page exposes pagination only. HPP is the menu item's active-recipe cost, never an inactive recipe's historical cost. Zero is valid; missing active recipes, request failures, and loading are distinct. Failed refreshes keep the last cost with a stale warning and retry. Display uses standard currency rounding, with the exact server string in the cell title. Recipe mutations invalidate list, enriched detail, by-menu-item and location-specific HPP keys together.

Company Settings mounts only after the singleton record loads. Failed/missing reads offer recovery without an empty writable form; read-only access has no save action. Successful saves stay on-page and establish a clean, normalized baseline without overwriting later edits, including when refetched data arrives after rebasing. Hidden logo data is retained, blank optional fields become null, and tax values stay decimal strings. Failed saves preserve input and permit same-value retry; Retry save is disabled throughout submission to prevent repeated requests. Server authorization remains authoritative for both workflows.

## Menu Items and Payment Methods

`useEditorLocationScope(fixedLocationId?)` in `lib/form` is shared by Recipes and Menu Items. New sessions pin the first selected location. Existing Menu Items pass **`item.locationId`**, never the header location; this applies when opened under another location or All Locations. Mount after detail resolution and key by record ID. Header changes preserve the editing session; `isCurrent` gates saving, `restore()` returns to the pinned scope, and `canRestore` distinguishes unavailable location access. Keep the restore action outside disabled form fields. Mutation code also verifies the live location and write permission before sending.

`useMenuItemEditor` owns normalization, exact decimal prices, create/update payloads and success feedback. Updates omit unedited `imageUrl` rather than clearing it. `MenuCategoryLookupField` and `MenuCategoryFilter` search and page only within the pinned location. The category API has no detail endpoint: the existing category label comes from enriched item detail, or a selection is resolved by paging the same location's category list. Selected-label resolution never adds choices to the eligible list. The Menu Items list supports text/category/status filters, not unsupported sorting; category management offers additional pages instead of stopping at 100.

Payment Methods remain global. `PaymentMethodEditor` uses the shared editor lifecycle and named form contract; read-only users have no save action and disabled fields. Same-value retry is explicit and pending-safe. The list retains text/type filters and uses shared list error states and consequential deletion. `paymentMethodMutations` owns invalidation of list, affected detail, and by-location readers; views do not duplicate it. Server deletion constraints remain visible in the confirmation dialog. POS checkout and location-assignment workflows are unchanged.

## Verification and adoption

The catalog's Tables page demonstrates resource-list states. Real reference views include Materials/Suppliers/UOM/Locations/Users/custom-Roles/Recipes/Menu-Items/Payment-Methods editors and lists, Company Settings, system-role details, UOM conversions, and receiving/transfer wizards. Tests cover state precedence, URL filters, selected-record resolution, pending search, stable line identity, record-owned location scope, editor retention, on-page saved baselines, cache invalidation, IAM partial-save reconciliation, permission immutability, and action retries. Exercise actual workflows when changing shared modules; a catalog specimen alone is insufficient.

All existing `EntityListPage` callers use the list-model contract; there is no legacy flag interface. Other specialized `DataTable`/`useServerTable` views intentionally remain lower-level. Entity editor lifecycle adoption covers Materials, Suppliers, UOM, Locations, Users, custom Roles, Recipes, Company Settings, Menu Items, and Payment Methods; other forms retain their established `useEntityForm` integration.
