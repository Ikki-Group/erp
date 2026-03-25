import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { StockLedgerOutputDto } from '@/features/inventory'
import { stockSummaryApi } from '@/features/inventory'
import { Page } from '@/components/layout/page'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { Badge } from '@/components/ui/badge'
import { DataCombobox } from '@/components/ui/data-combobox'
import { locationApi } from '@/features/location'

export const Route = createFileRoute('/_app/inventory/summary')({
  component: RouteComponent,
})

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
      <Page.BlockHeader
        title='Summary Stok'
        description='Lihat rangkuman nilai dan kuantitas stok bahan baku.'
      />
      <Page.Content className='flex flex-col gap-4'>
        {/* Filter Bar */}
        <div className='flex items-end gap-3'>
          <div className='flex flex-col gap-1.5 w-full max-w-sm'>
            <label className='text-sm font-medium'>
              Lokasi Gudang (Opsional)
            </label>
            <DataCombobox
              value={locationId}
              onValueChange={val => setLocationId(val)}
              placeholder='Semua Lokasi (Konsolidasi)...'
              emptyText='Lokasi tidak ditemukan.'
              queryKey={['location-list']}
              queryFn={async (search: string) => {
                const res = await locationApi.list.fetch({
                  params: { page: 1, limit: 20, search: search || undefined },
                })
                return res.data
              }}
              getLabel={item => `${item.name} (${item.code})`}
              getValue={item => String(item.id)}
            />
          </div>
        </div>

        {/* Ledger Table */}
        <SummaryTable
          locationId={numericLocationId}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </Page.Content>
    </Page>
  )
}

/* ─────────── Summary Table ─────────── */

const ch = createColumnHelper<StockLedgerOutputDto>()

function SummaryTable({
  locationId,
  dateFrom,
  dateTo,
}: {
  locationId?: number
  dateFrom: string
  dateTo: string
}) {
  const ds = useDataTableState()

  const { data, isLoading } = useQuery(
    stockSummaryApi.ledger.query({
      ...ds.pagination,
      search: ds.search || undefined,
      locationId,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    })
  )

  const columns = [
    ch.accessor('materialName', {
      header: 'Bahan Baku',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.materialName}</span>
          <span className='text-xs text-muted-foreground'>
            SKU: {row.original.materialSku}
          </span>
        </div>
      ),
      enableSorting: false,
    }),
    ch.accessor('baseUomCode', {
      header: 'Satuan',
      cell: ({ row }) => (
        <Badge variant='secondary'>{row.original.baseUomCode}</Badge>
      ),
      enableSorting: false,
      size: 90,
    }),
    ch.accessor('openingQty', {
      header: 'Stok Awal Bln',
      cell: ({ row }) => <span className=''>{row.original.openingQty}</span>,
      enableSorting: false,
      size: 130,
    }),
    ch.accessor('closingQty', {
      header: 'Stok Terkini',
      cell: ({ row }) => (
        <span className='font-bold'>{row.original.closingQty}</span>
      ),
      enableSorting: false,
      size: 110,
    }),
    ch.accessor('closingAvgCost', {
      header: 'HPP (Avg Cost)',
      cell: ({ row }) => (
        <span className='tabular-nums'>
          {row.original.closingAvgCost.toLocaleString('id-ID')}
        </span>
      ),
      enableSorting: false,
      size: 140,
    }),
    ch.accessor('closingValue', {
      header: 'Nilai Stok (HPP x Stok)',
      cell: ({ row }) => (
        <span className='font-semibold tabular-nums'>
          {row.original.closingValue.toLocaleString('id-ID')}
        </span>
      ),
      enableSorting: false,
      size: 170,
    }),
  ]

  const table = useDataTable({
    columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      title='Total Nilai Stok'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
    />
  )
}
