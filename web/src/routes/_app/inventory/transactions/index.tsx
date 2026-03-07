import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { StockTransactionSelectDto } from '@/features/inventory'
import { stockTransactionApi } from '@/features/inventory'
import { Page } from '@/components/layout/page'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_app/inventory/transactions/')({
  component: RouteComponent,
})

const ch = createColumnHelper<StockTransactionSelectDto>()

function RouteComponent() {
  const ds = useDataTableState()

  const { data, isLoading } = useQuery(
    stockTransactionApi.list.query({
      ...ds.pagination,
      search: ds.search || undefined,
      locationId: undefined,
    })
  )

  const columns = [
    ch.accessor('date', {
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className='whitespace-nowrap'>
          {format(new Date(row.original.date), 'dd MMM yyyy')}
        </span>
      ),
      enableSorting: false,
      size: 130,
    }),
    ch.accessor('referenceNo', {
      header: 'No Referensi',
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.referenceNo}</span>
      ),
      enableSorting: false,
      size: 150,
    }),
    ch.accessor('type', {
      header: 'Tipe',
      cell: ({ row }) => {
        const typeStr = row.original.type
        const color =
          typeStr.includes('in') || typeStr === 'purchase'
            ? 'success'
            : typeStr.includes('out') || typeStr === 'sell'
              ? 'destructive'
              : 'secondary'

        const label = typeStr.replace('_', ' ').toUpperCase()
        return <Badge variant={color as any}>{label}</Badge>
      },
      enableSorting: false,
      size: 110,
    }),
    ch.accessor('materialName', {
      header: 'Bahan Baku',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.materialName}</span>
          <span className='text-xs text-muted-foreground'>
            SKU: {row.original.materialSku}
          </span>
        </div>
      ),
      enableSorting: false,
    }),
    ch.accessor('qty', {
      header: 'Qty',
      cell: ({ row }) => {
        const qty = row.original.qty
        const isOut =
          row.original.type === 'transfer_out' || row.original.type === 'sell'
        const color = isOut
          ? 'text-rose-600 dark:text-rose-400'
          : qty < 0
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-emerald-600 dark:text-emerald-400'

        return (
          <span className={['font-medium whitespace-nowrap', color].join(' ')}>
            {isOut && qty > 0 ? `-${qty}` : qty > 0 ? `+${qty}` : qty}
          </span>
        )
      },
      enableSorting: false,
      size: 100,
    }),
    ch.accessor('totalCost', {
      header: 'Total Nilai (Rp)',
      cell: ({ row }) => {
        return (
          <span className='tabular-nums'>
            {row.original.totalCost.toLocaleString('id-ID')}
          </span>
        )
      },
      enableSorting: false,
      size: 140,
    }),
  ]

  const table = useDataTable({
    columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <Page>
      <Page.BlockHeader
        title='Riwayat Mutasi Transaksi'
        description='Seluruh riwayat transaksi masuk, keluar, transfer, dan penyesuaian stok'
      />
      <Page.Content>
        <DataTableCard
          title='Semua Transaksi'
          table={table}
          isLoading={isLoading}
          recordCount={data?.meta.total || 0}
          action={
            <div className='flex items-center gap-2'>
              <Button size='sm' variant='outline'>
                <Link to='/inventory/transactions/adjustment'>
                  <PlusIcon className='size-4 mr-2' /> Adjustment
                </Link>
              </Button>
              <Button size='sm'>
                <Link to='/inventory/transactions/transfer'>
                  <PlusIcon className='size-4 mr-2' /> Transfer
                </Link>
              </Button>
            </div>
          }
        />
      </Page.Content>
    </Page>
  )
}
