import { createFileRoute } from '@tanstack/react-router'
import { ClipboardListIcon, ClockIcon, PlusIcon, TruckIcon } from 'lucide-react'

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

export const Route = createFileRoute('/_app/procurement/orders')({ component: ProcurementOrderPage })

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
  ch.accessor('id', textColumn({ header: 'No. Pembelian', size: 150 })),
  ch.accessor('supplier', textColumn({ header: 'Pemasok', size: 250 })),
  ch.accessor('date', dateColumn({ header: 'Tanggal Order', size: 160 })),
  ch.accessor('total', currencyColumn({ header: 'Total Tagihan', size: 160 })),
  ch.accessor(
    'status',
    statusColumn({
      header: 'Status',
      render: (value) => {
        const status = value as string
        if (status === 'completed') return <BadgeDot variant="success-outline">Diterima</BadgeDot>
        if (status === 'processing') return <BadgeDot variant="warning-outline">Dikirim</BadgeDot>
        if (status === 'pending') return <BadgeDot variant="primary-outline">Menunggu</BadgeDot>
        return <BadgeDot variant="destructive-outline">Dibatalkan</BadgeDot>
      },
      size: 130,
    }),
  ),
]

function ProcurementOrderPage() {
  const ds = useDataTableState()
  const table = useDataTable({ columns, data: mockOrders, pageCount: 1, rowCount: mockOrders.length, ds })

  return (
    <Page>
      <Page.BlockHeader
        title="Pesanan Pembelian (PO)"
        description="Manajemen dokumen Purchase Order (PO) dan pantau status pemesanan ke Supplier."
      />
      <Page.Content className="flex flex-col gap-6">
        {/* Metric Cards Dashboard */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Total Tagihan (Bulan Ini)</Card.Title>
              <ClipboardListIcon className="h-4 w-4 text-emerald-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold font-mono tracking-tight">Rp 69.200.000</div>
              <p className="text-xs text-muted-foreground mt-1">4 Pesanan Aktif</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Menunggu Konfirmasi</Card.Title>
              <ClockIcon className="h-4 w-4 text-amber-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">1 PO</div>
              <p className="text-xs text-muted-foreground mt-1">Status: Pending</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Dalam Pengiriman</Card.Title>
              <TruckIcon className="h-4 w-4 text-blue-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">1 Pengiriman</div>
              <p className="text-xs text-muted-foreground mt-1">Status: Processing / Transit</p>
            </Card.Content>
          </Card>
        </div>

        <DataTableCard
          title="Daftar Pesanan Pembelian"
          table={table}
          isLoading={false}
          recordCount={mockOrders.length}
          toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari nomor PO...' }]} />}
          action={
            <Button size="sm" className="h-10 shadow-md font-medium">
              <PlusIcon className="size-4 mr-2" /> Buat PO Baru
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
