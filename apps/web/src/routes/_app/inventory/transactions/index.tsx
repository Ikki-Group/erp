import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { PlusIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import { CellCurrency, CellDate } from '@/components/reui/data-grid/data-grid-cell'
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

function RouteComponent() {
	const ds = useDataTableState()

	const { data, isLoading } = useQuery(
		stockTransactionApi.list.query({
			...ds.pagination,
			search: ds.search || undefined,
			locationId: undefined,
		}),
	)

	const columns: ColumnDef<StockTransactionSelectDto>[] = [
		{
			accessorKey: 'date',
			header: 'Tanggal',
			size: 130,
			cell: ({ row }) => <CellDate value={row.original.date} />,
		},
		{
			accessorKey: 'referenceNo',
			header: 'No Referensi',
			size: 150,
		},
		{
			accessorKey: 'type',
			header: 'Tipe',
			size: 110,
			cell: ({ row }) => {
				const typeStr = row.original.type
				const color =
					typeStr.includes('in') || typeStr === 'purchase'
						? 'success'
						: typeStr.includes('out') || typeStr === 'sell'
							? 'destructive'
							: 'secondary'

				const label = typeStr.replace('_', ' ').toUpperCase()
				return <Badge variant={color}>{label}</Badge>
			},
		},
		{
			accessorKey: 'materialName',
			header: 'Bahan Baku',
			size: 200,
			cell: ({ row }) => (
				<div className="flex flex-col gap-1">
					<span className="font-semibold text-foreground/90">{row.original.materialName}</span>
					<span className="text-[11px] font-mono text-muted-foreground/80 tracking-tight">
						SKU: {row.original.materialSku}
					</span>
				</div>
			),
		},
		{
			accessorKey: 'qty',
			header: 'Qty',
			size: 100,
			cell: ({ row }) => {
				const qty = row.original.qty
				const isOut = row.original.type === 'transfer_out' || row.original.type === 'sell'
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
		},
		{
			accessorKey: 'totalCost',
			header: 'Total Nilai',
			size: 150,
			cell: ({ row }) => <CellCurrency value={row.original.totalCost} />,
		},
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
