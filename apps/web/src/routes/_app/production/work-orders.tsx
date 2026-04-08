import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Card } from '@/components/ui/card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'
import { ActivityIcon, CalendarCheckIcon, SearchIcon, TimerIcon } from 'lucide-react'

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
  ch.accessor('id', { header: 'No. WO', cell: ({ row }) => <span className="font-semibold text-foreground/90 tabular-nums">{row.original.id}</span> }),
  ch.accessor('product', { header: 'Produk/Barang Jadi', cell: ({ row }) => <span className="font-medium text-foreground/90">{row.original.product}</span> }),
  ch.accessor('qty', {
    header: 'Target Qty',
    cell: ({ row }) => (
      <span className="font-bold tabular-nums text-foreground/80 pr-4">
        {row.original.qty} <span className="text-xs text-muted-foreground font-normal">{row.original.uom}</span>
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
      if (status === 'completed') return <BadgeDot variant="success-outline">Selesai</BadgeDot>
      if (status === 'in_progress') return <BadgeDot variant="warning-outline">Sedang Jalan</BadgeDot>
      return <BadgeDot variant="primary-outline">Direncanakan</BadgeDot>
    },
  }),
]

function WorkOrdersPage() {
  const table = useDataTable({
    columns,
    data: mockWorkOrders,
    pageCount: 1,
    rowCount: mockWorkOrders.length,
    ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
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

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 min-w-[300px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian Batch</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari No. WO atau nama produk..." className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 sm:self-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">Aksi</label>
              <Button size="sm" className="h-10 shadow-md font-medium">
                <PlusIcon className="size-4 mr-2" /> Buat WO Baru
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
           <DataTableCard
            title="Daftar Work Orders"
            table={table as any}
            isLoading={false}
            recordCount={mockWorkOrders.length}
          />
        </div>
      </Page.Content>
    </Page>
  )
}
