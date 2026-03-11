import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/procurement/orders')({
  component: ProcurementOrderPage,
})

// Mock Data
const mockOrders = [
  {
    id: 'PO-2603-001',
    supplier: 'PT. Sumber Pangan',
    date: new Date('2026-03-08T10:30:00Z'),
    total: 45000000,
    status: 'completed',
  },
  {
    id: 'PO-2603-002',
    supplier: 'CV. Sentosa Makmur',
    date: new Date('2026-03-09T14:15:00Z'),
    total: 12500000,
    status: 'processing',
  },
  {
    id: 'PO-2603-003',
    supplier: 'Toko Beras Jaya',
    date: new Date('2026-03-10T08:45:00Z'),
    total: 8200000,
    status: 'pending',
  },
  {
    id: 'PO-2603-004',
    supplier: 'PT. Aneka Plastik',
    date: new Date('2026-03-10T09:20:00Z'),
    total: 3500000,
    status: 'cancelled',
  },
]

type OrderType = (typeof mockOrders)[0]
const ch = createColumnHelper<OrderType>()

const columns = [
  ch.accessor('id', {
    header: 'No. PO',
    cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
  }),
  ch.accessor('supplier', {
    header: 'Supplier',
  }),
  ch.accessor('date', {
    header: 'Tanggal Order',
    cell: ({ row }) => toDateTimeStamp(row.original.date.toISOString()),
  }),
  ch.accessor('total', {
    header: 'Total Pembelian',
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
        return <BadgeDot variant='success-outline'>Diterima</BadgeDot>
      if (status === 'processing')
        return <BadgeDot variant='warning-outline'>Dikirim</BadgeDot>
      if (status === 'pending')
        return <BadgeDot variant='primary-outline'>Menunggu</BadgeDot>
      return <BadgeDot variant='destructive-outline'>Dibatalkan</BadgeDot>
    },
  }),
]

function ProcurementOrderPage() {
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
        title='Pesanan Pembelian (PO)'
        description='Approval dan pembuatan dokumen Purchase Order.'
      />
      <Page.Content>
        <DataTableCard
          title='Daftar Pesanan Pembelian'
          table={table as any}
          isLoading={false}
          recordCount={mockOrders.length}
          action={
            <Button size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' /> Buat PO
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
