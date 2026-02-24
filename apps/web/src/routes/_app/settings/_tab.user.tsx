import { DataTableCard } from '@/components/card/data-table-card'
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header'
import { Button } from '@/components/ui/button'
import { userApi } from '@/features/iam'
import { UserDto } from '@/features/iam/dto'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

export const Route = createFileRoute('/_app/settings/_tab/user')({
  component: RouteComponent,
})

function RouteComponent() {
  return <UserTable />
}

const ch = createColumnHelper<UserDto>()
const columns = [
  ch.accessor('username', {
    header: ({ column }) => (
      <DataGridColumnHeader
        title="Nama Role"
        visibility={true}
        column={column}
      />
    ),
    cell: (info) => (
      <div className="flex gap-1 flex-col">
        <p>{info.row.original.fullname}</p>
        <p className="text-muted-foreground text-xs italic">
          ({info.row.original.username})
        </p>
      </div>
    ),
    enableSorting: false,
    size: 200,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
  ch.accessor('updatedAt', {
    header: 'Diubah Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
]

function UserTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    userApi.list.query({
      ...ds.pagination,
    }),
  )

  const table = useDataTable({
    columns: columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={
        <Button
          size="sm"
          nativeButton={false}
          render={<Link to="/settings/user/create" from={Route.fullPath} />}
        >
          Tambah Pengguna
        </Button>
      }
    />
  )
}
