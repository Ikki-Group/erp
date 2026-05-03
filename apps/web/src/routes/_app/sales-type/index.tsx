import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { PencilIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { CellDate, CellText } from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import type { SalesTypeDto } from '@/features/sales-type'
import { salesTypeApi } from '@/features/sales-type'
import { SalesTypeFormDialog } from '@/features/sales-type'

export const Route = createFileRoute('/_app/sales-type/')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Jenis Penjualan"
				description="Pengaturan jenis penjualan untuk mengklasifikasikan transaksi dan pelaporan pendapatan."
			/>
			<Page.Content>
				<SalesTypeFormDialog.Root />
				<SalesTypeTable />
			</Page.Content>
		</Page>
	)
}

const columns: ColumnDef<SalesTypeDto>[] = [
	{
		accessorKey: 'code',
		header: 'Kode',
		size: 120,
		cell: ({ row }) => <CellText value={row.original.code} />,
	},
	{
		accessorKey: 'name',
		header: 'Jenis Penjualan',
		size: 300,
		cell: ({ row }) => (
			<div className="flex flex-col gap-1 py-1">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-sm tracking-tight">{row.original.name}</span>
					{row.original.isSystem && (
						<span className="px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tighter leading-none">
							System
						</span>
					)}
				</div>
			</div>
		),
	},
	{
		accessorKey: 'createdAt',
		header: 'Dibuat Pada',
		size: 180,
		cell: ({ row }) => <CellDate value={row.original.createdAt} />,
	},
	{
		id: 'action',
		header: '',
		size: 60,
		enableSorting: false,
		enableHiding: false,
		enableResizing: false,
		enablePinning: true,
		cell: ({ row }) => {
			if (row.original.isSystem) return null
			return (
				<div className="flex items-center justify-end px-2">
					<Button
						variant="ghost"
						size="icon-sm"
						className="size-8 text-muted-foreground hover:text-foreground"
						onClick={() => {
							void SalesTypeFormDialog.upsert({ id: row.original.id })
						}}
					>
						<PencilIcon className="size-4" />
					</Button>
				</div>
			)
		},
	},
]

function SalesTypeTable() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(salesTypeApi.list.query({ ...ds.pagination, q: ds.search }))

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<DataTableCard
			title="Daftar Jenis Penjualan"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter
					ds={ds}
					options={[{ type: 'search', placeholder: 'Cari jenis penjualan...' }]}
				/>
			}
			action={
				<Button
					size="sm"
					onClick={() => {
						void SalesTypeFormDialog.upsert({})
					}}
				>
					Tambah Tipe
				</Button>
			}
		/>
	)
}
