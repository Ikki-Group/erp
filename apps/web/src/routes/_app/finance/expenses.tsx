import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { FlameIcon, PlusIcon, SearchIcon, TagIcon } from 'lucide-react'

import { DataTableCard } from '@/components/card/data-table-card'
import { Card } from '@/components/ui/card'
import { BadgeDot } from '@/components/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/finance/expenses')({ component: FinanceExpensesPage })

// Mock Data Expenses
const mockExpenses = [
  { id: 'EXP-001', date: new Date('2026-03-01'), title: 'Listrik & Air Pabrik', category: 'Biaya Utilitas', amount: 3500000, status: 'PAID' },
  { id: 'EXP-002', date: new Date('2026-03-02'), title: 'Bensin Operasional', category: 'Biaya Transportasi', amount: 450000, status: 'PAID' },
  { id: 'EXP-003', date: new Date('2026-03-05'), title: 'Iklan Instagram Ads', category: 'Biaya Marketing', amount: 1500000, status: 'PAID' },
  { id: 'EXP-004', date: new Date('2026-03-06'), title: 'Sewa Gudang Tahunan', category: 'Sewa', amount: 25000000, status: 'PENDING' },
]

type ExpenseType = (typeof mockExpenses)[0]
const ch = createColumnHelper<ExpenseType>()

const columns = [
  ch.accessor('id', { header: 'Ref ID', size: 100, cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.original.id}</span> }),
  ch.accessor('date', { header: 'Tanggal', size: 120, cell: ({ row }) => <span className="text-sm font-medium">{toDateTimeStamp(row.original.date.toISOString()).split(',')[0]}</span> }),
  ch.accessor('title', {
    header: 'Keterangan Biaya',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground/90">{row.original.title}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1"><TagIcon className="size-3" /> {row.original.category}</span>
      </div>
    ),
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      if (row.original.status === 'PAID') return <BadgeDot variant="success-outline">Sudah Dibayar</BadgeDot>
      return <BadgeDot variant="warning-outline">Draft / Tertunda</BadgeDot>
    },
  }),
  ch.accessor('amount', {
    header: 'Total Biaya',
    cell: ({ row }) => <span className="font-mono font-medium tracking-tight tabular-nums block text-right pr-4 text-foreground/90">Rp {row.original.amount.toLocaleString('id-ID')}</span>,
  }),
]

function FinanceExpensesPage() {
  const table = useDataTable({
    columns,
    data: mockExpenses,
    pageCount: 1,
    rowCount: mockExpenses.length,
    ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
  })

  return (
    <Page>
      <Page.BlockHeader
        title="Pengeluaran (Expenses)"
        description="Pencatatan biaya operasional perusahaan seperti utilitas, transportasi, hingga pemasaran."
      />
      <Page.Content className="flex flex-col gap-6">

        {/* Metric Cards Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Total Pengeluaran (Bulan Ini)</Card.Title>
              <FlameIcon className="h-4 w-4 text-rose-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-3xl font-bold font-mono tracking-tight text-rose-600">Rp 5.450.000</div>
              <p className="text-xs text-muted-foreground mt-1">Excludes Tertunda</p>
            </Card.Content>
          </Card>
        </div>

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 min-w-[300px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian Biaya</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari keterangan pengeluaran..." className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 sm:self-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">Aksi</label>
              <Button size="sm" className="h-10 shadow-md font-medium">
                <PlusIcon className="size-4 mr-2" /> Catat Pengeluaran
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
          <DataTableCard
            title="Riwayat Pengeluaran Operasional"
            table={table as any}
            isLoading={false}
            recordCount={mockExpenses.length}
          />
        </div>
      </Page.Content>
    </Page>
  )
}
