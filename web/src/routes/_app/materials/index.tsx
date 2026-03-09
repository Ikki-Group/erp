import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import {
  ChefHatIcon,
  EyeIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
} from 'lucide-react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { MaterialFilterDto, MaterialSelectDto } from '@/features/material'

import {
  MaterialAssignToLocationDialog,
  MaterialBadgeProps,
  materialApi,
} from '@/features/material'
import { materialCategoryApi } from '@/features/material/api/material-category.api'
import { locationApi } from '@/features/location'

import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/materials/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        title='Bahan Baku'
        description='Kelola daftar bahan mentah dan bahan setengah jadi untuk proses produksi, pengaturan satuan (UOM), serta penempatan lokasi penyimpanan.'
      />
      <Page.Content>
        <MaterialTable />
      </Page.Content>
    </Page>
  )
}

function MaterialTable() {
  const ds = useDataTableState<MaterialFilterDto>()
  const [rowSelection, setRowSelection] = useState({})

  const { data: categories } = useSuspenseQuery(
    materialCategoryApi.list.query({ limit: 100 })
  )

  const { data: locations } = useSuspenseQuery(
    locationApi.list.query({ limit: 100 })
  )

  const { data, isLoading } = useQuery(
    materialApi.list.query({
      ...ds.pagination,
      ...ds.filters,
      search: ds.search,
    })
  )

  const columns = useMemo(getColumns, [])
  const table = useDataTable({
    columns: columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getRowId: row => String(row.id),
  })

  const selectedRows = isLoading
    ? []
    : table.getFilteredSelectedRowModel().flatRows
  const selectedIds = selectedRows.map(row => row.original.id)

  return (
    <>
      <MaterialAssignToLocationDialog.Root />
      <DataTableCard
        title='Daftar Bahan Baku'
        table={table}
        isLoading={isLoading}
        recordCount={data?.meta.total || 0}
        toolbar={
          <DataGridFilter
            ds={ds}
            options={[
              { type: 'search', placeholder: 'Cari bahan baku...' },
              {
                type: 'select',
                key: 'type',
                placeholder: 'Semua Jenis',
                options: [
                  { label: 'Raw', value: 'raw' },
                  { label: 'Semi', value: 'semi' },
                ],
              },
              {
                type: 'select',
                key: 'categoryId',
                placeholder: 'Semua Kategori',
                options:
                  categories?.data.map(c => ({
                    label: c.name,
                    value: c.id,
                  })) ?? [],
              },
              {
                type: 'select',
                key: 'locationIds',
                placeholder: 'Semua Lokasi',
                options:
                  locations?.data.map(l => ({
                    label: l.name,
                    value: l.id,
                  })) ?? [],
              },
            ]}
          />
        }
        action={
          <div className='flex items-center gap-2'>
            {selectedIds.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  MaterialAssignToLocationDialog.call({
                    materialIds: selectedIds,
                    materialName: `${selectedIds.length} Bahan Baku`,
                  })
                }
              >
                <MapPinIcon />
                Assign {selectedIds.length} Lokasi
              </Button>
            )}
            <Button
              size='sm'
              nativeButton={false}
              render={<Link from={Route.fullPath} to='/materials/create' />}
            >
              Tambah Bahan Baku
            </Button>
          </div>
        }
      />
    </>
  )
}

const ch = createColumnHelper<MaterialSelectDto>()
function getColumns() {
  return [
    ch.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    }),
    ch.accessor('name', {
      header: 'Bahan Baku',
      cell: ({ row }) => (
        <div className='flex flex-col gap-1.5 py-1'>
          <div className='flex items-center gap-2'>
            <Link
              from={Route.fullPath}
              to='/materials/$id'
              params={{ id: String(row.original.id) }}
              className='font-semibold text-sm tracking-tight hover:text-primary hover:underline'
            >
              {row.original.name}
            </Link>
            <span className='font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 font-medium'>
              {row.original.sku}
            </span>
          </div>
          {row.original.description && (
            <span className='text-xs text-muted-foreground/80 line-clamp-1 max-w-[300px]'>
              {row.original.description}
            </span>
          )}
        </div>
      ),
      size: 350,
    }),
    ch.accessor('category.name', {
      header: 'Kategori',
      cell: ({ row }) => (
        <Badge
          variant='secondary'
          className='bg-secondary/40 text-secondary-foreground rounded-md px-2 py-0 border-none font-medium text-[11px]'
        >
          {row.original.category?.name ?? 'Uncategorized'}
        </Badge>
      ),
      size: 140,
    }),
    ch.accessor('type', {
      header: 'Jenis',
      cell: ({ row }) => (
        <BadgeDot {...MaterialBadgeProps[row.original.type]} />
      ),
      size: 160,
    }),
    ch.accessor('uom.code', {
      header: 'Satuan',
      cell: ({ row }) => (
        <div className='flex items-center'>
          <Badge
            variant='outline'
            className='h-5 rounded-full px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 border-muted-foreground/20'
          >
            {row.original.uom?.code ?? '-'}
          </Badge>
        </div>
      ),
      size: 90,
    }),
    ch.accessor('locationIds', {
      header: 'Lokasi',
      cell: ({ row }) => {
        const count = row.original.locationIds.length
        return (
          <Button
            variant='ghost'
            size='sm'
            className='gap-2 -ml-2'
            onClick={() =>
              MaterialAssignToLocationDialog.call({
                materialIds: [row.original.id],
                materialName: row.original.name,
              })
            }
          >
            <MapPinIcon className='size-3.5 text-muted-foreground' />
            <span
              className={cn(
                'text-nowrap',
                count > 0 ? 'text-sm' : 'text-sm text-muted-foreground'
              )}
            >
              {count} Lokasi
            </span>
            <PlusIcon className='size-3 text-muted-foreground/50' />
          </Button>
        )
      },
      size: 120,
    }),
    ch.display({
      id: 'action',
      header: '',
      cell: ({ row }) => {
        return (
          <div className='flex items-center justify-end gap-1 px-2'>
            {row.original.type === 'semi' && (
              <Button
                variant='ghost'
                size='icon-sm'
                className='size-8 text-primary/70 hover:text-primary hover:bg-primary/10'
                title='Kelola Resep'
                nativeButton={false}
                render={
                  <Link
                    from={Route.fullPath}
                    to='/materials/$id/recipe'
                    params={{ id: String(row.original.id) }}
                  />
                }
              >
                <ChefHatIcon className='size-4' />
              </Button>
            )}
            <Button
              variant='ghost'
              size='icon-sm'
              className='size-8 text-muted-foreground hover:text-foreground'
              title='Lihat Detail'
              nativeButton={false}
              render={
                <Link
                  from={Route.fullPath}
                  to='/materials/$id'
                  params={{ id: String(row.original.id) }}
                />
              }
            >
              <EyeIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              className='size-8 text-muted-foreground hover:text-foreground'
              title='Edit Bahan Baku'
              nativeButton={false}
              render={
                <Link
                  from={Route.fullPath}
                  to='/materials/$id/update'
                  params={{ id: String(row.original.id) }}
                />
              }
            >
              <PencilIcon className='size-4' />
            </Button>
          </div>
        )
      },
      size: 140,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
    }),
  ]
}
