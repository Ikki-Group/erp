import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header'
import { Button } from '@/components/ui/button'
import { userApi } from '@/features/iam'
import { UserDto } from '@/features/iam/dto'
import { getUserStatusBadge } from '@/features/iam/utils'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'

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
          <p className="underline">{row.original.fullname}</p>
          <p className="text-muted-foreground italic">{row.original.email}</p>
        </div>
      </Link>
    ),
    enableSorting: false,
    size: 200,
  }),
  ch.accessor('isActive', {
    header: 'Aktif',
    cell: ({ row }) => {
      const { isActive } = row.original
      return <BadgeDot {...getUserStatusBadge(isActive)} />
    },
    enableSorting: false,
  }),
  ch.accessor('username', {
    header: 'Username',
    cell: ({ row }) => <p>@{row.original.username}</p>,
    enableSorting: false,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => (
      <p className="text-nowrap">{toDateTimeStamp(row.original.createdAt)}</p>
    ),
    enableSorting: false,
  }),
  ch.display({
    id: 'action',
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            size="icon-sm"
            render={
              <Link
                to="/settings/user/$id"
                params={{ id: String(row.original.id) }}
              />
            }
          >
            <PencilIcon />
          </Button>
        </div>
      )
    },
    size: 60,
    enablePinning: true,
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
