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
import { ClipboardListIcon, ClockIcon, SearchIcon, TruckIcon } from 'lucide-react'

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
  ch.accessor('id', { header: 'No. Pembelian', cell: ({ row }) => <span className="font-semibold text-foreground/90">{row.original.id}</span> }),
  ch.accessor('supplier', { header: 'Pemasok', cell: ({ row }) => <span className="font-medium">{row.original.supplier}</span> }),
  ch.accessor('date', { header: 'Tanggal Order', cell: ({ row }) => <span className="text-muted-foreground">{toDateTimeStamp(row.original.date.toISOString())}</span> }),
  ch.accessor('total', {
    header: 'Total Tagihan',
    size: 160,
    cell: ({ row }) => (
      <span className="font-mono font-medium tracking-tight tabular-nums opacity-90 truncate">Rp {row.original.total.toLocaleString('id-ID')}</span>
    ),
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      if (status === 'completed') return <BadgeDot variant="success-outline">Diterima</BadgeDot>
      if (status === 'processing') return <BadgeDot variant="warning-outline">Dikirim</BadgeDot>
      if (status === 'pending') return <BadgeDot variant="primary-outline">Menunggu</BadgeDot>
      return <BadgeDot variant="destructive-outline">Dibatalkan</BadgeDot>
    },
  }),
]

function ProcurementOrderPage() {
  const table = useDataTable({
    columns,
    data: mockOrders,
    pageCount: 1,
    rowCount: mockOrders.length,
    ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
  })

  return (
    <Page>
      <Page.BlockHeader title="Pesanan Pembelian (PO)" description="Manajemen dokumen Purchase Order (PO) dan pantau status pemesanan ke Supplier." />
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

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 min-w-[300px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian PO</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari nama supplier atau No. PO..." className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 sm:self-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">Aksi</label>
              <Button size="sm" className="h-10 shadow-md font-medium">
                <PlusIcon className="size-4 mr-2" /> Buat PO Baru
              </Button>
            </div>
          </div>
        </Card>

        <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
          <DataTableCard
            title="Daftar Pesanan Pembelian"
            table={table as any}
            isLoading={false}
            recordCount={mockOrders.length}
          />
        </div>
      </Page.Content>
    </Page>
  )
}
