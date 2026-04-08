import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { FileTextIcon, FilterIcon, SearchIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Card } from '@/components/ui/card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/finance/ledger')({ component: FinanceLedgerPage })

// Mock Data Journal Entries
const mockLedgers = [
  { id: 'JV-2603-001', date: new Date('2026-03-01T09:00:00Z'), ref: 'INV-0012', account: '1-1002 Bank BCA', note: 'Pembayaran Piutang Invoice 0012', debit: 14500000, credit: 0 },
  { id: 'JV-2603-001', date: new Date('2026-03-01T09:00:00Z'), ref: 'INV-0012', account: '1-2001 Piutang Usaha', note: 'Penyelesaian Piutang', debit: 0, credit: 14500000 },
  { id: 'JV-2603-002', date: new Date('2026-03-02T10:15:00Z'), ref: 'PO-2603-001', account: '5-1001 Biaya Bahan Baku', note: 'Pembelian Gandum via Kas', debit: 4500000, credit: 0 },
  { id: 'JV-2603-002', date: new Date('2026-03-02T10:15:00Z'), ref: 'PO-2603-001', account: '1-1001 Kas Kecil', note: 'Pengeluaran Kas Pembelian Gudang', debit: 0, credit: 4500000 },
]

type LedgerType = (typeof mockLedgers)[0]
const ch = createColumnHelper<LedgerType>()

const columns = [
  ch.accessor('date', {
    header: 'Tanggal Transaksi',
    size: 150,
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{toDateTimeStamp(row.original.date.toISOString())}</span>,
  }),
  ch.accessor('id', {
    header: 'No. Jurnal & Ref',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground/90">{row.original.id}</span>
        <span className="text-xs text-muted-foreground font-mono">{row.original.ref}</span>
      </div>
    ),
  }),
  ch.accessor('account', {
    header: 'Akun Terkait',
    size: 250,
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.account}</span>,
  }),
  ch.accessor('debit', {
    header: 'Debit',
    size: 150,
    cell: ({ row }) => {
      if (row.original.debit === 0) return <span className="block text-right pr-4 text-muted-foreground/30">-</span>
      return <span className="font-mono font-medium tracking-tight tabular-nums block text-right pr-4 text-emerald-600">Rp {row.original.debit.toLocaleString('id-ID')}</span>
    },
  }),
  ch.accessor('credit', {
    header: 'Kredit',
    size: 150,
    cell: ({ row }) => {
      if (row.original.credit === 0) return <span className="block text-right pr-4 text-muted-foreground/30">-</span>
      return <span className="font-mono font-medium tracking-tight tabular-nums block text-right pr-4 text-rose-600">Rp {row.original.credit.toLocaleString('id-ID')}</span>
    },
  }),
]

function FinanceLedgerPage() {
  const table = useDataTable({
    columns,
    data: mockLedgers,
    pageCount: 1,
    rowCount: mockLedgers.length,
    ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
  })

  return (
    <Page>
      <Page.BlockHeader
        title="Buku Besar & Jurnal"
        description="Pencatatan rekam jejak setiap mutasi masuk dan keluar dari semua akun secara kronologis."
      />
      <Page.Content className="flex flex-col gap-6">

        {/* Metric Cards Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="lg:col-span-2 bg-gradient-to-br from-primary/5 to-transparent">
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-primary">Keseimbangan (Balance Check)</Card.Title>
              <FileTextIcon className="h-4 w-4 text-primary" />
            </Card.Header>
            <Card.Content>
              <div className="flex items-end gap-3">
                <div className="text-2xl font-bold font-mono tracking-tight text-primary">Balanced</div>
                <BadgeDot variant="success" className="mb-1">Selisih 0</BadgeDot>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Debit & Kredit sama</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Arus Debit (Bulan Ini)</Card.Title>
              <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600">Rp 19M</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Arus Kredit (Bulan Ini)</Card.Title>
              <TrendingDownIcon className="h-4 w-4 text-rose-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold font-mono tracking-tight text-rose-600">Rp 19M</div>
            </Card.Content>
          </Card>
        </div>

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 min-w-[300px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian Jurnal</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari No Jurnal, Referensi, atau Akun..." className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 sm:self-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">Aksi</label>
              <Button size="sm" variant="outline" className="h-10 border font-medium">
                <FilterIcon className="size-4 mr-2" /> Filter Lanjutan
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
          <DataTableCard
            title="Riwayat Jurnal Transaksi"
            table={table as any}
            isLoading={false}
            recordCount={mockLedgers.length}
          />
        </div>
      </Page.Content>
    </Page>
  )
}
