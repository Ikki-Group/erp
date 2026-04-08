import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { UomDto } from '@/features/material'
import { uomApi } from '@/features/material'
import { UomFormDialog } from '@/features/material/components/uom-form-dialog'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toDateTimeStamp } from '@/lib/formatter'

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
  ch.accessor('code', {
    header: 'Kode Satuan',
    cell: ({ row }) => (
      <div className="flex items-center py-1">
        <Badge
          variant="outline"
          className="h-6 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-foreground bg-muted/30 border-muted-foreground/30"
        >
          {row.original.code}
        </Badge>
      </div>
    ),
    size: 200,
    enableSorting: false,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground font-medium">{toDateTimeStamp(row.original.createdAt)}</span>
    ),
    size: 200,
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
            onClick={() => UomFormDialog.upsert({ id: row.original.id })}
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

function UomTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(uomApi.list.query({ ...ds.pagination, search: ds.search }))

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
      recordCount={data?.meta.total || 0}
      toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari satuan...' }]} />}
      action={
        <Button size="sm" onClick={() => UomFormDialog.upsert({})}>
          Tambah Satuan
        </Button>
      }
    />
  )
}
