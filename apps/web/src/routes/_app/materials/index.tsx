import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { MapPinIcon, PencilIcon, PlusIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
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
      <Page.BlockHeader title='Bahan Baku' />
      <Page.Content>
        <MaterialTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<MaterialSelectDto>()

/**
 * Render the materials management table with filtering, selection, and location-assignment controls.
 *
 * Renders a pageable, selectable data table of materials with columns for SKU, name, category, type,
 * unit, locations, and actions. Includes toolbar filters (search, type, category, location), row and
 * page selection, per-row and bulk "assign to location" actions, and controls to create or edit materials.
 *
 * @returns A React element containing the materials table, its filters, action buttons, and the assignment dialog root.
 */
function MaterialTable() {
  const ds = useDataTableState<MaterialFilterDto>()
  const [rowSelection, setRowSelection] = useState({})

  const { data: categories } = useQuery(
    materialCategoryApi.list.query({ limit: 100 })
  )
  const { data: locations } = useQuery(locationApi.list.query({ limit: 100 }))

  const { data, isLoading } = useQuery(
    materialApi.list.query({
      ...ds.pagination,
      ...ds.filters,
      search: ds.search,
    })
  )

  const columns = useMemo(
    () => [
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
          <Badge
            variant='outline'
            className='bg-muted/50 rounded-sm font-normal'
          >
            {row.original.category?.name ?? 'Tanpa Kategori'}
          </Badge>
        ),
        size: 150,
      }),
      ch.accessor('type', {
        header: 'Jenis',
        cell: ({ row }) => (
          <BadgeDot {...MaterialBadgeProps[row.original.type]} />
        ),
        size: 100,
      }),
      ch.accessor('uom.code', {
        header: 'Satuan',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <span className='text-sm capitalize'>
              {row.original.uom?.code ?? '-'}
            </span>
          </div>
        ),
        size: 100,
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
                  className={cn(
                    'text-nowrap',
                    count > 0 ? 'text-sm' : 'text-sm text-muted-foreground'
                  )}
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
                    materialIds: [row.original.id],
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
    ],
    []
  )

  const emptyData = useMemo(() => [], [])

  const table = useDataTable({
    columns: columns,
    data: data?.data ?? emptyData,
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
                <MapPinIcon className='mr-2 size-4' />
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
      <MaterialAssignToLocationDialog.Root />
    </>
  )
}
