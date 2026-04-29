import { useCallback, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { MapPinIcon, MoreHorizontalIcon, PackageIcon, SettingsIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'
import { arrayToOptions } from '@/lib/utils'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ComboboxStatic } from '@/components/blocks/combobox-pattern'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { locationApi } from '@/features/location'
import type { MaterialLocationStockDto } from '@/features/material'
import { materialLocationApi } from '@/features/material'
import { MaterialLocationAssignDialog } from '@/features/material/components/material-location-assign-dialog'
import { MaterialLocationEditSheet } from '@/features/material/components/material-location-edit-sheet'

export const Route = createFileRoute('/_app/inventory/allocation')({ component: RouteComponent })

function RouteComponent() {
	const [locationId, setLocationId] = useState<number | undefined>()
	const [locationName, setLocationName] = useState<string>('')

	const locationQry = useQuery({
		...locationApi.list.query({}),
		select: (res) =>
			arrayToOptions({
				items: res.data,
				getValue: (i) => i.id,
				getLabel: (i) => i.name,
			}),
	})

	const numericLocationId = locationId ? Number(locationId) : null

	return (
		<Page>
			<Page.BlockHeader
				title="Alokasi Gudang"
				description="Kelola penugasan bahan baku per lokasi gudang"
			/>
			<Page.Content className="flex flex-col gap-4">
				{/* Location Selector */}
				<div className="flex items-end gap-3">
					<div className="flex flex-col gap-1.5 w-full max-w-sm">
						<label className="text-sm font-medium">Pilih Lokasi</label>
						<ComboboxStatic
							items={locationQry.data ?? []}
							value={locationId}
							onChange={setLocationId}
						/>
					</div>
				</div>

				{/* Stock Table */}
				{numericLocationId ? (
					<>
						<MaterialLocationAssignDialog.Root />
						<StockTable locationId={numericLocationId} locationName={locationName} />
					</>
				) : (
					<div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
						<MapPinIcon className="size-12 opacity-20" />
						<div className="text-center space-y-1">
							<p className="font-medium text-foreground">Pilih lokasi terlebih dahulu</p>
							<p className="text-sm">
								Gunakan pencarian di atas untuk memilih lokasi dan melihat stok bahan baku
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

/**
 * Renders a paginated stock table and actions for a specific location.
 *
 * Displays material inventory rows for the given location and provides UI to assign materials, open stock configuration, and unassign materials.
 */
function StockTable({ locationId, locationName }: { locationId: number; locationName: string }) {
	const ds = useDataTableState()

	// Edit sheet state (config only, stock updates use inventory transactions)
	const [editSheet, setEditSheet] = useState<{
		open: boolean
		data: MaterialLocationStockDto | null
	}>({
		open: false,
		data: null,
	})

	const { data, isLoading } = useQuery(
		materialLocationApi.stock.query({ locationId, ...ds.pagination, q: ds.search || undefined }),
	)

	const unassignMutation = useMutation({
		mutationFn: materialLocationApi.unassign.mutationFn,
	})

	const handleUnassign = useCallback(
		async (row: MaterialLocationStockDto) => {
			const promise = unassignMutation.mutateAsync({
				params: { materialId: row.materialId, locationId: row.locationId },
			})

			await toast.promise(promise, toastLabelMessage('delete', 'assign material')).unwrap()
		},
		[unassignMutation],
	)

	const columns = [
		ch.accessor('materialName', {
			header: 'Bahan Baku',
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">{row.original.materialName}</span>
					<span className="text-xs text-muted-foreground">SKU: {row.original.materialSku}</span>
				</div>
			),
			enableSorting: false,
		}),
		ch.accessor('uom', {
			header: 'Satuan',
			cell: ({ row }) => <Badge variant="secondary">{row.original.uom?.code ?? '-'}</Badge>,
			enableSorting: false,
			size: 90,
		}),

		ch.accessor('currentQty', {
			header: 'Stok Saat Ini',
			cell: ({ row }) => {
				const val = row.original.currentQty
				const min = row.original.minStock
				const isLow = val <= min
				return (
					<div className="flex items-center gap-2">
						<span className={isLow ? 'font-semibold text-destructive' : 'font-semibold'}>
							{val}
						</span>
						{isLow && (
							<Badge variant="destructive" className="text-[10px] h-4">
								Low
							</Badge>
						)}
					</div>
				)
			},
			enableSorting: false,
			size: 130,
		}),
		ch.accessor('currentAvgCost', {
			header: 'Harga Rata-rata',
			cell: ({ row }) => (
				<span className="tabular-nums">{row.original.currentAvgCost.toLocaleString('id-ID')}</span>
			),
			enableSorting: false,
			size: 140,
		}),
		ch.accessor('currentValue', {
			header: 'Nilai Stok',
			cell: ({ row }) => (
				<span className="tabular-nums font-medium">
					{row.original.currentValue.toLocaleString('id-ID')}
				</span>
			),
			enableSorting: false,
			size: 140,
		}),
		ch.display({
			id: 'action',
			header: '',
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
						<MoreHorizontalIcon className="size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setEditSheet({ open: true, data: row.original })}>
							<SettingsIcon className="size-4 mr-2" />
							Konfigurasi Stok
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onClick={() => handleUnassign(row.original)}>
							<Trash2Icon className="size-4 mr-2" />
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
				title="Stok Bahan Baku"
				table={table}
				isLoading={isLoading}
				recordCount={data?.meta.total ?? 0}
				action={
					<Button
						size="sm"
						onClick={() => MaterialLocationAssignDialog.call({ locationId, locationName })}
					>
						<PackageIcon className="mr-2 size-4" />
						Assign Bahan Baku
					</Button>
				}
			/>

			<MaterialLocationEditSheet
				open={editSheet.open}
				onOpenChange={(open) => setEditSheet((prev) => ({ ...prev, open }))}
				data={editSheet.data}
			/>
		</>
	)
}
