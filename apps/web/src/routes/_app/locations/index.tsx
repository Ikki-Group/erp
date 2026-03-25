import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import type { LocationDto } from '@/features/location'
import { Page } from '@/components/layout/page'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot, getActiveStatusBadge } from '@/components/common/badge-dot'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Button } from '@/components/ui/button'
import { locationApi } from '@/features/location'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/locations/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        title='Lokasi & Gudang'
        description='Kelola data lokasi dan gudang untuk penyimpanan inventory.'
      />
      <Page.Content>
        <LocationsTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<LocationDto>()
const columns = [
  ch.display({
    id: 'action',
    cell: ({ row }) => {
      return (
        <div className='flex items-center justify-center'>
          <Button
            variant='outline'
            size='icon-sm'
            render={
              <Link
                to='/locations/$id'
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
      <div className='flex gap-2 flex-col'>
        <p>{row.original.name}</p>
        <p className='text-muted-foreground text-xs italic'>
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
    cell: ({ row }) => row.original.description || '-',
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
  const ds = useDataTableState<{ isActive?: boolean }>()
  const { data, isLoading } = useQuery(
    locationApi.list.query({
      ...ds.pagination,
      search: ds.search,
      ...ds.filters,
    })
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
      title='Daftar Lokasi'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
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
        <Button
          size='sm'
          render={<Link from={Route.fullPath} to='/locations/create' />}
          nativeButton={false}
        >
          Tambah Lokasi
        </Button>
      }
    />
  )
}
