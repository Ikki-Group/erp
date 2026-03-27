import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'

import { DataTableCard } from '@/components/card/data-table-card'
import { Page } from '@/components/layout/page'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Button } from '@/components/ui/button'
import type { MaterialCategoryDto } from '@/features/material'
import { materialCategoryApi } from '@/features/material'
import { MaterialCategoryFormDialog } from '@/features/material/components/material-category-form-dialog'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/material/category')({ component: RouteComponent })

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        title="Kategori Bahan Baku"
        description="Pengaturan kategori bahan baku untuk pengorganisasian inventaris dan klasifikasi produk yang lebih baik."
      />
      <Page.Content>
        <MaterialCategoryFormDialog.Root />
        <CategoryTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<MaterialCategoryDto>()

const columns = [
  ch.accessor('name', {
    header: 'Kategori',
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 py-1">
        <span className="font-semibold text-sm tracking-tight">{row.original.name}</span>
        {row.original.description && (
          <span className="text-xs text-muted-foreground/80 line-clamp-1 max-w-[400px]">
            {row.original.description}
          </span>
        )}
      </div>
    ),
    size: 400,
    enableSorting: false,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground font-medium">{toDateTimeStamp(row.original.createdAt)}</span>
    ),
    size: 180,
    enableSorting: false,
  }),
  ch.display({
    id: 'action',
    header: '',
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-end px-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => MaterialCategoryFormDialog.upsert({ id: row.original.id })}
          >
            <PencilIcon className="size-4" />
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
  const { data, isLoading } = useQuery(materialCategoryApi.list.query({ ...ds.pagination, search: ds.search }))

  const table = useDataTable({
    columns: columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      title="Daftar Kategori"
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari kategori...' }]} />}
      action={
        <Button size="sm" onClick={() => MaterialCategoryFormDialog.upsert({})}>
          Tambah Kategori
        </Button>
      }
    />
  )
}
