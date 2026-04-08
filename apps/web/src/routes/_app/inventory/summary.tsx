import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useState } from 'react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { DataCombobox } from '@/components/ui/data-combobox'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { StockLedgerSelectDto } from '@/features/inventory'
import { stockSummaryApi } from '@/features/inventory'
import { locationApi } from '@/features/location'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { AlertCircleIcon, BoxIcon, MoveDownIcon, SearchIcon, TrendingUpIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/inventory/summary')({ component: RouteComponent })

function getStartOfMonth() {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().split('T')[0]
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function RouteComponent() {
  const [locationId, setLocationId] = useState<string | null>(null)

  // By default we get the period of this month
  const [dateFrom] = useState(() => getStartOfMonth())
  const [dateTo] = useState(() => getToday())

  const numericLocationId = locationId ? Number(locationId) : undefined

  return (
    <Page>
      <Page.BlockHeader title="Summary Stok" description="Lihat rangkuman nilai dan kuantitas stok bahan baku." />
      <Page.Content className="flex flex-col gap-6">
        
        {/* Metric Cards Dashboard */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Total Nilai Stok</Card.Title>
              <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">Mock Rp 0</div>
              <p className="text-xs text-muted-foreground mt-1">+0% dari bulan lalu</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Total Bahan (SKU)</Card.Title>
              <BoxIcon className="h-4 w-4 text-blue-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Stok aktif di semua lokasi</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Peringatan Stok Tipis</Card.Title>
              <AlertCircleIcon className="h-4 w-4 text-rose-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold text-rose-600">0 SKU</div>
              <p className="text-xs mt-1 text-rose-600/80">Butuh pengadaan ulang (Reorder)</p>
            </Card.Content>
          </Card>
        </div>

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60">
          <div className="p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Search */}
              <div className="flex flex-col gap-1.5 min-w-[280px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari nama bahan atau SKU..." className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background" />
                </div>
              </div>
              {/* Location Filter */}
              <div className="flex flex-col gap-1.5 min-w-[240px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter Gudang</label>
                <DataCombobox
                  className="h-10 bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors"
                  value={locationId}
                  onValueChange={(val) => setLocationId(val)}
                  placeholder="Semua Lokasi Gudang"
                  emptyText="Lokasi tidak ditemukan."
                  queryKey={['location-list']}
                  queryFn={async (search: string) => {
                    const res = await locationApi.list.fetch({
                      params: { page: 1, limit: 20, search: search || undefined },
                    })
                    return res.data
                  }}
                  getLabel={(item) => `${item.name} (${item.code})`}
                  getValue={(item) => String(item.id)}
                />
              </div>
            </div>
            {/* Future Primary Actions can go here */}
          </div>
        </Card>

        {/* Ledger Table */}
        <SummaryTable locationId={numericLocationId} dateFrom={dateFrom} dateTo={dateTo} />
      </Page.Content>
    </Page>
  )
}

/* ─────────── Summary Table ─────────── */

const ch = createColumnHelper<StockLedgerSelectDto>()

function SummaryTable({ locationId, dateFrom, dateTo }: { locationId?: number; dateFrom: string; dateTo: string }) {
  const ds = useDataTableState()

  const { data, isLoading } = useQuery(
    stockSummaryApi.ledger.query({
      ...ds.pagination,
      search: ds.search || undefined,
      locationId,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    }),
  )

  const columns = [
    ch.accessor('materialName', {
      header: 'Bahan Baku',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground/90">{row.original.materialName}</span>
          <span className="text-[11px] font-mono text-muted-foreground/80 tracking-tight">{row.original.materialSku}</span>
        </div>
      ),
      enableSorting: false,
    }),
    ch.accessor('baseUomCode', {
      header: 'Satuan',
      cell: ({ row }) => <Badge variant="outline" className="font-medium text-muted-foreground bg-secondary/50 border-transparent shadow-none px-2 rounded-md">{row.original.baseUomCode}</Badge>,
      enableSorting: false,
      size: 90,
    }),
    ch.accessor('openingQty', {
      header: 'Stok Awal',
      cell: ({ row }) => <span className="font-medium text-muted-foreground tabular-nums">{row.original.openingQty}</span>,
      enableSorting: false,
      size: 110,
    }),
    ch.accessor('closingQty', {
      header: 'Stok Terkini',
      cell: ({ row }) => {
        const qty = Number(row.original.closingQty)
        const isLow = qty < 10 // Example margin threshold
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isLow ? 'destructive' : 'default'} className={`shadow-none font-bold tabular-nums rounded-md px-2 ${!isLow && 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'}`}>
              {qty}
            </Badge>
            {isLow && <MoveDownIcon className="h-3 w-3 text-rose-500" />}
          </div>
        )
      },
      enableSorting: false,
      size: 130,
    }),
    ch.accessor('closingAvgCost', {
      header: 'HPP (Avg Cost)',
      cell: ({ row }) => (
        <span className="font-mono text-[13px] text-muted-foreground tabular-nums opacity-80">
          Rp {row.original.closingAvgCost.toLocaleString('id-ID')}
        </span>
      ),
      enableSorting: false,
      size: 150,
    }),
    ch.accessor('closingValue', {
      header: 'Nilai Stok Akhir',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-foreground tracking-tight tabular-nums">
          Rp {row.original.closingValue.toLocaleString('id-ID')}
        </span>
      ),
      enableSorting: false,
      size: 180,
    }),
  ]

  const table = useDataTable({
    columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  // Calculate mock summary from current page data if needed
  // For proper implementation, this should come from a dedicated `/summary` endpoint
  
  return (
    <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
      <DataTableCard 
        title="Rincian Ledger Inventori" 
        table={table} 
        isLoading={isLoading} 
        recordCount={data?.meta.total || 0} 
      />
    </div>
  )
}
