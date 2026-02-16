import { DataTable } from '@/components/data-table/data-table'
import { DataTableRoot } from '@/components/data-table/data-table-root'
import { useDataTable } from '@/components/data-table/use-data-table'
import { Page } from '@/components/layout/page'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

export const Route = createFileRoute('/_app/examples/table')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ExampleTable />
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

const MOCK_USERS: User[] = Array.from({ length: 20000 }).map((_, index) => ({
  id: index.toString(),
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  role: 'Admin',
}))

function ExampleTable() {
  const table = useDataTable({
    isLoading: false,
    columns,
    data: MOCK_USERS,
    // @ts-expect-error
    state: {},
  })

  return (
    <Page>
      <Page.Content>
        <DataTableRoot table={table}>
          <DataTable />
        </DataTableRoot>
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<User>()

const columns = [
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
    cell: (info) => info.getValue(),
  }),
]
