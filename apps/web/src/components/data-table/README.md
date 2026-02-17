# Data Table Component

A powerful, type-safe, and feature-rich data table component built on top of TanStack Table v8.

## Features

- ✅ **Full TypeScript Support** - Strict typing with no `any` types
- ✅ **Sorting** - Single and multi-column sorting
- ✅ **Filtering** - Column filters and global search
- ✅ **Pagination** - Client and server-side pagination
- ✅ **Row Selection** - Single and multi-row selection
- ✅ **Column Visibility** - Show/hide columns
- ✅ **Column Pinning** - Pin columns to left/right
- ✅ **Column Resizing** - Adjustable column widths
- ✅ **Loading States** - Skeleton loaders
- ✅ **Empty States** - Customizable empty messages
- ✅ **Responsive** - Mobile-friendly design
- ✅ **Accessible** - ARIA labels and keyboard navigation

## Installation

The component is already installed in your project. Import from:

```tsx
import { DataTable, useDataTable } from '@/components/data-table'
```

## Basic Usage

```tsx
import { DataTable, useDataTable } from '@/components/data-table'
import { createColumnHelper } from '@tanstack/react-table'

interface User {
  id: string
  name: string
  email: string
}

const columnHelper = createColumnHelper<User>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
]

function MyTable() {
  const table = useDataTable({
    data: users,
    columns,
  })

  return (
    <DataTable table={table}>
      <DataTable.Table />
      <DataTable.Pagination />
    </DataTable>
  )
}
```

## Advanced Features

### Sorting

```tsx
const table = useDataTable({
  data: users,
  columns,
  features: {
    enableSorting: true,
  },
  callbacks: {
    onSortingChange: (sorting) => {
      console.log('Sorting changed:', sorting)
    },
  },
})
```

### Row Selection

```tsx
const columns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  }),
  // ... other columns
]

const table = useDataTable({
  data: users,
  columns,
  features: {
    enableRowSelection: true,
    enableMultiRowSelection: true,
  },
  callbacks: {
    onSelectionChange: (selectedRows) => {
      console.log('Selected:', selectedRows)
    },
  },
})
```

### Server-Side Pagination

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['users', page, limit],
  queryFn: () => fetchUsers({ page, limit }),
})

const table = useDataTable({
  data: data?.items ?? [],
  columns,
  isLoading,
  serverConfig: {
    data: data?.items ?? [],
    rowCount: data?.total ?? 0,
    pageCount: data?.pageCount,
  },
  manualPagination: true,
  state: {
    page,
    limit,
    search: '',
    filters: {},
  },
})
```

### Column Metadata

Enhance columns with metadata for better UX:

```tsx
const columns = [
  columnHelper.accessor('price', {
    header: 'Price',
    meta: {
      label: 'Product Price',
      unit: 'USD',
      filterable: true,
      sortable: true,
      filterVariant: 'range',
      range: [0, 1000],
    },
  }),
]
```

### Custom Row Actions

```tsx
const table = useDataTable({
  data: users,
  columns,
  callbacks: {
    onRowClick: (row) => {
      navigate(`/users/${row.id}`)
    },
    onRowDoubleClick: (row) => {
      openEditDialog(row)
    },
  },
})

// In the table component
<DataTable.Table
  onRowClick={(row) => console.log('Clicked:', row)}
  onRowDoubleClick={(row) => console.log('Double clicked:', row)}
  rowClassName={(row) => row.status === 'inactive' ? 'opacity-50' : ''}
/>
```

### Loading & Empty States

```tsx
<DataTable.Table
  skeletonRows={15}
  emptyMessage="No users found. Try adjusting your filters."
