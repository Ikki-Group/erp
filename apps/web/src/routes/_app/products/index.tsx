import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon, PlusIcon } from 'lucide-react'

import { productApi } from '@/features/product'
import type { ProductSelectDto } from '@/features/product'

import { DataTableCard } from '@/components/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'

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
    cell: ({ row }) => row.original.sku,
    size: 120,
  }),
  ch.accessor('name', {
    header: 'Nama Produk',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        <span className='text-xs text-muted-foreground'>
          {row.original.category?.name ?? 'Tanpa Kategori'}
        </span>
      </div>
    ),
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
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.variants.length} Varian</span>
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

function ProductTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    productApi.list.query({
      ...ds.pagination,
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
      action={
        <Button size='sm' render={<Link to='/products/create' />}>
          <PlusIcon className='mr-2 size-4' />
          Tambah Produk
        </Button>
      }
    />
  )
}
