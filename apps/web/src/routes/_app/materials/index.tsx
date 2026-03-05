import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { MapPinIcon, PackageIcon, PencilIcon, PlusIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { MaterialSelectDto } from '@/features/material'
import {
  MaterialAssignToLocationDialog,
  MaterialBadgeProps,
  materialApi,
} from '@/features/material'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'
import { Badge } from '@/components/ui/badge'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

export const Route = createFileRoute('/_app/materials/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title='Bahan Baku' />
      <Page.Content>
        <MaterialTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<MaterialSelectDto>()

const columns = [
  ch.accessor('sku', {
    header: 'SKU',
    cell: ({ row }) => (
      <span className='font-mono text-xs font-semibold'>
        {row.original.sku}
      </span>
    ),
    size: 120,
  }),
  ch.accessor('name', {
    header: 'Bahan Baku',
    cell: ({ row }) => (
      <div className='flex flex-col gap-1'>
        <span className='font-medium'>{row.original.name}</span>
        {row.original.description && (
          <span className='text-xs text-muted-foreground line-clamp-1'>
            {row.original.description}
          </span>
        )}
      </div>
    ),
    size: 250,
  }),
  ch.accessor('category.name', {
    header: 'Kategori',
    cell: ({ row }) => (
      <Badge variant='outline' className='bg-muted/50 rounded-sm font-normal'>
        {row.original.category?.name ?? 'Tanpa Kategori'}
      </Badge>
    ),
    size: 150,
  }),
  ch.accessor('type', {
    header: 'Jenis',
    cell: ({ row }) => <BadgeDot {...MaterialBadgeProps[row.original.type]} />,
    size: 150,
  }),
  ch.accessor('uom.code', {
    header: 'Satuan',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <PackageIcon className='size-3.5 text-muted-foreground' />
        <span className='text-sm capitalize'>
          {row.original.uom?.code ?? '-'}
        </span>
      </div>
    ),
    size: 120,
  }),

  ch.accessor('locationIds', {
    header: 'Lokasi',
    cell: ({ row }) => {
      const count = row.original.locationIds.length
      return (
        <div className='flex items-center justify-between gap-2 group'>
          <div className='flex items-center gap-2'>
            <MapPinIcon className='size-3.5 text-muted-foreground' />
            <span
              className={
                count > 0 ? 'text-sm' : 'text-sm text-muted-foreground'
              }
            >
              {count} Lokasi
            </span>
          </div>
          <Button
            size='icon'
            variant='ghost'
            className='size-7 opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={() =>
              MaterialAssignToLocationDialog.call({
                materialId: row.original.id,
                materialName: row.original.name,
              })
            }
          >
            <PlusIcon className='size-3.5' />
          </Button>
        </div>
      )
    },
    size: 120,
  }),
  ch.display({
    id: 'action',
    header: '',
    cell: ({ row }) => {
      return (
        <div className='flex items-center justify-center'>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            nativeButton={false}
            render={
              <Link
                from={Route.fullPath}
                to='/materials/$id'
                params={{ id: String(row.original.id) }}
              />
            }
          >
            <PencilIcon className='size-4' />
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

function MaterialTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    materialApi.list.query({
      ...ds.pagination,
      search: ds.search,
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
    <>
      <DataTableCard
        title='Daftar Bahan Baku'
        table={table}
        isLoading={isLoading}
        recordCount={data?.meta.total || 0}
        toolbar={
          <DataGridFilter
            ds={ds}
            options={[{ type: 'search', placeholder: 'Cari bahan baku...' }]}
          />
        }
        action={
          <Button
            size='sm'
            nativeButton={false}
            render={<Link from={Route.fullPath} to='/materials/create' />}
          >
            Tambah Bahan Baku
          </Button>
        }
      />
      <MaterialAssignToLocationDialog.Root />
    </>
  )
}
