import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import type { LocationDto } from '@/features/location';
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot, getActiveStatusBadge } from '@/components/common/badge-dot'
import { Button } from '@/components/ui/button'
import { locationApi } from '@/features/location'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/settings/_tab/location')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LocationsTable />
}

const ch = createColumnHelper<LocationDto>()
const columns = [
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
                to="/settings/location/$id"
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
  ch.accessor('name', {
    header: 'Lokasi',
    cell: ({ row }) => (
      <div className="flex gap-2 flex-col">
        <p>{row.original.name}</p>
        <p className="text-muted-foreground text-xs italic">
          ({row.original.code})
        </p>
      </div>
    ),
    enableSorting: false,
    size: 200,
  }),
  ch.accessor('isActive', {
    header: 'Status',
    cell: ({ row }) => {
      const { isActive } = row.original
      return <BadgeDot {...getActiveStatusBadge(isActive)} />
    },
    enableSorting: false,
  }),
  ch.accessor('description', {
    header: 'Deskripsi',
    cell: ({ row }) => row.original.description ?? '-',
    enableSorting: false,
    size: 200,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => toDateTimeStamp(row.original.createdAt),
    enableSorting: false,
  }),
]

function LocationsTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    locationApi.list.query({
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
      title="Daftar Lokasi"
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={
        <Button
          size="sm"
          render={<Link from={Route.fullPath} to="/settings/location/create" />}
          nativeButton={false}
        >
          Tambah Lokasi
        </Button>
      }
    />
  )
}
