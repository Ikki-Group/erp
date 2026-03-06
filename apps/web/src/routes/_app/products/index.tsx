import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon, PlusIcon } from 'lucide-react'

import type { ProductFilterDto, ProductSelectDto } from '@/features/product'
import { productApi, productCategoryApi } from '@/features/product'
import { locationApi } from '@/features/location'

import { DataTableCard } from '@/components/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toCurrency, toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/products/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title='Daftar Produk' />
      <Page.Content>
        <ProductTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<ProductSelectDto>()

const columns = [
  ch.accessor('sku', {
    header: 'SKU',
    cell: ({ row }) => <p className='font-mono text-sm'>{row.original.sku}</p>,
    minSize: 140,
  }),
  ch.accessor('name', {
    header: 'Nama Produk',
    cell: ({ row }) => (
      <div className='flex flex-col gap-0.5'>
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{row.original.name}</span>
          {row.original.externalMappings.some(m => m.provider === 'moka') && (
            <Badge
              variant='outline'
              className='h-4 px-1 text-[10px] bg-orange-50 text-orange-600 border-orange-200'
            >
              MOKA
            </Badge>
          )}
        </div>
        <span className='text-xs text-muted-foreground'>
          {row.original.category?.name ?? 'Tanpa Kategori'}
        </span>
      </div>
    ),
    minSize: 300,
  }),
  ch.accessor('basePrice', {
    header: 'Harga',
    cell: ({ row }) => toCurrency(row.original.basePrice),
    size: 100,
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge
          variant={
            status === 'active'
              ? 'default'
              : status === 'inactive'
                ? 'secondary'
                : 'destructive'
          }
        >
          {status.toUpperCase()}
        </Badge>
      )
    },
    size: 100,
  }),
  ch.accessor('variants', {
    header: 'Varian',
    cell: ({ row }) =>
      row.original.hasVariants ? (
        <span className='text-sm'>{row.original.variants.length} Varian</span>
      ) : (
        <span className='text-xs text-muted-foreground'>-</span>
      ),
    size: 100,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => toDateTimeStamp(row.original.createdAt),
    size: 160,
  }),
  ch.display({
    id: 'action',
    header: '',
    cell: ({ row }) => {
      return (
        <div className='flex items-center justify-center'>
          <Button
            variant='ghost'
            size='icon-sm'
            render={
              <Link
                to='/products/$id'
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
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  }),
]

/**
 * Renders the product listing page with a searchable, filterable data table and actions.
 *
 * The table shows SKU, name, price, status, variant count, creation date, and edit actions.
 * The toolbar provides search plus filters for status, external type, category, and location.
 * Includes an action button to navigate to the product creation page.
 *
 * @returns The rendered product table page as a JSX element.
 */
function ProductTable() {
  const ds = useDataTableState<ProductFilterDto>()

  const { data: categories } = useQuery(
    productCategoryApi.list.query({ limit: 100 })
  )
  const { data: locations } = useQuery(locationApi.list.query({ limit: 100 }))

  const { data, isLoading } = useQuery(
    productApi.list.query({
      ...ds.pagination,
      ...ds.filters,
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
    <DataTableCard
      title='Daftar Produk'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      toolbar={
        <DataGridFilter
          ds={ds}
          options={[
            { type: 'search', placeholder: 'Cari produk...' },
            {
              type: 'select',
              key: 'status',
              placeholder: 'Semua Status',
              options: [
                { label: 'Aktif', value: 'active' },
                { label: 'Non-Aktif', value: 'inactive' },
                { label: 'Arsip', value: 'archived' },
              ],
            },
            {
              type: 'select',
              key: 'isExternal',
              placeholder: 'Semua Tipe',
              options: [
                { label: 'Internal Only', value: 'false' },
                { label: 'Moka/External Only', value: 'true' },
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
              key: 'locationId',
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
        <Button size='sm' render={<Link to='/products/create' />}>
          <PlusIcon className='mr-2 size-4' />
          Tambah Produk
        </Button>
      }
    />
  )
}
