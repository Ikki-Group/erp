import { createFileRoute } from '@tanstack/react-router'
import { ActivityIcon, CalendarCheckIcon, PlusIcon, TimerIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import {
  createColumnHelper,
  currencyColumn,
  dateColumn,
  statusColumn,
  textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

export const Route = createFileRoute('/_app/production/work-orders')({ component: WorkOrdersPage })

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
  ch.accessor('id', textColumn({ header: 'No. WO', size: 130 })),
  ch.accessor('product', textColumn({ header: 'Produk/Barang Jadi', size: 250 })),
  ch.accessor(
    'qty',
    statusColumn({
      header: 'Target Qty',
      render: (value, row) => (
        <span className="font-bold tabular-nums text-foreground/80 pr-4">
          {value} <span className="text-xs text-muted-foreground font-normal">{row.uom}</span>
        </span>
      ),
      size: 130,
    }),
  ),
  ch.accessor('deadline', dateColumn({ header: 'Tenggat Waktu', size: 160 })),
  ch.accessor(
    'status',
    statusColumn({
      header: 'Status',
      render: (value) => {
        const status = value as string
        if (status === 'completed') return <BadgeDot variant="success-outline">Selesai</BadgeDot>
        if (status === 'in_progress') return <BadgeDot variant="warning-outline">Sedang Jalan</BadgeDot>
        return <BadgeDot variant="primary-outline">Direncanakan</BadgeDot>
      },
      size: 130,
    }),
  ),
]

function WorkOrdersPage() {
  const ds = useDataTableState()
  const table = useDataTable({
    columns,
    data: mockWorkOrders,
    pageCount: 1,
    rowCount: mockWorkOrders.length,
    ds,
  })

  return (
    <Page>
      <Page.BlockHeader
        title="Perintah Kerja (Work Orders)"
        description="Jadwal dan status real-time untuk lini produksi barang setengah/jadi."
      />
      <Page.Content className="flex flex-col gap-6">

        {/* Metric Cards Dashboard */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Persentase Selesai</Card.Title>
              <ActivityIcon className="h-4 w-4 text-emerald-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">24%</div>
              <p className="text-xs text-muted-foreground mt-1">1 dari 4 Work Order tuntas</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Sedang Berjalan</Card.Title>
              <TimerIcon className="h-4 w-4 text-amber-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">1 Batch</div>
              <p className="text-xs text-amber-600/80 mt-1">Roti Tawar Pandan (500 Pcs)</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Jadwal Mendatang</Card.Title>
              <CalendarCheckIcon className="h-4 w-4 text-blue-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">2 Rencana</div>
              <p className="text-xs text-muted-foreground mt-1">Menunggu alokasi bahan baku</p>
            </Card.Content>
          </Card>
        </div>

        <DataTableCard
          title="Daftar Work Orders"
          table={table}
          isLoading={false}
          recordCount={mockWorkOrders.length}
          toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari No. WO...' }]} />}
          action={
            <Button size="sm" className="h-10 shadow-md font-medium">
              <PlusIcon className="size-4 mr-2" /> Buat WO Baru
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
