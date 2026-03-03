import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowUpDownIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PackageIcon,
  SettingsIcon,
  Trash2Icon,
} from 'lucide-react'
import type { MaterialLocationStockDto } from '@/features/material'
import { materialLocationApi } from '@/features/material'
import { locationApi } from '@/features/location'
import { Page } from '@/components/layout/page'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataCombobox } from '@/components/ui/data-combobox'
import { MaterialLocationAssignDialog } from '@/features/material/components/material-location-assign-dialog'
import { MaterialLocationEditSheet } from '@/features/material/components/material-location-edit-sheet'
import { toastLabelMessage } from '@/lib/toast-message'

export const Route = createFileRoute('/_app/materials/stock')({
  component: RouteComponent,
})

function RouteComponent() {
  const [locationId, setLocationId] = useState<string | null>(null)
  const [locationName, setLocationName] = useState<string>('')

  return (
    <Page>
      <Page.BlockHeader
        title='Stok Bahan Baku'
        description='Kelola stok bahan baku per lokasi'
      />
      <Page.Content className='flex flex-col gap-4'>
        {/* Location Selector */}
        <div className='flex items-end gap-3'>
          <div className='flex flex-col gap-1.5 w-full max-w-sm'>
            <label className='text-sm font-medium'>Pilih Lokasi</label>
            <DataCombobox
              value={locationId}
              onValueChange={val => {
                setLocationId(val)
                // Reset name if cleared
                if (!val) setLocationName('')
              }}
              placeholder='Cari lokasi...'
              emptyText='Lokasi tidak ditemukan.'
              queryKey={['location-list']}
              queryFn={async (search: string) => {
                const res = await locationApi.list.fetch({
                  params: { page: 1, limit: 20, search: search || undefined },
                })
                return res.data
              }}
              getLabel={item => {
                // Set name for the assign dialog
                if (item.id === locationId) {
                  setLocationName(item.name)
                }
                return `${item.name} (${item.code})`
              }}
              getValue={item => item.id}
            />
          </div>
        </div>

        {/* Stock Table */}
        {locationId ? (
          <>
            <MaterialLocationAssignDialog.Root />
            <StockTable locationId={locationId} locationName={locationName} />
          </>
        ) : (
          <div className='flex flex-col items-center justify-center py-20 text-muted-foreground gap-3'>
            <MapPinIcon className='size-12 opacity-20' />
            <div className='text-center space-y-1'>
              <p className='font-medium text-foreground'>
                Pilih lokasi terlebih dahulu
              </p>
              <p className='text-sm'>
                Gunakan pencarian di atas untuk memilih lokasi dan melihat stok
                bahan baku
              </p>
            </div>
          </div>
        )}
      </Page.Content>
    </Page>
  )
}

/* ─────────── Stock Table ─────────── */

const ch = createColumnHelper<MaterialLocationStockDto>()

function StockTable({
  locationId,
  locationName,
}: {
  locationId: string
  locationName: string
}) {
  const queryClient = useQueryClient()
  const ds = useDataTableState()

  // Edit sheet state
  const [editSheet, setEditSheet] = useState<{
    open: boolean
    mode: 'config' | 'stock'
    data: MaterialLocationStockDto | null
  }>({ open: false, mode: 'config', data: null })

  const { data, isLoading } = useQuery(
    materialLocationApi.stock.query({
      locationId,
      ...ds.pagination,
      search: ds.search || undefined,
    })
  )

  const unassignMutation = useMutation({
    mutationFn: materialLocationApi.unassign.mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: materialLocationApi.stock.queryKey(undefined),
      })
    },
  })

  const handleUnassign = useCallback(
    async (row: MaterialLocationStockDto) => {
      const promise = unassignMutation.mutateAsync({
        params: {
          materialId: row.materialId,
          locationId: row.locationId,
        },
      })

      await toast
        .promise(promise, toastLabelMessage('delete', 'assign material'))
        .unwrap()
    },
    [unassignMutation]
  )

  const openEditSheet = useCallback(
    (mode: 'config' | 'stock', row: MaterialLocationStockDto) => {
      setEditSheet({ open: true, mode, data: row })
    },
    []
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
    ch.accessor('baseUom', {
      header: 'Satuan',
      cell: ({ row }) => (
        <Badge variant='secondary'>{row.original.baseUom}</Badge>
      ),
      enableSorting: false,
      size: 90,
    }),
    ch.accessor('stockStart', {
      header: 'Stok Awal',
      cell: ({ row }) => row.original.stockStart,
      enableSorting: false,
      size: 100,
    }),
    ch.accessor('stockPurchase', {
      header: 'Pembelian',
      cell: ({ row }) => (
        <span className='text-emerald-600 dark:text-emerald-400'>
          +{row.original.stockPurchase}
        </span>
      ),
      enableSorting: false,
      size: 100,
    }),
    ch.accessor('stockAdjustment', {
      header: 'Adjustment',
      cell: ({ row }) => {
        const val = row.original.stockAdjustment
        return (
          <span
            className={
              val >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            }
          >
            {val >= 0 ? '+' : ''}
            {val}
          </span>
        )
      },
      enableSorting: false,
      size: 110,
    }),
    ch.accessor('stockSell', {
      header: 'Penjualan',
      cell: ({ row }) => (
        <span className='text-rose-600 dark:text-rose-400'>
          -{row.original.stockSell}
        </span>
      ),
      enableSorting: false,
      size: 100,
    }),
    ch.accessor('stockEnd', {
      header: 'Stok Akhir',
      cell: ({ row }) => {
        const val = row.original.stockEnd
        const min = row.original.minStock
        const isLow = val <= min
        return (
          <div className='flex items-center gap-2'>
            <span
              className={
                isLow ? 'font-semibold text-destructive' : 'font-semibold'
              }
            >
              {val}
            </span>
            {isLow && (
              <Badge variant='destructive' className='text-[10px] h-4'>
                Low
              </Badge>
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 120,
    }),
    ch.display({
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant='ghost' size='icon-sm' />}
          >
            <MoreHorizontalIcon className='size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={() => openEditSheet('config', row.original)}
            >
              <SettingsIcon className='size-4 mr-2' />
              Konfigurasi Stok
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openEditSheet('stock', row.original)}
            >
              <ArrowUpDownIcon className='size-4 mr-2' />
              Update Stok
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onClick={() => handleUnassign(row.original)}
            >
              <Trash2Icon className='size-4 mr-2' />
              Unassign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
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
    <>
      <DataTableCard
        title='Stok Bahan Baku'
        table={table}
        isLoading={isLoading}
        recordCount={data?.meta.total || 0}
        action={
          <Button
            size='sm'
            onClick={() =>
              MaterialLocationAssignDialog.call({
                locationId,
                locationName,
              })
            }
          >
            <PackageIcon className='mr-2 size-4' />
            Assign Bahan Baku
          </Button>
        }
      />

      <MaterialLocationEditSheet
        open={editSheet.open}
        onOpenChange={open => setEditSheet(prev => ({ ...prev, open }))}
        mode={editSheet.mode}
        data={editSheet.data}
      />
    </>
  )
}
