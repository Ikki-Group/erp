import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { DollarSignIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import { CellDate, CellMenu } from '@/components/reui/data-grid/data-grid-cell'
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

interface GetColumnsProps {
	onRemove: (salesType: SalesTypeDto) => Promise<void>
}

function getColumns({ onRemove }: GetColumnsProps): ColumnDef<SalesTypeDto>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Jenis Penjualan',
			size: 350,
			cell: ({ row }) => {
				const { name, code, isSystem } = row.original
				return (
					<div className="flex gap-3 items-start py-0.5">
						<div className="mt-0.5 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
							<DollarSignIcon className="text-success size-4" />
						</div>
						<div className="flex flex-col gap-0.5 min-w-0">
							<div className="flex items-center gap-2">
								<p className="font-semibold text-foreground truncate">{name}</p>
								{isSystem && (
									<Badge variant="info-outline" size="sm" className="font-medium">
										System
									</Badge>
								)}
							</div>
							<span className="text-[10px] font-mono text-muted-foreground bg-muted hover:bg-muted-foreground/10 px-1.5 py-0.5 rounded uppercase tracking-wider transition-colors">
								{code}
							</span>
						</div>
					</div>
				)
			},
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
				const { id, isSystem } = row.original
				if (isSystem) return null
				return (
					<CellMenu
						items={[
							{
								type: 'button',
								label: 'Edit',
								icon: <PencilIcon />,
								onClick: () => {
									void SalesTypeFormDialog.upsert({ id })
								},
							},
							{
								type: 'separator',
							},
							{
								type: 'button',
								label: 'Hapus',
								variant: 'destructive',
								icon: <Trash2Icon />,
								onClick: () => onRemove(row.original),
							},
						]}
					/>
				)
			},
		},
	]
}

function SalesTypeTable() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(salesTypeApi.list.query({ ...ds.pagination, q: ds.search }))

	const remove = useMutation({
		mutationFn: salesTypeApi.remove.mutationFn,
	})

	const handleRemove = async (salesType: SalesTypeDto) => {
		await ConfirmDialog.call({
			title: 'Hapus Jenis Penjualan',
			description: `Apakah Anda yakin ingin menghapus jenis penjualan "${salesType.name}"? Tindakan ini tidak dapat dibatalkan.`,
			variant: 'destructive',
			confirmLabel: 'Hapus Jenis Penjualan',
			confirmValidationText: salesType.name,
			onConfirm: async () => {
				await toast
					.promise(remove.mutateAsync({ body: { id: salesType.id } }), {
						...toastLabelMessage('delete', 'jenis penjualan'),
					})
					.unwrap()
			},
		})
	}

	const columns = useMemo(() => getColumns({ onRemove: handleRemove }), [handleRemove])

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
