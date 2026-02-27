import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import type { RoleDto } from '@/features/iam/dto'
import { DataTableCard } from '@/components/card/data-table-card'

import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header'
import { Button } from '@/components/ui/button'
import { roleApi } from '@/features/iam'
import { RoleFormDialog } from '@/features/iam/components/role-form-dialog'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/settings/_tab/role')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <RoleFormDialog.Root />
      <RolesTable />
    </>
  )
}

const ch = createColumnHelper<RoleDto>()
const columns = [
  ch.accessor('name', {
    header: ({ column }) => (
      <DataGridColumnHeader title="Role" visibility={true} column={column} />
    ),
    cell: ({ row }) => row.original.name,
    enableSorting: false,
    size: 200,
  }),
  ch.accessor('code', {
    header: ({ column }) => (
      <DataGridColumnHeader title="Kode" visibility={true} column={column} />
    ),
    cell: ({ row }) => row.original.code,
    enableSorting: false,
    size: 200,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => toDateTimeStamp(row.original.createdAt),
    enableSorting: false,
  }),
  ch.display({
    id: 'action',
    header: '',
    cell: ({ row }) => {
      if (row.original.isSystem) return null
      return (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => RoleFormDialog.upsert({ id: row.original.id })}
          >
            <PencilIcon />
          </Button>
        </div>
      )
    },
    size: 60,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  }),
]

function RolesTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    roleApi.list.query({
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
      title="Daftar Role"
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={
        <Button size="sm" onClick={() => RoleFormDialog.upsert({})}>
          Tambah Role
        </Button>
      }
    />
  )
}
