import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { PencilIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot, getActiveStatusBadge } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import {
  actionColumn,
  createColumnHelper,
  dateColumn,
  statusColumn,
  textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Button } from '@/components/ui/button'
import type { LocationDto } from '@/features/location'
import { locationApi } from '@/features/location'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

export const Route = createFileRoute('/_app/location/')({ component: RouteComponent })

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        title="Lokasi & Gudang"
        description="Kelola data lokasi dan gudang untuk penyimpanan inventory."
      />
      <Page.Content>
        <LocationsTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<LocationDto>()
const columns = [
  ch.accessor('name', {
    header: 'Lokasi',
    size: 250,
    cell: ({ row }) => {
      const { name, code } = row.original
      return (
        <div className="flex gap-2 flex-col">
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">{code}</p>
        </div>
      )
    },
  }),
  ch.accessor(
    'isActive',
    statusColumn({
      header: 'Status',
      render: (value) => <BadgeDot {...getActiveStatusBadge(Boolean(value))} />,
      size: 130,
    }),
  ),
  ch.accessor('description', textColumn({ header: 'Deskripsi', size: 250 })),
  ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 160 })),
  ch.display(
    actionColumn<LocationDto>({
      id: 'action',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end px-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 text-muted-foreground hover:text-foreground"
              render={<Link to="/location/$id" params={{ id: String(row.original.id) }} />}
            >
              <PencilIcon className="size-4" />
            </Button>
          </div>
        )
      },
      enablePinning: true,
    }),
  ),
]

function LocationsTable() {
  const ds = useDataTableState<{ isActive?: boolean }>()
  const { data, isLoading } = useQuery(locationApi.list.query({ ...ds.pagination, q: ds.search, ...ds.filters }))

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
      recordCount={data?.meta.total ?? 0}
      toolbar={
        <DataGridFilter
          ds={ds}
          options={[
            { type: 'search', placeholder: 'Cari lokasi (nama, kode)...' },
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
        <Button size="sm" render={<Link from={Route.fullPath} to="/location/create" />} nativeButton={false}>
          Tambah Lokasi
        </Button>
      }
    />
  )
}
