import { createFileRoute } from '@tanstack/react-router'
import { CheckCircleIcon, PlusIcon, ReceiptIcon, TimerIcon } from 'lucide-react'
import { toast } from 'sonner'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { SectionErrorBoundary } from '@/components/blocks/feedback/section-error-boundary'
import { createColumnHelper, dateColumn, statusColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
          if (status === 'completed') return <BadgeDot variant="success">Selesai</BadgeDot>
          if (status === 'open') return <BadgeDot variant="warning">Draf/Proses</BadgeDot>
          if (status === 'void') return <BadgeDot variant="destructive">Dibatalkan</BadgeDot>
          return <BadgeDot variant="secondary">{status}</BadgeDot>
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
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
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
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold font-mono tracking-tight">{data?.data.length ?? 0} GRN</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Total penerimaan</p>
            </Card.Content>
          </Card>
          <SectionErrorBoundary title="Statistik Menunggu">
            <Card className="border-muted/60 shadow-sm overflow-hidden">
              <Card.Header className="flex flex-row items-center justify-between pb-2 bg-amber-50/50 dark:bg-amber-950/20">
                <Card.Title className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                  Menunggu (Open)
                </Card.Title>
                <TimerIcon className="h-4 w-4 text-amber-500" />
              </Card.Header>
              <Card.Content>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold font-mono tracking-tight">
                    {data?.data.filter((d) => d.status === 'open').length ?? 0} GRN
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Siap untuk diverifikasi</p>
              </Card.Content>
            </Card>
          </SectionErrorBoundary>
          <SectionErrorBoundary title="Statistik Selesai">
            <Card className="border-muted/60 shadow-sm overflow-hidden">
              <Card.Header className="flex flex-row items-center justify-between pb-2 bg-emerald-50/50 dark:bg-emerald-950/20">
                <Card.Title className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                  Selesai (Completed)
                </Card.Title>
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
              </Card.Header>
              <Card.Content>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold font-mono tracking-tight">
                    {data?.data.filter((d) => d.status === 'completed').length ?? 0} GRN
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Stok telah diperbarui</p>
              </Card.Content>
            </Card>
          </SectionErrorBoundary>
        </div>

        <SectionErrorBoundary title="Tabel Penerimaan Barang">
          <DataTableCard
            title="Daftar Penerimaan Barang"
            table={table}
            isLoading={isLoading}
            recordCount={data?.meta.total ?? 0}
            toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari nomor GRN atau Ref...' }]} />}
            action={
              <Button size="sm" className="h-10 shadow-md font-medium">
                <PlusIcon className="size-4 mr-2" /> Terima Barang Baru
              </Button>
            }
          />
        </SectionErrorBoundary>
      </Page.Content>
    </Page>
  )
}
