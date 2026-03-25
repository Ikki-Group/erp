import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'

import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { stockTransactionApi } from '@/features/inventory'
import { locationApi } from '@/features/location'
import { materialApi } from '@/features/material'

export const Route = createFileRoute('/_app/inventory/transactions/$id')({ component: RouteComponent })

function RouteComponent() {
  const { id } = Route.useParams()

  const { data, isLoading } = useQuery(stockTransactionApi.detail.query({ id: Number(id) }))

  const transaction = data?.data

  const { data: locationData } = useQuery({
    ...locationApi.detail.query({ id: transaction?.locationId ?? 0 }),
    enabled: !!transaction?.locationId,
  })

  const counterpartId = transaction?.counterpartLocationId
  const { data: counterpartLocationData } = useQuery({
    ...locationApi.detail.query({ id: counterpartId ?? 0 }),
    enabled: !!counterpartId,
  })

  const { data: materialData } = useQuery({
    ...materialApi.detail.query({ id: transaction?.materialId ?? 0 }),
    enabled: !!transaction?.materialId,
  })

  if (isLoading) {
    return (
      <Page>
        <Page.BlockHeader title="Detail Transaksi" back={{ to: '/inventory/transactions' }} />
        <Page.Content>Loading...</Page.Content>
      </Page>
    )
  }

  if (!transaction) {
    return (
      <Page>
        <Page.BlockHeader title="Detail Transaksi" back={{ to: '/inventory/transactions' }} />
        <Page.Content>Data transaksi tidak ditemukan.</Page.Content>
      </Page>
    )
  }

  const typeStr = transaction.type
  const color =
    typeStr.includes('in') || typeStr === 'purchase'
      ? 'success'
      : typeStr.includes('out') || typeStr === 'sell'
        ? 'destructive'
        : 'secondary'

  const label = typeStr.replace('_', ' ').toUpperCase()

  return (
    <Page>
      <Page.BlockHeader
        title={`Transaksi: ${transaction.referenceNo}`}
        description={`Mencatat mutasi bahan baku terpilih.`}
        back={{ to: '/inventory/transactions' }}
      />

      <Page.Content className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informasi Mutasi</span>
              <Badge variant={color as any} className="text-sm py-1">
                {label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Tanggal</span>
              <span className="font-medium">{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">No Referensi</span>
              <span className="font-medium">{transaction.referenceNo}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Lokasi Gudang</span>
              <span className="font-medium">{locationData?.data?.name || 'Memuat...'}</span>
            </div>
            {counterpartLocationData?.data && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Gudang Tujuan/Asal</span>
                <span className="font-medium">{counterpartLocationData?.data?.name}</span>
              </div>
            )}
          </CardContent>
          {transaction.notes && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Catatan</span>
                  <span className="text-sm">{transaction.notes}</span>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rincian Mutasi Nilai</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
              <div className="flex flex-col gap-1 px-2">
                <span className="text-xs text-muted-foreground">Bahan Baku</span>
                <span className="font-medium text-lg">{materialData?.data?.name || 'Memuat...'}</span>
                <span className="text-sm text-muted-foreground">SKU: {materialData?.data?.sku || '-'}</span>
              </div>

              <div className="flex flex-col gap-1 items-end px-2">
                <span className="text-xs text-muted-foreground">Kuantitas (Qty)</span>
                {(() => {
                  const qty = transaction.qty
                  const isOut = typeStr === 'transfer_out' || typeStr === 'sell'
                  const colorQty = isOut
                    ? 'text-rose-600 dark:text-rose-400'
                    : qty < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  return (
                    <span className={`font-bold text-2xl ${colorQty}`}>
                      {isOut && qty > 0 ? `-${qty}` : qty > 0 ? `+${qty}` : qty} {materialData?.data?.uom?.code}
                    </span>
                  )
                })()}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="flex flex-col gap-1 p-3 border rounded-md">
                <span className="text-xs text-muted-foreground">HPP / Unit</span>
                <span className="font-medium tabular-nums">Rp {transaction.unitCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 border rounded-md">
                <span className="text-xs text-muted-foreground">Total Nilai</span>
                <span className="font-medium tabular-nums">Rp {transaction.totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 border rounded-md md:col-start-3 bg-secondary/30">
                <span className="text-xs text-muted-foreground">Avg Cost (WAC)</span>
                <span className="font-medium tabular-nums">
                  Rp {transaction.runningAvgCost.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 border rounded-md bg-secondary/30">
                <span className="text-xs text-muted-foreground">Stok Akhir Transaksi</span>
                <span className="font-medium tabular-nums">
                  {transaction.runningQty} {materialData?.data?.uom?.code}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Page.Content>
    </Page>
  )
}
