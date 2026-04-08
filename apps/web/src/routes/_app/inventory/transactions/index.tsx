import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { PlusIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StockTransactionSelectDto } from '@/features/inventory'
import { stockTransactionApi } from '@/features/inventory'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

export const Route = createFileRoute('/_app/inventory/transactions/')({ component: RouteComponent })

const ch = createColumnHelper<StockTransactionSelectDto>()

function RouteComponent() {
  const ds = useDataTableState()

  const { data, isLoading } = useQuery(
    stockTransactionApi.list.query({ ...ds.pagination, search: ds.search || undefined, locationId: undefined }),
  )

  const columns = [
    ch.accessor('date', {
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{format(new Date(row.original.date), 'dd MMM yyyy')}</span>
      ),
      enableSorting: false,
      size: 130,
    }),
    ch.accessor('referenceNo', {
      header: 'No Referensi',
      cell: ({ row }) => <span className="font-medium">{row.original.referenceNo}</span>,
      enableSorting: false,
      size: 150,
    }),
    ch.accessor('type', {
      header: 'Tipe',
      cell: ({ row }) => {
        const typeStr = row.original.type
        const color =
          typeStr.includes('in') || typeStr === 'purchase'
            ? 'success'
            : typeStr.includes('out') || typeStr === 'sell'
              ? 'destructive'
              : 'secondary'

        const label = typeStr.replace('_', ' ').toUpperCase()
        return <Badge variant={color as any}>{label}</Badge>
      },
      enableSorting: false,
      size: 110,
    }),
    ch.accessor('materialName', {
      header: 'Bahan Baku',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground/90">{row.original.materialName}</span>
          <span className="text-[11px] font-mono text-muted-foreground/80 tracking-tight">SKU: {row.original.materialSku}</span>
        </div>
      ),
      enableSorting: false,
    }),
    ch.accessor('qty', {
      header: 'Qty',
      cell: ({ row }) => {
        const qty = row.original.qty
        const isOut = row.original.type === 'transfer_out' || row.original.type === 'sell'
        const color = isOut || qty < 0
          ? 'text-rose-600 bg-rose-500/10'
          : 'text-emerald-600 bg-emerald-500/10'

        return (
          <Badge variant="outline" className={['font-semibold tabular-nums px-2 shadow-none border-transparent', color].join(' ')}>
            {isOut && qty > 0 ? `-${qty}` : qty > 0 ? `+${qty}` : qty}
          </Badge>
        )
      },
      enableSorting: false,
      size: 100,
    }),
    ch.accessor('totalCost', {
      header: 'Total Nilai',
      cell: ({ row }) => {
        return <span className="font-mono font-medium opacity-90 tabular-nums">Rp {row.original.totalCost.toLocaleString('id-ID')}</span>
      },
      enableSorting: false,
      size: 150,
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
    <Page>
      <Page.BlockHeader
        title="Riwayat Mutasi & Transaksi"
        description="Pantau seluruh pergerakan barang (masuk, keluar, transfer, dan opname/penyesuaian)."
      />
      <Page.Content className="flex flex-col gap-6">

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 min-w-[300px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian Referensi</label>
                <div className="relative">
                  <Input 
                    placeholder="Cari nomor pelacakan..." 
                    className="h-10 bg-secondary/30 border-transparent focus-visible:bg-background" 
                    value={ds.search}
                    onChange={(e) => ds.setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 sm:self-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">Aksi</label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" className="h-10 shadow-none border hover:bg-secondary/80 font-medium">
                  <Link to="/inventory/transactions/adjustment" className="flex items-center">
                    <PlusIcon className="size-4 mr-2 text-muted-foreground" /> Opname (Adjust)
                  </Link>
                </Button>
                <Button size="sm" className="h-10 shadow-md font-medium">
                  <Link to="/inventory/transactions/transfer" className="flex items-center">
                    <PlusIcon className="size-4 mr-2" /> Mutasi Internal
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
          <DataTableCard
            title="Daftar Mutasi Terkini"
            table={table}
            isLoading={isLoading}
            recordCount={data?.meta.total || 0}
          />
        </div>
      </Page.Content>
    </Page>
  )
}

