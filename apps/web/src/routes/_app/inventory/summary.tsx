// oxlint-disable max-lines
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, currencyColumn, DataGridCell } from '@/components/reui/data-grid/data-grid-columns'
import { useMemo, useState } from 'react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import { DataCombobox } from '@/components/ui/data-combobox'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { StockLedgerSelectDto } from '@/features/inventory'
import { stockSummaryApi, stockDashboardApi } from '@/features/inventory'
import { locationApi } from '@/features/location'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionErrorBoundary } from '@/components/blocks/feedback/section-error-boundary'
import {
  AlertCircleIcon,
  BoxIcon,
  CalendarIcon,
  MoveDownIcon,
  MoveUpIcon,
  SearchIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, startOfMonth, startOfDay } from 'date-fns'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'

export const Route = createFileRoute('/_app/inventory/summary')({ component: RouteComponent })

function RouteComponent() {
  const ds = useDataTableState()
  const [locationId, setLocationId] = useState<string | null>(null)

  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: startOfDay(startOfMonth(new Date())),
    to: startOfDay(new Date()),
  }))

  const numericLocationId = locationId ? Number(locationId) : undefined

  const { data: kpiData, isLoading: kpiLoading } = useQuery(
    stockDashboardApi.kpi.query({ locationId: numericLocationId }),
  )
  const kpi = kpiData?.data

  return (
    <Page>
      <Page.BlockHeader
        title="Dashboard Inventori"
        description="Monitor pergerakan stok, nilai aset, dan peringatan stok bahan baku."
      />
      <Page.Content className="flex flex-col gap-6">
        {/* Metric Cards Dashboard */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-muted/60 shadow-sm overflow-hidden">
            <Card.Header className="flex flex-row items-center justify-between pb-2 bg-emerald-50/50 dark:bg-emerald-950/20">
              <Card.Title className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                Total Nilai Stok
              </Card.Title>
              <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
            </Card.Header>
            <Card.Content className="pt-4">
              {kpiLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">Rp {kpi?.totalStockValue.toLocaleString('id-ID') ?? '0'}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Estimasi nilai aset saat ini</p>
            </Card.Content>
          </Card>
          <Card className="border-muted/60 shadow-sm overflow-hidden">
            <Card.Header className="flex flex-row items-center justify-between pb-2 bg-blue-50/50 dark:bg-blue-950/20">
              <Card.Title className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                Total Bahan (SKU)
              </Card.Title>
              <BoxIcon className="h-4 w-4 text-blue-500" />
            </Card.Header>
            <Card.Content className="pt-4">
              {kpiLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{kpi?.totalActiveSku ?? '0'}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Stok aktif di lokasi terpilih</p>
            </Card.Content>
          </Card>
          <Card className="border-muted/60 shadow-sm overflow-hidden">
            <Card.Header className="flex flex-row items-center justify-between pb-2 bg-rose-50/50 dark:bg-rose-950/20">
              <Card.Title className="text-sm font-semibold text-rose-800 dark:text-rose-400">
                Peringatan Stok Tipis
              </Card.Title>
              <AlertCircleIcon className="h-4 w-4 text-rose-500" />
            </Card.Header>
            <Card.Content className="pt-4">
              {kpiLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-rose-600">{kpi?.lowStockCount ?? '0'} SKU</div>
              )}
              <p className="text-xs mt-1 text-rose-600/80">Butuh pengadaan ulang segera</p>
            </Card.Content>
          </Card>
        </div>

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60 bg-muted/10">
          <div className="p-4 flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Pencarian Bahan
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama bahan atau SKU..."
                  className="pl-9 h-10 bg-background border-muted/60"
                  value={ds.search}
                  onChange={(e) => ds.setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Lokasi Gudang
              </label>
              <DataCombobox
                className="h-10 bg-background border-muted/60"
                value={locationId}
                onValueChange={setLocationId}
                placeholder="Semua Lokasi"
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

            {/* Date Range */}
            <div className="flex flex-col gap-1.5 min-w-[280px]">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Rentang Tanggal
              </label>
              <DateRangePicker
                value={range}
                onChange={setRange}
                className="h-10 bg-background border-muted/60"
              />
            </div>
            <Button
              variant="outline"
              className="h-10 border-muted/60 hover:bg-background"
              onClick={() => {
                ds.setSearch('')
                setLocationId(null)
                setRange({
                  from: startOfDay(startOfMonth(new Date())),
                  to: startOfDay(new Date()),
                })
              }}
            >
              Reset
            </Button>
          </div>
        </Card>

        {/* Dashboard Table */}
        <SectionErrorBoundary title="Ledger Inventori">
          <SummaryTable ds={ds} locationId={numericLocationId} range={range} />
        </SectionErrorBoundary>
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
    size: 200,
  }),
  ch.accessor('baseUomCode', {
    header: 'Unit',
    cell: ({ getValue }) => (
      <Badge
        variant="outline"
        className="font-medium text-muted-foreground bg-secondary/50 border-transparent shadow-none px-2 rounded-md"
      >
        {getValue()}
      </Badge>
    ),
    size: 70,
  }),
  ch.accessor('openingQty', {
    header: 'Awal',
    cell: ({ getValue }) => <div className="font-medium tabular-nums">{Number(getValue())}</div>,
    size: 90,
  }),
  ch.display({
    id: 'masuk',
    header: 'Masuk',
    cell: ({ row }) => {
      const val = row.original.purchaseQty + row.original.transferInQty + row.original.productionInQty
      return val > 0 ? (
        <div className="flex items-center gap-1 text-emerald-600 font-medium tabular-nums">
          <MoveUpIcon className="size-3" />
          {val}
        </div>
      ) : (
        <span className="text-muted-foreground/40">-</span>
      )
    },
    size: 90,
  }),
  ch.display({
    id: 'keluar',
    header: 'Keluar',
    cell: ({ row }) => {
      const val =
        row.original.sellQty + row.original.usageQty + row.original.transferOutQty + row.original.productionOutQty
      return val > 0 ? (
        <div className="flex items-center gap-1 text-rose-600 font-medium tabular-nums">
          <MoveDownIcon className="size-3" />
          {val}
        </div>
      ) : (
        <span className="text-muted-foreground/40">-</span>
      )
    },
    size: 90,
  }),
  ch.accessor('adjustmentQty', {
    header: 'Adj',
    cell: ({ getValue }) => {
      const val = Number(getValue())
      if (val === 0) return <span className="text-muted-foreground/40">-</span>
      return (
        <div className={cn('font-medium tabular-nums', val > 0 ? 'text-blue-600' : 'text-amber-600')}>
          {val > 0 ? `+${val}` : val}
        </div>
      )
    },
    size: 80,
  }),
  ch.accessor('closingQty', {
    header: 'Stok Akhir',
    cell: ({ row }) => {
      const qty = Number(row.original.closingQty)
      const isLow = qty <= 10 // Mock threshold, could be from row.original.minStock if added to DTO
      return (
        <Badge
          variant={isLow ? 'destructive' : 'success-light'}
          className="shadow-none font-bold tabular-nums rounded-md px-2"
        >
          {qty}
        </Badge>
      )
    },
    size: 110,
  }),
  ch.accessor('closingAvgCost', currencyColumn({ header: 'HPP (Avg)', size: 130 })),
  ch.accessor('closingValue', currencyColumn({ header: 'Nilai Aset', size: 150 })),
]

function SummaryTable({
  ds,
  locationId,
  range,
}: {
  ds: any
  locationId?: number
  range?: DateRange
}) {
  const { data, isLoading } = useQuery(
    // oxlint-disable-next-line typescript/no-unsafe-argument
    stockSummaryApi.ledger.query({
      ...ds.pagination,
      q: ds.search ?? undefined,
      locationId: locationId ?? undefined,
      dateFrom: range?.from ?? startOfMonth(new Date()),
      dateTo: range?.to ?? new Date(),
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
    <DataTableCard
      title="Rincian Ledger Mutasi Bahan"
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total ?? 0}
    />
  )
}
