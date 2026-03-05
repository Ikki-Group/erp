import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { PencilIcon } from 'lucide-react'
import type { SalesTypeDto } from '@/features/product'
import { salesTypeApi } from '@/features/product'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { Button } from '@/components/ui/button'
import { Page } from '@/components/layout/page'
import { toDateTimeStamp } from '@/lib/formatter'
import { SalesTypeFormDialog } from '@/features/product/components/sales-type-form-dialog'

export const Route = createFileRoute('/_app/products/sales-type')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title='Tipe Penjualan' />
      <Page.Content>
        <SalesTypeFormDialog.Root />
        <SalesTypeTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<SalesTypeDto>()

const columns = [
  ch.accessor('code', {
    header: 'Kode Tipe',
    cell: ({ row }) => row.original.code,
    enableSorting: false,
  }),
  ch.accessor('name', {
    header: 'Nama Tipe',
    cell: ({ row }) => row.original.name,
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
            onClick={() => SalesTypeFormDialog.upsert({ id: row.original.id })}
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

function SalesTypeTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    salesTypeApi.list.query({
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
      title='Tipe Penjualan'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={
        <Button size='sm' onClick={() => SalesTypeFormDialog.upsert({})}>
          Tambah Tipe
        </Button>
      }
    />
  )
}
