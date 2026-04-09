import { createFileRoute } from '@tanstack/react-router'
import { CheckCircleIcon, PackageIcon, PlusIcon, ReceiptIcon } from 'lucide-react'
import { toast } from 'sonner'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { createColumnHelper, dateColumn, statusColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { goodsReceiptApi } from '@/features/purchasing/api/purchasing.api'
import { GoodsReceiptNoteDto } from '@/features/purchasing/dto/goods-receipt.dto'
import { useMutation, useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/_app/procurement/receipts')({ component: GoodsReceiptPage })

const ch = createColumnHelper<GoodsReceiptNoteDto>()

function GoodsReceiptPage() {
  const ds = useDataTableState()
  const { data, isLoading, refetch } = useQuery(
    goodsReceiptApi.list.query({ ...ds.filters, q: ds.search, ...ds.pagination }),
  )

  const completeMutation = useMutation({
    mutationFn: goodsReceiptApi.complete.mutationFn,
    onSuccess: () => {
      toast.success('Penerimaan barang diselesaikan. Stok inventori telah diperbarui.')
      refetch()
    },
  })

  const columns = [
    ch.accessor('id', textColumn({ header: 'No. Penerimaan', size: 140 })),
    ch.accessor('referenceNumber', textColumn({ header: 'Ref/Surat Jalan', size: 180 })),
    ch.accessor('receiveDate', dateColumn({ header: 'Tanggal Terima', size: 160 })),
    ch.accessor(
      'status',
      statusColumn({
        header: 'Status',
        render: (value) => {
          const status = value as string
          if (status === 'completed') return <BadgeDot variant="success-outline">Selesai</BadgeDot>
          if (status === 'open') return <BadgeDot variant="warning-outline">Draf/Proses</BadgeDot>
          if (status === 'void') return <BadgeDot variant="destructive-outline">Dibatalkan</BadgeDot>
          return <BadgeDot variant="secondary-outline">{status}</BadgeDot>
        },
        size: 130,
      }),
    ),
    ch.display({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const grn = row.original
        if (grn.status === 'open') {
          return (
            <Button
              size="xs"
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => completeMutation.mutate({ params: { id: grn.id } })}
              disabled={completeMutation.isPending}
            >
              <CheckCircleIcon className="size-3 mr-1" /> Selesaikan
            </Button>
          )
        }
        return null
      },
      size: 150,
    }),
  ]

  const table = useDataTable({
    columns,
    data: (data?.data ?? []) as any[],
    pageCount: data?.meta.pageCount ?? 0,
    rowCount: data?.meta.totalCount ?? 0,
    ds,
  })

  return (
    <Page>
      <Page.BlockHeader
        title="Penerimaan Barang (GRN)"
        description="Pantau dan verifikasi barang yang diterima dari Supplier sebelum masuk ke stok gudang."
      />
      <Page.Content className="flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Total Penerimaan</Card.Title>
              <ReceiptIcon className="h-4 w-4 text-emerald-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold font-mono tracking-tight">{data?.meta.totalCount ?? 0} Transaksi</div>
              <p className="text-xs text-muted-foreground mt-1">Bulan Ini</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Menunggu Verifikasi</Card.Title>
              <PackageIcon className="h-4 w-4 text-amber-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold font-mono tracking-tight">
                {data?.data.filter((d: any) => d.status === 'open').length ?? 0} GRN
              </div>
              <p className="text-xs text-muted-foreground mt-1">Stok belum bertambah</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <Card.Title className="text-sm font-medium text-muted-foreground">Log Aktivitas</Card.Title>
              <ReceiptIcon className="h-4 w-4 text-blue-500" />
            </Card.Header>
            <Card.Content>
              <div className="text-2xl font-bold font-mono tracking-tight">--</div>
              <p className="text-xs text-muted-foreground mt-1">Verifikasi terakhir: Hari ini</p>
            </Card.Content>
          </Card>
        </div>

        <DataTableCard
          title="Daftar Penerimaan Barang"
          table={table}
          isLoading={isLoading}
          recordCount={data?.meta.totalCount ?? 0}
          toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari nomor GRN atau Ref...' }]} />}
          action={
            <Button size="sm" className="h-10 shadow-md font-medium">
              <PlusIcon className="size-4 mr-2" /> Terima Barang Baru
            </Button>
          }
        />
      </Page.Content>
    </Page>
  )
}
