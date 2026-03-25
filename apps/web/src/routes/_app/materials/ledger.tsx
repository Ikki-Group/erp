import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PackageSearchIcon } from 'lucide-react'
import { useState } from 'react'

import { DataTableCard } from '@/components/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataCombobox } from '@/components/ui/data-combobox'
import { Input } from '@/components/ui/input'
import type { StockLedgerOutputDto } from '@/features/inventory'
import { inventoryApi } from '@/features/inventory'
import { locationApi } from '@/features/location'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

export const Route = createFileRoute('/_app/materials/ledger')({ component: RouteComponent })

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
  const [dateFrom, setDateFrom] = useState(() => getStartOfMonth())
  const [dateTo, setDateTo] = useState(() => getToday())

  const numericLocationId = locationId ? Number(locationId) : undefined

  return (
    <Page>
      <Page.BlockHeader
        title="Ledger Bahan Baku"
        description="Monitoring stok harian dan mutasi bahan baku (konsolidasi atau per lokasi)"
      />
      <Page.Content className="flex flex-col gap-4">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5 w-full max-w-sm">
            <label className="text-sm font-medium">Pilih Lokasi</label>
            <DataCombobox
              value={locationId}
              onValueChange={(val) => setLocationId(val)}
              placeholder="Semua Lokasi (Konsolidasi)..."
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
          <div className="flex flex-col gap-1.5 w-full max-w-xs">
            <label className="text-sm font-medium">Dari Tanggal</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 w-full max-w-xs">
            <label className="text-sm font-medium">Sampai Tanggal</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setLocationId(null)
              setDateFrom(getStartOfMonth())
              setDateTo(getToday())
            }}
          >
            Reset
          </Button>
        </div>

        {/* Ledger Table */}
        <LedgerTable locationId={numericLocationId} dateFrom={dateFrom} dateTo={dateTo} />
      </Page.Content>
    </Page>
  )
}

/* ─────────── Ledger Table ─────────── */

const ch = createColumnHelper<StockLedgerOutputDto>()

function LedgerTable({ locationId, dateFrom, dateTo }: { locationId?: number; dateFrom: string; dateTo: string }) {
  const ds = useDataTableState()

  // Make sure to pass well-formatted dates to API
  const isValidDateRange = dateFrom && dateTo

  const { data, isLoading } = useQuery(
    inventoryApi.ledger.query(
      isValidDateRange
        ? {
            ...ds.pagination,
            search: ds.search || undefined,
            locationId,
            dateFrom: new Date(dateFrom),
            dateTo: new Date(dateTo),
          }
        : undefined,
    ),
  )

  const columns = [
    ch.accessor('materialName', {
      header: 'Bahan Baku',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.materialName}</span>
          <span className="text-xs text-muted-foreground">SKU: {row.original.materialSku}</span>
        </div>
      ),
      enableSorting: false,
    }),
    ch.accessor('baseUomCode', {
      header: 'Satuan',
      cell: ({ row }) => <Badge variant="secondary">{row.original.baseUomCode}</Badge>,
      enableSorting: false,
      size: 90,
    }),
    ch.accessor('openingQty', {
      header: 'Awal',
      cell: ({ row }) => <span className="font-medium">{row.original.openingQty}</span>,
      enableSorting: false,
      size: 100,
    }),
    ch.display({
      id: 'masukQty',
      header: 'Masuk',
      cell: ({ row }) => {
        const totalIn = row.original.purchaseQty + row.original.transferInQty
        return (
          <div
            className="flex flex-col"
            title={`Beli: ${row.original.purchaseQty} | Mutasi In: ${row.original.transferInQty}`}
          >
            <span className="font-medium text-emerald-600 dark:text-emerald-400">+{totalIn}</span>
          </div>
        )
      },
      size: 100,
      enableSorting: false,
    }),
    ch.display({
      id: 'keluarQty',
      header: 'Keluar/Terjual',
      cell: ({ row }) => {
        const totalOut = row.original.sellQty + row.original.transferOutQty
        return (
          <div
            className="flex flex-col"
            title={`Jual: ${row.original.sellQty} | Mutasi Out: ${row.original.transferOutQty}`}
          >
            <span className="font-medium text-rose-600 dark:text-rose-400">{totalOut > 0 ? `-${totalOut}` : '0'}</span>
          </div>
        )
      },
      size: 120,
      enableSorting: false,
    }),
    ch.accessor('adjustmentQty', {
      header: 'Opname',
      cell: ({ row }) => {
        const adj = row.original.adjustmentQty
        const colorClass =
          adj > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : adj < 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-muted-foreground'
        return <span className={['font-medium', colorClass].join(' ')}>{adj > 0 ? `+${adj}` : adj}</span>
      },
      enableSorting: false,
      size: 100,
    }),
    ch.accessor('closingQty', {
      header: 'Akhir',
      cell: ({ row }) => <span className="font-bold">{row.original.closingQty}</span>,
      enableSorting: false,
      size: 100,
    }),
    ch.accessor('closingAvgCost', {
      header: 'Avg Cost (WAC)',
      cell: ({ row }) => <span className="tabular-nums">{row.original.closingAvgCost.toLocaleString('id-ID')}</span>,
      enableSorting: false,
      size: 140,
    }),
    ch.accessor('closingValue', {
      header: 'Nilai Stok Akhir',
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">{row.original.closingValue.toLocaleString('id-ID')}</span>
      ),
      enableSorting: false,
      size: 140,
    }),
  ]

  const table = useDataTable({
    columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  // Provide initial empty state message if error/loading happens
  if (!isValidDateRange) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <PackageSearchIcon className="size-12 opacity-20" />
        <p className="font-medium text-foreground">Pilih rentang tanggal untuk melihat ledger.</p>
      </div>
    )
  }

  return (
    <DataTableCard title="Ledger Bahan Baku" table={table} isLoading={isLoading} recordCount={data?.meta.total || 0} />
  )
}
