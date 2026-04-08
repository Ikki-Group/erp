import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KeyRoundIcon, PencilIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import {
  actionColumn,
  createColumnHelper,
  dateColumn,
  linkColumn,
  statusColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Button } from '@/components/ui/button'
import type { UserSelectDto } from '@/features/iam'
import { userApi } from '@/features/iam'
import { UserPasswordDialog } from '@/features/iam/components/user-password-dialog'
import { getUserStatusBadge } from '@/features/iam/utils'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

export const Route = createFileRoute('/_app/settings/_tab/user')({ component: RouteComponent })

function RouteComponent() {
  return (
    <>
      <UserPasswordDialog.Root />
      <UserTable />
    </>
  )
}

const ch = createColumnHelper<UserSelectDto>()
const columns = [
  ch.accessor(
    'fullname',
    linkColumn({
      header: 'Nama',
      render: (value, row) => (
        <Link to="/settings/user/$id" params={{ id: String(row.id) }}>
          <div className="flex flex-col gap-1 py-0.5">
            <span className="font-semibold text-sm tracking-tight hover:text-primary hover:underline">{value}</span>
            <span className="text-muted-foreground italic text-xs">{row.email}</span>
          </div>
        </Link>
      ),
      size: 200,
      enableSorting: false,
    }),
  ),
  ch.accessor(
    'isActive',
    statusColumn({
      header: 'Aktif',
      render: (value) => <BadgeDot {...getUserStatusBadge(value)} />,
    }),
  ),
  ch.accessor('username', {
    header: 'Username',
    cell: ({ row }) => <span className="text-muted-foreground/80">@{row.original.username}</span>,
    enableSorting: false,
  }),
  ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada' })),
  ch.display(
    actionColumn<UserSelectDto>({
      id: 'action',
      cell: ({ row }) => {
        const { id, username } = row.original
        return (
          <div className="flex items-center justify-end gap-1 px-2">
            <Button
              variant="ghost"
              size="icon-sm"
              // oxlint-disable-next-line typescript/no-misused-promises
              onClick={() => { void UserPasswordDialog.call({ id, username }) }}
              title="Ubah Password"
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <KeyRoundIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={<Link to="/settings/user/$id" params={{ id: String(id) }} />}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <PencilIcon className="size-4" />
            </Button>
          </div>
        )
      },
      size: 100,
    }),
  ),
]

function UserTable() {
  const ds = useDataTableState<{ isActive?: boolean }>()
  const { data, isLoading } = useQuery(userApi.list.query({ ...ds.pagination, ...ds.filters }))

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
      recordCount={data?.meta.total ?? 0}
      toolbar={
        <DataGridFilter
          ds={ds}
          options={[
            { type: 'search', placeholder: 'Cari user (nama, email, username)...' },
            {
              type: 'select',
              key: 'isActive',
              placeholder: 'Status',
              options: [
                { label: 'Semua', value: '' },
                { label: 'Aktif', value: 'true' },
                { label: 'Non-Aktif', value: 'false' },
              ],
            },
          ]}
        />
      }
      action={
        <Button size="sm" nativeButton={false} render={<Link to="/settings/user/create" from={Route.fullPath} />}>
          Tambah Pengguna
        </Button>
      }
    />
  )
}
