import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/production/work-orders')({
  component: WorkOrdersPage,
})

// Mock Data
const mockWorkOrders = [
  {
    id: 'WO-2603-001',
    product: 'Roti Tawar Pandan',
    qty: 500,
    uom: 'Pcs',
    deadline: new Date('2026-03-09T18:00:00Z'),
    status: 'in_progress',
  },
  {
    id: 'WO-2603-002',
    product: 'Donat Coklat',
    qty: 1200,
    uom: 'Pcs',
    deadline: new Date('2026-03-10T12:00:00Z'),
    status: 'planned',
  },
  {
    id: 'WO-2603-003',
    product: 'Kue Lapis Legit',
    qty: 50,
    uom: 'Box',
    deadline: new Date('2026-03-08T15:00:00Z'),
    status: 'completed',
  },
  {
    id: 'WO-2603-004',
    product: 'Roti Isi Daging',
    qty: 300,
    uom: 'Pcs',
    deadline: new Date('2026-03-11T08:00:00Z'),
    status: 'planned',
  },
]

type WorkOrderType = (typeof mockWorkOrders)[0]
const ch = createColumnHelper<WorkOrderType>()

const columns = [
  ch.accessor('id', {
    header: 'No. WO',
    cell: ({ row }) => <span className='font-medium'>{row.original.id}</span>,
  }),
  ch.accessor('product', {
    header: 'Produk/Barang Jadi',
  }),
  ch.accessor('qty', {
    header: 'Target Qty',
    cell: ({ row }) => (
      <span className='font-medium text-right block pr-4'>
        {row.original.qty} {row.original.uom}
      </span>
    ),
  }),
  ch.accessor('deadline', {
    header: 'Tenggat Waktu',
    cell: ({ row }) => toDateTimeStamp(row.original.deadline.toISOString()),
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      if (status === 'completed')
        return <BadgeDot variant='success-outline'>Selesai</BadgeDot>
      if (status === 'in_progress')
        return <BadgeDot variant='warning-outline'>Sedang Jalan</BadgeDot>
      return <BadgeDot variant='primary-outline'>Direncanakan</BadgeDot>
    },
  }),
]

function WorkOrdersPage() {
  const table = useDataTable({
    columns,
    data: mockWorkOrders,
    pageCount: 1,
    rowCount: mockWorkOrders.length,
    ds: {
      pagination: { limit: 10, page: 1 },
      search: '',
      filters: {},
    } as any,
  })

  return (
    <Page>
      <Page.BlockHeader
        title='Perintah Kerja (Work Orders)'
        description='Jadwal dan status real-time untuk lini produksi barang setengah/jadi.'
      />
      <Page.Content>
        <DataTableCard
          title='Daftar Work Orders'
          table={table}
          isLoading={false}
          recordCount={mockWorkOrders.length}
          action={
            <Button size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' /> Buat WO Baru
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
