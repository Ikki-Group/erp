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
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { toDateTimeStamp } from '@/lib/formatter'
import { SalesTypeFormDialog } from '@/features/product/components/sales-type-form-dialog'

export const Route = createFileRoute('/_app/products/sales-type')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        title='Jenis Penjualan'
        description='Pengaturan jenis penjualan untuk mengklasifikasikan transaksi dan pelaporan pendapatan.'
      />
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
    header: 'Kode',
    cell: ({ row }) => (
      <span className='font-medium text-xs text-muted-foreground uppercase tracking-wider'>
        {row.original.code}
      </span>
    ),
    size: 120,
    enableSorting: false,
  }),
  ch.accessor('name', {
    header: 'Jenis Penjualan',
    cell: ({ row }) => (
      <div className='flex flex-col gap-1 py-1'>
        <div className='flex items-center gap-2'>
          <span className='font-semibold text-sm tracking-tight'>
            {row.original.name}
          </span>
          {row.original.isSystem && (
            <span className='px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tighter leading-none'>
              System
            </span>
          )}
        </div>
      </div>
    ),
    size: 300,
    enableSorting: false,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => (
      <span className='text-xs text-muted-foreground font-medium'>
        {toDateTimeStamp(row.original.createdAt)}
      </span>
    ),
    size: 180,
    enableSorting: false,
  }),
  ch.display({
    id: 'action',
    header: '',
    cell: ({ row }) => {
      if (row.original.isSystem) return null
      return (
        <div className='flex items-center justify-end px-2'>
          <Button
            variant='ghost'
            size='icon-sm'
            className='size-8 text-muted-foreground hover:text-foreground'
            onClick={() => SalesTypeFormDialog.upsert({ id: row.original.id })}
          >
            <PencilIcon className='size-4' />
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
      title='Daftar Jenis Penjualan'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      toolbar={
        <DataGridFilter
          ds={ds}
          options={[{ type: 'search', placeholder: 'Cari jenis penjualan...' }]}
        />
      }
      action={
        <Button size='sm' onClick={() => SalesTypeFormDialog.upsert({})}>
          Tambah Tipe
        </Button>
      }
    />
  )
}
