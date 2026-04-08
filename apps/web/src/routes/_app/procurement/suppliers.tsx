import { createFileRoute } from '@tanstack/react-router'
import { Building2Icon, PlusIcon, ShieldAlertIcon, StarIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import {
  createColumnHelper,
  statusColumn,
  textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

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
  ch.accessor(
    'name',
    statusColumn({
      header: 'Nama Pemasok',
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground/90">{value}</span>
          <p className="text-[11px] text-muted-foreground font-mono tracking-tight">{row.id}</p>
        </div>
      ),
      size: 250,
    }),
  ),
  ch.accessor('contact', textColumn({ header: 'Kontak Utama', size: 180 })),
  ch.accessor(
    'products',
    statusColumn({
      header: 'Total Produk Supply',
      render: (value) => (
        <span className="font-medium tabular-nums text-muted-foreground">{value} Item</span>
      ),
      size: 150,
    }),
  ),
  ch.accessor(
    'rating',
    statusColumn({
      header: 'Rating Vendor',
      render: (value) => (
        <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md w-fit">
          <StarIcon className="size-3.5 fill-current" />
          <span className="font-bold tabular-nums text-amber-700 text-xs">{value}</span>
        </div>
      ),
      size: 130,
    }),
  ),
  ch.accessor(
    'status',
    statusColumn({
      header: 'Status',
      render: (value) => (
        <BadgeDot variant={value === 'active' ? 'success-outline' : 'default'}>
          {value === 'active' ? 'Aktif' : 'Tidak Aktif'}
        </BadgeDot>
      ),
      size: 130,
    }),
  ),
]

function SuppliersPage() {
  const ds = useDataTableState()
  const table = useDataTable({
    columns,
    data: mockSuppliers,
    pageCount: 1,
    rowCount: mockSuppliers.length,
    ds,
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

        <DataTableCard
          title="Daftar Supplier"
          table={table}
          isLoading={false}
          recordCount={mockSuppliers.length}
          toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari supplier...' }]} />}
          action={
            <Button size="sm" className="h-10 shadow-md font-medium">
              <PlusIcon className="size-4 mr-2" /> Tambah Supplier
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
