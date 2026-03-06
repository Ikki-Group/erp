import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { PencilIcon } from 'lucide-react'
import type { ProductCategoryDto } from '@/features/product'
import { productCategoryApi } from '@/features/product'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { Button } from '@/components/ui/button'
import { Page } from '@/components/layout/page'
import { toDateTimeStamp } from '@/lib/formatter'
import { ProductCategoryFormDialog } from '@/features/product/components/product-category-form-dialog'

export const Route = createFileRoute('/_app/products/category')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title='Kategori Produk' />
      <Page.Content>
        <ProductCategoryFormDialog.Root />
        <CategoryTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<ProductCategoryDto>()

const columns = [
  ch.accessor('name', {
    header: 'Kategori',
    cell: ({ row }) => row.original.name,
    enableSorting: false,
  }),
  ch.accessor('description', {
    header: 'Deskripsi',
    cell: ({ row }) => row.original.description ?? '-',
    enableSorting: false,
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
      return (
        <div className='flex items-center justify-center'>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() =>
              ProductCategoryFormDialog.upsert({ id: row.original.id })
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

function CategoryTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    productCategoryApi.list.query({
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
      title='Kategori Produk'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={
        <Button size='sm' onClick={() => ProductCategoryFormDialog.upsert({})}>
          Tambah Kategori
        </Button>
      }
    />
  )
}
