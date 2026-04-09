import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import {
  actionColumn,
  createColumnHelper,
  dateColumn,
  statusColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { UomDto } from '@/features/material'
import { uomApi } from '@/features/material'
import { UomFormDialog } from '@/features/material/components/uom-form-dialog'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toastLabelMessage } from '@/lib/toast-message'

const ch = createColumnHelper<UomDto>()

export const Route = createFileRoute('/_app/material/uom')({ component: RouteComponent })

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        title="Satuan Bahan Baku"
        description="Kelola Satuan (UOM) untuk bahan baku. Satuan ini akan digunakan dalam inventaris, resep, dan transaksi stok."
      />
      <Page.Content>
        <UomFormDialog.Root />
        <UomTable />
      </Page.Content>
    </Page>
  )
}


function getColumns(handleDelete: (id: number) => Promise<void>): ColumnDef<UomDto, any>[] {
  return [
    ch.accessor(
      'code',
      statusColumn({
        header: 'Kode Satuan',
        render: (value) => (
          <div className="flex items-center py-1">
            <Badge
              variant="outline"
              className="h-6 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-foreground bg-muted/30 border-muted-foreground/30"
            >
              {value}
            </Badge>
          </div>
        ),
        size: 200,
        enableSorting: false,
      }),
    ),
    ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 200 })),
    ch.display({
      id: 'action',
      cell: ({ row }: CellContext<UomDto, any>) => {
        return (
          <div className="flex items-center justify-end px-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    void UomFormDialog.upsert({ id: row.original.id })
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
      size: 100,
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
    } as any),
  ]
}

function UomTable() {
  const queryClient = useQueryClient()
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(uomApi.list.query({ ...ds.pagination, q: ds.search }))

  const deleteMutation = useMutation({
    mutationFn: uomApi.remove.mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [uomApi.list.queryKey(undefined)[0]] })
    },
  })

  const handleDelete = async (id: number) => {
    const promise = deleteMutation.mutateAsync({ params: { id } })
    await toast.promise(promise, toastLabelMessage('delete', 'satuan')).unwrap()
  }

  const columns = useMemo(() => getColumns(handleDelete), [handleDelete])

  const table = useDataTable({
    columns: columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      title="Daftar Satuan"
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total ?? 0}
      toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari satuan...' }]} />}
      action={
        <Button
          size="sm"
          onClick={() => {
            void UomFormDialog.upsert({})
          }}
        >
          Tambah Satuan
        </Button>
      }
    />
  )
}

