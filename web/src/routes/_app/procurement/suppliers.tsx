import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { useDataTable } from '@/hooks/use-data-table'

export const Route = createFileRoute('/_app/procurement/suppliers')({
  component: SuppliersPage,
})

// Mock Data
const mockSuppliers = [
  {
    id: 'SUP-001',
    name: 'PT. Sumber Pangan',
    products: 12,
    contact: '081234567891',
    rating: 4.8,
    status: 'active',
  },
  {
    id: 'SUP-002',
    name: 'CV. Sentosa Makmur',
    products: 4,
    contact: '085678901235',
    rating: 4.5,
    status: 'active',
  },
  {
    id: 'SUP-003',
    name: 'Toko Beras Jaya',
    products: 2,
    contact: '089012345679',
    rating: 4.2,
    status: 'inactive',
  },
  {
    id: 'SUP-004',
    name: 'PT. Aneka Plastik',
    products: 15,
    contact: '081298765433',
    rating: 4.9,
    status: 'active',
  },
]

type SupplierType = (typeof mockSuppliers)[0]
const ch = createColumnHelper<SupplierType>()

const columns = [
  ch.accessor('name', {
    header: 'Nama Pemasok',
    cell: ({ row }) => (
      <div>
        <span className='font-medium'>{row.original.name}</span>
        <p className='text-muted-foreground text-xs font-mono'>
          {row.original.id}
        </p>
      </div>
    ),
  }),
  ch.accessor('contact', {
    header: 'Kontak Utama',
  }),
  ch.accessor('products', {
    header: 'Total Produk Supply',
    cell: ({ row }) => (
      <span className='font-medium text-right block pr-4'>
        {row.original.products} Item
      </span>
    ),
  }),
  ch.accessor('rating', {
    header: 'Rating Vendor',
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.rating} / 5.0</span>
    ),
  }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      return (
        <BadgeDot
          variant={
            row.original.status === 'active' ? 'success-outline' : 'default'
          }
        >
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
    ds: {
      pagination: { limit: 10, page: 1 },
      search: '',
      filters: {},
    } as any,
  })

  return (
    <Page>
      <Page.BlockHeader
        title='Data Supplier'
        description='Direktori kelola vendor bahan baku / barang masuk Anda.'
      />
      <Page.Content>
        <DataTableCard
          title='Daftar Supplier'
          table={table as any}
          isLoading={false}
          recordCount={mockSuppliers.length}
          action={
            <Button size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' /> Tambah Supplier
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