/>
```

## API Reference

### `useDataTable(options)`

Main hook for creating a table instance.

#### Options

| Option             | Type                      | Default  | Description               |
| ------------------ | ------------------------- | -------- | ------------------------- |
| `data`             | `TData[]`                 | required | Array of data items       |
| `columns`          | `ColumnDef<TData>[]`      | required | Column definitions        |
| `isLoading`        | `boolean`                 | `false`  | Loading state             |
| `features`         | `DataTableFeatures`       | `{}`     | Feature flags             |
| `callbacks`        | `DataTableCallbacks`      | `{}`     | Event callbacks           |
| `serverConfig`     | `DataTableServerConfig`   | -        | Server-side config        |
| `manualPagination` | `boolean`                 | `false`  | Manual pagination control |
| `manualSorting`    | `boolean`                 | `false`  | Manual sorting control    |
| `manualFiltering`  | `boolean`                 | `false`  | Manual filtering control  |
| `state`            | `Partial<DataTableState>` | -        | External state (URL sync) |

#### Returns

| Property    | Type           | Description                  |
| ----------- | -------------- | ---------------------------- |
| `table`     | `Table<TData>` | TanStack Table instance      |
| `pageIndex` | `number`       | Current page index (0-based) |
| `pageSize`  | `number`       | Current page size            |
| `pageCount` | `number`       | Total number of pages        |
| `rowCount`  | `number`       | Total number of rows         |
| `isLoading` | `boolean`      | Loading state                |

### `DataTableFeatures`

```typescript
interface DataTableFeatures {
  enableSorting?: boolean
  enableFiltering?: boolean
  enableColumnVisibility?: boolean
  enableRowSelection?: boolean
  enableMultiRowSelection?: boolean
  enablePagination?: boolean
  enableGlobalFilter?: boolean
  enableColumnResizing?: boolean
  enableColumnPinning?: boolean
}
```

### `DataTableCallbacks<TData>`

```typescript
interface DataTableCallbacks<TData> {
  onRowClick?: (row: TData) => void
  onRowDoubleClick?: (row: TData) => void
  onSelectionChange?: (selectedRows: TData[]) => void
  onSortingChange?: (sorting: DataTableSort[]) => void
  onFilterChange?: (filters: DataTableFilters) => void
}
```

## Components

### `<DataTable>`

Root component that provides context.

```tsx
<DataTable table={table}>{children}</DataTable>
```

### `<DataTable.Table>`

Renders the table with headers and rows.

```tsx
<DataTable.Table
  skeletonRows={10}
  emptyMessage="No results"
  onRowClick={(row) => {}}
  onRowDoubleClick={(row) => {}}
  rowClassName={(row) => ''}
/>
```

### `<DataTable.Pagination>`

Renders pagination controls.

```tsx
<DataTable.Pagination pageSizeOptions={[10, 25, 50, 100]} />
```

## Best Practices

1. **Use Column Helper**: Always use `createColumnHelper<T>()` for type safety
2. **Memoize Columns**: Define columns outside component or use `useMemo`
3. **Server-Side for Large Datasets**: Use server-side pagination for 1000+ rows
4. **Enable Features Explicitly**: Only enable features you need
5. **Type Your Data**: Always provide proper TypeScript interfaces
6. **Handle Loading States**: Always pass `isLoading` prop
7. **Accessibility**: Use proper ARIA labels for actions

## Examples

See `/src/routes/_app/examples/data-table.tsx` for comprehensive examples including:

- Basic table
- Sorting
- Row selection
- Actions dropdown
- Custom cells
- Status badges

## Performance Tips

1. **Virtualization**: For 10,000+ rows, consider using `@tanstack/react-virtual`
2. **Server-Side Operations**: Use `manualPagination`, `manualSorting`, `manualFiltering`
3. **Memoization**: Memoize expensive cell renderers
4. **Lazy Loading**: Load data on-demand with pagination

## Troubleshooting

### Table not rendering

- Ensure `data` is an array (not undefined)
- Check that columns are properly defined
- Verify table instance is passed to `<DataTable>`

### Sorting not working

- Enable sorting: `features: { enableSorting: true }`
- Set `enableSorting: true` on column definition
- For server-side: use `manualSorting: true`

### Selection not working

- Enable selection: `features: { enableRowSelection: true }`
- Add selection column with checkboxes
- Use `getRowId` if your data doesn't have an `id` field

## Migration from Old Table

If migrating from an older table implementation:

1. Replace table hook with `useDataTable`
2. Update column definitions to use `createColumnHelper`
3. Enable features explicitly via `features` prop
4. Update pagination to use `<DataTable.Pagination>`
5. Remove custom sorting/filtering logic (now built-in)

## Contributing

When adding new features:

1. Update types in `data-table-types.ts`
2. Add feature flag to `DataTableFeatures`
3. Implement in `useDataTable` hook
4. Add example to example page
5. Update this README
