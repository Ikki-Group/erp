import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/sales/orders')({
  component: SalesOrderPage,
})

// Mock Data
const mockOrders = [
  {
    id: 'SO-2603-001',
    customer: 'PT. Maju Mundur',
    date: new Date('2026-03-09T10:30:00Z'),
    total: 12500000,
    status: 'completed',
  },
  {
    id: 'SO-2603-002',
    customer: 'Toko Sejahtera',
    date: new Date('2026-03-09T14:15:00Z'),
    total: 5400000,
    status: 'processing',
  },
  {
    id: 'SO-2603-003',
    customer: 'CV. Karya Abadi',
    date: new Date('2026-03-10T08:45:00Z'),
    total: 21000000,
    status: 'pending',
  },
  {
    id: 'SO-2603-004',
    customer: 'Bapak Budi',
    date: new Date('2026-03-10T09:20:00Z'),
    total: 1500000,
    status: 'cancelled',
  },
]

type OrderType = (typeof mockOrders)[0]
const ch = createColumnHelper<OrderType>()

const columns = [
  ch.accessor('id', {
    header: 'No. Pesanan',
    cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
  }),
  ch.accessor('customer', {
    header: 'Pelanggan',
  }),
  ch.accessor('date', {
    header: 'Tanggal',
    cell: ({ row }) => toDateTimeStamp(row.original.date.toISOString()),
  }),
  ch.accessor('total', {
    header: 'Total Pembayaran',
    cell: ({ row }) => (
      <span className='font-medium text-right block'>
        Rp {row.original.total.toLocaleString('id-ID')}
      </span>
    ),
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      if (status === 'completed')
        return <BadgeDot variant='success-outline'>Selesai</BadgeDot>
      if (status === 'processing')
        return <BadgeDot variant='warning-outline'>Diproses</BadgeDot>
      if (status === 'pending')
        return <BadgeDot variant='primary-outline'>Menunggu</BadgeDot>
      return <BadgeDot variant='destructive-outline'>Dibatalkan</BadgeDot>
    },
  }),
]

function SalesOrderPage() {
  const table = useDataTable({
    columns,
    data: mockOrders,
    pageCount: 1,
    rowCount: mockOrders.length,
    ds: {
      pagination: { limit: 10, page: 1 },
      search: '',
      filters: {},
    } as any,
  })

  return (
    <Page>
      <Page.BlockHeader
        title='Pesanan Penjualan'
        description='Kelola seluruh pesanan pelanggan Anda di sini.'
      />
      <Page.Content>
        <DataTableCard
          title='Daftar Pesanan'
          table={table as any}
          isLoading={false}
          recordCount={mockOrders.length}
          action={
            <Button size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' /> Tambah Pesanan
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
