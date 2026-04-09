import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { actionColumn, createColumnHelper, dateColumn, linkColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { MaterialCategoryDto } from '@/features/material'
import { materialCategoryApi } from '@/features/material'
import { MaterialCategoryFormDialog } from '@/features/material/components/material-category-form-dialog'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toastLabelMessage } from '@/lib/toast-message'

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

function CategoryTable() {
  const queryClient = useQueryClient()
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(materialCategoryApi.list.query({ ...ds.pagination, q: ds.search }))

  const deleteMutation = useMutation({
    mutationFn: materialCategoryApi.remove.mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialCategoryApi.list.queryKey() })
    },
  })

  const handleDelete = async (id: number) => {
    const promise = deleteMutation.mutateAsync({ params: { id } })
    await toast.promise(promise, toastLabelMessage('delete', 'kategori')).unwrap()
  }

  const columns = [
    ch.accessor(
      'name',
      linkColumn({
        header: 'Kategori',
        render: (value, row) => (
          <div className="flex flex-col gap-1 py-1">
            <span className="font-semibold text-sm tracking-tight">{value}</span>
            {row.description && (
              <span className="text-xs text-muted-foreground/80 line-clamp-1 max-w-[400px]">{row.description}</span>
            )}
          </div>
        ),
        size: 400,
        enableSorting: false,
      }),
    ),
    ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 180 })),
    actionColumn<MaterialCategoryDto>({
      id: 'action',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end px-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    void MaterialCategoryFormDialog.upsert({ id: row.original.id })
                  }}
                >
                  <PencilIcon className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => void handleDelete(row.original.id)}>
                  <Trash2Icon className="mr-2 size-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    }),
  ]

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
      recordCount={data?.meta.total ?? 0}
      toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari kategori...' }]} />}
      action={
        <Button
          size="sm"
          onClick={() => {
            void MaterialCategoryFormDialog.upsert({})
          }}
        >
          Tambah Kategori
        </Button>
      }
    />
  )
}

const ch = createColumnHelper<MaterialCategoryDto>()
