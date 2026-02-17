import { DataTable } from '@/components/data-table/data-table'
import { useDataTable } from '@/components/data-table/use-data-table'
import { Page } from '@/components/layout/page'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { MoreHorizontalIcon, Trash2Icon, Edit2Icon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/_app/examples/data-table')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.Header>
        <Page.Title>Data Table Examples</Page.Title>
        <Page.Description>
          Comprehensive examples of data table features and use cases
        </Page.Description>
      </Page.Header>

      <Page.Content className="space-y-8">
        <BasicExample />
        <SortingExample />
        <SelectionExample />
      </Page.Content>
    </Page>
  )
}

// ============================================================================
// Types & Mock Data
// ============================================================================

interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'User' | 'Guest'
  status: 'Active' | 'Inactive' | 'Pending'
  createdAt: Date
}

const MOCK_USERS: User[] = Array.from({ length: 100 }).map((_, index) => ({
  id: `user-${index + 1}`,
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  role: (['Admin', 'User', 'Guest'] as const)[index % 3],
  status: (['Active', 'Inactive', 'Pending'] as const)[index % 3],
  createdAt: new Date(2024, 0, (index % 28) + 1),
}))

// ============================================================================
// Example 1: Basic Table
// ============================================================================

function BasicExample() {
  const table = useDataTable({
    data: MOCK_USERS,
    columns: basicColumns,
  })

  return (
    <Card>
      <Card.Header>
        <Card.Title>Basic Table</Card.Title>
        <Card.Description>Simple data table with pagination</Card.Description>
      </Card.Header>
      <DataTable table={table}>
        <DataTable.Table />
        <Card.Footer>
          <DataTable.Pagination />
        </Card.Footer>
      </DataTable>
    </Card>
  )
}

const ch = createColumnHelper<User>()

const basicColumns = [
  ch.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  ch.accessor('email', {
    header: 'Email',
    cell: (info) => info.getValue(),
  }),
  ch.accessor('role', {
    header: 'Role',
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
]

// ============================================================================
// Example 2: Sorting
// ============================================================================

function SortingExample() {
  const table = useDataTable({
    data: MOCK_USERS,
    columns: sortingColumns,
    features: {
      enableSorting: true,
    },
    callbacks: {
      onSortingChange: (sorting) => {
        console.log('Sorting changed:', sorting)
      },
    },
  })

  return (
    <Card>
      <Card.Header>
        <Card.Title>Sorting</Card.Title>
        <Card.Description>
          Click column headers to sort. Multi-column sorting supported.
        </Card.Description>
      </Card.Header>
      <DataTable table={table}>
        <DataTable.Table />
        <Card.Footer>
          <DataTable.Pagination />
        </Card.Footer>
      </DataTable>
    </Card>
  )
}

const sortingColumns = [
  ch.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  ch.accessor('email', {
    header: 'Email',
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  ch.accessor('role', {
    header: 'Role',
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
    enableSorting: true,
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      const variant =
        status === 'Active'
          ? 'default'
          : status === 'Inactive'
            ? 'destructive'
            : 'secondary'
      return <Badge variant={variant}>{status}</Badge>
    },
    enableSorting: true,
  }),
  ch.accessor('createdAt', {
    header: 'Created',
    cell: (info) => info.getValue().toLocaleDateString(),
    enableSorting: true,
  }),
]

// ============================================================================
// Example 3: Row Selection
// ============================================================================

function SelectionExample() {
  const table = useDataTable({
    data: MOCK_USERS,
    columns: selectionColumns,
    features: {
      enableSorting: true,
      enableRowSelection: true,
      enableMultiRowSelection: true,
    },
    callbacks: {
      onSelectionChange: (selectedRows) => {
        console.log('Selected rows:', selectedRows)
      },
    },
  })

  const selectedCount = Object.keys(table.table.getState().rowSelection).filter(
    (key) => table.table.getState().rowSelection[key],
  ).length

  return (
    <Card>
      <Card.Header>
        <Card.Title>Row Selection</Card.Title>
        <Card.Description>
          Select rows using checkboxes. {selectedCount} row(s) selected.
        </Card.Description>
      </Card.Header>
      <DataTable table={table}>
        <DataTable.Table />
        <Card.Footer>
          <DataTable.Pagination />
        </Card.Footer>
      </DataTable>
    </Card>
  )
}

const selectionColumns = [
  ch.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    size: 40,
  }),
  ch.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <div>
        <div className="font-medium">{info.getValue()}</div>
        <div className="text-sm text-muted-foreground">
          {info.row.original.email}
        </div>
      </div>
    ),
  }),
  ch.accessor('role', {
    header: 'Role',
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      const variant =
        status === 'Active'
          ? 'default'
          : status === 'Inactive'
            ? 'destructive'
            : 'secondary'
      return <Badge variant={variant}>{status}</Badge>
    },
  }),
  ch.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-8 w-8">
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.id)}
          >
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Edit2Icon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 60,
  }),
]
