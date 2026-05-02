import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { PlusIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import {
	createColumnHelper,
	currencyColumn,
	dateColumn,
	customColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import type { StockTransactionSelectDto } from '@/features/inventory'
import { stockTransactionApi } from '@/features/inventory'

export const Route = createFileRoute('/_app/inventory/transactions/')({ component: RouteComponent })

const ch = createColumnHelper<StockTransactionSelectDto>()

function RouteComponent() {
	const ds = useDataTableState()

	const { data, isLoading } = useQuery(
		stockTransactionApi.list.query({
			...ds.pagination,
			search: ds.search || undefined,
			locationId: undefined,
		}),
	)

	const columns = [
		ch.accessor('date', dateColumn({ header: 'Tanggal', size: 130 })),
		ch.accessor('referenceNo', textColumn({ header: 'No Referensi', size: 150 })),
		ch.accessor(
			'type',
			customColumn({
				header: 'Tipe',
				cell: (value) => {
					const typeStr = value as string
					const color =
						typeStr.includes('in') || typeStr === 'purchase'
							? 'success'
							: typeStr.includes('out') || typeStr === 'sell'
								? 'destructive'
								: 'secondary'

					const label = typeStr.replace('_', ' ').toUpperCase()
					return <Badge variant={color}>{label}</Badge>
				},
				size: 110,
			}),
		),
		ch.accessor(
			'materialName',
			customColumn({
				header: 'Bahan Baku',
				cell: (value, row) => (
					<div className="flex flex-col gap-1">
						<span className="font-semibold text-foreground/90">{value}</span>
						<span className="text-[11px] font-mono text-muted-foreground/80 tracking-tight">
							SKU: {row.materialSku}
						</span>
					</div>
				),
				size: 200,
			}),
		),
		ch.accessor(
			'qty',
			customColumn({
				header: 'Qty',
				cell: (value, row) => {
					const qty = Number(value)
					const isOut = row.type === 'transfer_out' || row.type === 'sell'
					const color = isOut || qty < 0 ? 'destructive-light' : 'success-light'

					return (
						<Badge
							variant={color}
							className="font-semibold tabular-nums px-2 shadow-none border-transparent"
						>
							{isOut && qty > 0 ? `-${qty}` : qty > 0 ? `+${qty}` : qty}
						</Badge>
					)
				},
				size: 100,
			}),
		),
		ch.accessor('totalCost', currencyColumn({ header: 'Total Nilai', size: 150 })),
	]

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Riwayat Mutasi & Transaksi"
				description="Pantau seluruh pergerakan barang (masuk, keluar, transfer, dan opname/penyesuaian)."
			/>
			<Page.Content className="flex flex-col gap-6">
				<DataTableCard
					title="Daftar Mutasi Terkini"
					table={table}
					isLoading={isLoading}
					recordCount={data?.meta.total ?? 0}
					toolbar={
						<DataGridFilter
							ds={ds}
							options={[{ type: 'search', placeholder: 'Cari nomor pelacakan atau bahan...' }]}
						/>
					}
					action={
						<div className="flex items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger
									render={<Button size="sm" className="h-10 shadow-md font-medium" />}
								>
									<PlusIcon className="size-4 mr-2" /> Catat Transaksi
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuLabel>Penerimaan Barang</DropdownMenuLabel>
									<DropdownMenuItem
										nativeButton={false}
										render={
											<Link
												to="/inventory/transactions/purchase"
												className="flex items-center w-full"
											/>
										}
									>
										Pembelian
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuLabel>Pengeluaran Barang</DropdownMenuLabel>
									<DropdownMenuItem
										nativeButton={false}
										render={
											<Link
												to="/inventory/transactions/usage"
												className="flex items-center w-full"
											/>
										}
									>
										Pemakaian / Konsumsi
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuLabel>Mutasi & Stok Fisik</DropdownMenuLabel>
									<DropdownMenuItem
										nativeButton={false}
										render={
											<Link
												to="/inventory/transactions/transfer"
												className="flex items-center w-full"
											/>
										}
									>
										Mutasi Internal (Transfer)
									</DropdownMenuItem>
									<DropdownMenuItem
										nativeButton={false}
										render={
											<Link
												to="/inventory/transactions/opname"
												className="flex items-center w-full"
											/>
										}
									>
										Stock Opname
									</DropdownMenuItem>
									<DropdownMenuItem
										nativeButton={false}
										render={
											<Link
												to="/inventory/transactions/adjustment"
												className="flex items-center w-full"
											/>
										}
									>
										Koreksi / Adjustment
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					}
				/>
			</Page.Content>
		</Page>
	)
}
