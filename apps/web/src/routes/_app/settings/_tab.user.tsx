import { DataTableCard } from '@/components/card/data-table-card'
import { Badge } from '@/components/reui/badge'
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
  ch.accessor('fullname', {
    header: ({ column }) => (
      <DataGridColumnHeader title="Nama" visibility={true} column={column} />
    ),
    cell: ({ row }) => (
      <Link to="/settings/user/$id" params={{ id: String(row.original.id) }}>
        <div>
          <p>{row.original.fullname}</p>
          <p className="text-muted-foreground">{row.original.email}</p>
        </div>
      </Link>
    ),
    enableSorting: false,
    size: 200,
  }),
  ch.accessor('isActive', {
    header: 'Aktif',
    cell: (info) => {
      const { isActive } = info.row.original
      return (
        <Badge variant={isActive ? 'success' : 'destructive-outline'}>
          {isActive ? 'Aktif' : 'Tidak Aktif'}
        </Badge>
      )
    },
    enableSorting: false,
  }),
  ch.accessor('username', {
    header: 'Username',
    cell: (info) => <p>@{info.row.original.username}</p>,
    enableSorting: false,
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
      title="Daftar Pengguna"
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
