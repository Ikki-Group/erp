import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { PencilIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import {
  actionColumn,
  createColumnHelper,
  dateColumn,
  textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Button } from '@/components/ui/button'
import type { ProductCategoryDto } from '@/features/product'
import { productCategoryApi } from '@/features/product'
import { ProductCategoryFormDialog } from '@/features/product/components/product-category-form-dialog'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

export const Route = createFileRoute('/_app/product/category')({ component: RouteComponent })

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        title="Kategori Produk"
        description="Kelola kategori produk untuk memudahkan pengorganisasian dan pencarian item menu."
      />
      <Page.Content>
        <ProductCategoryFormDialog.Root />
        <CategoryTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<ProductCategoryDto>()

const columns = [
  ch.accessor('name', textColumn({ header: 'Kategori', size: 250 })),
  ch.accessor('description', textColumn({ header: 'Deskripsi', size: 400 })),
  ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 180 })),
  ch.display(
    actionColumn<ProductCategoryDto>({
      id: 'action',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end px-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={() => { void ProductCategoryFormDialog.upsert({ id: row.original.id }) }}
            >
              <PencilIcon className="size-4" />
            </Button>
          </div>
        )
      },
    }),
  ),
]

function CategoryTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(productCategoryApi.list.query({ ...ds.pagination, search: ds.search }))

  const table = useDataTable({
    columns: columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      title="Daftar Kategori Produk"
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total ?? 0}
      toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari kategori...' }]} />}
      action={
        <Button size="sm" onClick={() => { void ProductCategoryFormDialog.upsert({}) }}>
          Tambah Kategori
        </Button>
      }
    />
  )
}
