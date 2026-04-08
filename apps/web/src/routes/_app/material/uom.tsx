import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { PencilIcon } from 'lucide-react'

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
import type { UomDto } from '@/features/material'
import { uomApi } from '@/features/material'
import { UomFormDialog } from '@/features/material/components/uom-form-dialog'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

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

const ch = createColumnHelper<UomDto>()

const columns = [
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
  ch.display(
    actionColumn<UomDto>({
      id: 'action',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end px-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={() => { void UomFormDialog.upsert({ id: row.original.id }) }}
            >
              <PencilIcon className="size-4" />
            </Button>
          </div>
        )
      },
    }),
  ),
]

function UomTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(uomApi.list.query({ ...ds.pagination, q: ds.search }))

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
        <Button size="sm" onClick={() => { void UomFormDialog.upsert({}) }}>
          Tambah Satuan
        </Button>
      }
    />
  )
}
