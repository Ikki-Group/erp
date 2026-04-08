import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { DataTableCard } from '@/components/card/data-table-card'
import { Card } from '@/components/ui/card'
import { BadgeDot } from '@/components/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'
import { Building2Icon, PlusIcon, SearchIcon, ShieldAlertIcon, StarIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/procurement/suppliers')({ component: SuppliersPage })

// Mock Data
const mockSuppliers = [
  { id: 'SUP-001', name: 'PT. Sumber Pangan', products: 12, contact: '081234567891', rating: 4.8, status: 'active' },
  { id: 'SUP-002', name: 'CV. Sentosa Makmur', products: 4, contact: '085678901235', rating: 4.5, status: 'active' },
  { id: 'SUP-003', name: 'Toko Beras Jaya', products: 2, contact: '089012345679', rating: 4.2, status: 'inactive' },
  { id: 'SUP-004', name: 'PT. Aneka Plastik', products: 15, contact: '081298765433', rating: 4.9, status: 'active' },
]

type SupplierType = (typeof mockSuppliers)[0]
const ch = createColumnHelper<SupplierType>()

const columns = [
  ch.accessor('name', {
    header: 'Nama Pemasok',
    size: 200,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-foreground/90">{row.original.name}</span>
        <p className="text-[11px] text-muted-foreground font-mono tracking-tight">{row.original.id}</p>
      </div>
    ),
  }),
  ch.accessor('contact', { header: 'Kontak Utama', cell: ({ row }) => <span className="font-medium opacity-90">{row.original.contact}</span> }),
  ch.accessor('products', {
    header: 'Total Produk Supply',
    cell: ({ row }) => <span className="font-medium tabular-nums text-muted-foreground">{row.original.products} Item</span>,
  }),
  ch.accessor('rating', {
    header: 'Rating Vendor',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md w-fit">
        <StarIcon className="size-3.5 fill-current" />
        <span className="font-bold tabular-nums text-amber-700 text-xs">{row.original.rating}</span>
      </div>
    ),
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      return (
        <BadgeDot variant={row.original.status === 'active' ? 'success-outline' : 'default'}>
          {row.original.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
        </BadgeDot>
      )
    },
  }),
]

function SuppliersPage() {
  const table = useDataTable({
    columns,
    data: mockSuppliers,
    pageCount: 1,
    rowCount: mockSuppliers.length,
    ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
  })

  return (
    <Page>
      <Page.BlockHeader title="Data Supplier" description="Direktori kelola vendor bahan baku dan layanan operasional Anda." />
      <Page.Content className="flex flex-col gap-6">

        {/* Metric Cards Dashboard */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Total Mitra Pemasok</Card.Title>
              <Building2Icon className="h-4 w-4 text-emerald-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">24 Vendor</div>
              <p className="text-xs text-emerald-600 mt-1 flex items-center"><StarIcon className="size-3 mr-1 fill-current"/> Avg Rating: 4.6</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Pemasok Aktif</Card.Title>
              <ShieldAlertIcon className="h-4 w-4 text-blue-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold">18 Aktif</div>
              <p className="text-xs text-muted-foreground mt-1">Siap untuk digunakan pada PO</p>
            </Card.Content>
          </Card>
        </div>

        {/* Action & Filter Bar */}
        <Card className="rounded-2xl shadow-sm border-muted/60">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 min-w-[300px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pencarian Vendor</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari nama perusahaan atau ID..." className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 sm:self-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">Aksi</label>
              <Button size="sm" className="h-10 shadow-md font-medium">
                <PlusIcon className="size-4 mr-2" /> Tambah Supplier
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
          <DataTableCard
            title="Daftar Supplier"
            table={table as any}
            isLoading={false}
            recordCount={mockSuppliers.length}
          />
        </div>
      </Page.Content>
    </Page>
  )
}
