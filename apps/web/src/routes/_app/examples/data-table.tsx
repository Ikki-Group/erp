import { DataTable } from '@/components/data-table/data-table'
import { useDataTableAuto, useDataTableState } from '@/components/data-table'
import { Page } from '@/components/layout/page'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

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
  const ds = useDataTableState()
  const table = useDataTableAuto({
    data: MOCK_USERS,
    columns: basicColumns,
    ds,
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
