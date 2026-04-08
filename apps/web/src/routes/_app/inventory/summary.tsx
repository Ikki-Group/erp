import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  createColumnHelper,
  currencyColumn,
  DataGridCell,
  textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { useMemo, useState } from 'react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
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

function getStartOfMonth(): string {
  const date = new Date()
  date.setDate(1)
  return date.toISOString().split('T')[0]!
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]!
}

function RouteComponent() {
  const [locationId, setLocationId] = useState<string | null>(null)

  // By default we get the period of this month
  const [dateFrom] = useState<string>(() => getStartOfMonth())
  const [dateTo] = useState<string>(() => getToday())

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
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pencarian
                </label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama bahan atau SKU..."
                    className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background"
                  />
                </div>
              </div>
              {/* Location Filter */}
              <div className="flex flex-col gap-1.5 min-w-[240px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filter Gudang
                </label>
                <DataCombobox
                  className="h-10 bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors"
                  value={locationId}
                  onValueChange={(val) => {
                    setLocationId(val)
                  }}
                  placeholder="Semua Lokasi Gudang"
                  emptyText="Lokasi tidak ditemukan."
                  queryKey={['location-list']}
                  queryFn={async (search: string) => {
                    const res = await locationApi.list.fetch({ params: { page: 1, limit: 20, q: search || undefined } })
                    return res.data
                  }}
                  getLabel={(item) => `${item.name} (${item.code})`}
                  getValue={(item) => String(item.id)}
                />
              </div>
            </div>
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
const columnDefs = [
  ch.accessor('materialName', {
    header: 'Bahan Baku',
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <DataGridCell.Text value={row.original.materialName} className="font-semibold text-foreground/90" />
        <DataGridCell.Text
          value={row.original.materialSku}
          className="text-[11px] font-mono text-muted-foreground/80 tracking-tight"
        />
      </div>
    ),
    size: 180,
  }),
  ch.accessor('baseUomCode', {
    header: 'Satuan',
    cell: ({ getValue }) => (
      <Badge
        variant="outline"
        className="font-medium text-muted-foreground bg-secondary/50 border-transparent shadow-none px-2 rounded-md"
      >
        {getValue()}
      </Badge>
    ),
    size: 90,
  }),
  ch.accessor('openingQty', textColumn({ header: 'Stok Awal', size: 110 })),
  ch.accessor('closingQty', {
    header: 'Stok Terkini',
    cell: ({ getValue }) => {
      const qty = Number(getValue())
      const isLow = qty < 10
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={isLow ? 'destructive' : 'success-light'}
            className="shadow-none font-bold tabular-nums rounded-md px-2"
          >
            {qty}
          </Badge>
          {isLow && <MoveDownIcon className="h-3 w-3 text-rose-500" />}
        </div>
      )
    },
    size: 130,
  }),
  ch.accessor('closingAvgCost', currencyColumn({ header: 'HPP (Avg Cost)', size: 150 })),
  ch.accessor('closingValue', currencyColumn({ header: 'Nilai Stok Akhir', size: 180 })),
]

function SummaryTable({ locationId, dateFrom, dateTo }: { locationId?: number; dateFrom: string; dateTo: string }) {
  const ds = useDataTableState()

  const { data, isLoading } = useQuery(
    stockSummaryApi.ledger.query({
      ...ds.pagination,
      q: ds.search || undefined,
      locationId: locationId ?? undefined,
      dateFrom: new Date(dateFrom ?? getStartOfMonth()),
      dateTo: new Date(dateTo ?? getToday()),
    }),
  )

  const columns = useMemo(() => columnDefs, [])
  const table = useDataTable({
    columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
      <DataTableCard
        title="Rincian Ledger Inventori"
        table={table}
        isLoading={isLoading}
        recordCount={data?.meta.total ?? 0}
      />
    </div>
  )
}
