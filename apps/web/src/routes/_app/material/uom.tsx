import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import { CellDate, CellMenu, type CellMenuItem } from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import type { UomDto } from '@/features/material'
import { uomApi } from '@/features/material'
import { UomFormDialog } from '@/features/material/components/uom-form-dialog'

export const Route = createFileRoute('/_app/material/uom')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Satuan Bahan Baku"
				description="Kelola Satuan (UOM) untuk bahan baku. Satuan ini akan digunakan dalam inventaris, resep, dan transaksi stok."
			/>
			<Page.Content>
				<UomFormDialog.Root />
				<UomTable />
			</Page.Content>
		</Page>
	)
}

function getColumns(onRemove: (uom: UomDto) => Promise<void>): ColumnDef<UomDto>[] {
	return [
		{
			accessorKey: 'code',
			header: 'Kode Satuan',
			size: 200,
			cell: ({ getValue }) => (
				<Badge variant="outline" size="sm" className="font-bold uppercase tracking-wider">
					{getValue()}
				</Badge>
			),
		},
		{
			accessorKey: 'createdAt',
			header: 'Dibuat Pada',
			size: 200,
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
				const items: CellMenuItem[] = [
					{
						type: 'button',
						label: 'Edit',
						icon: <PencilIcon />,
						onClick: () => {
							void UomFormDialog.upsert({ id: row.original.id })
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
				]
				return <CellMenu items={items} />
			},
		},
	]
}

function UomTable() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(uomApi.list.query({ ...ds.pagination, q: ds.search }))

	const deleteMutation = useMutation({
		mutationFn: uomApi.remove.mutationFn,
	})

	const handleDelete = async (uom: UomDto) => {
		await ConfirmDialog.call({
			title: 'Hapus Satuan',
			description: `Apakah Anda yakin ingin menghapus satuan "${uom.code}"? Satuan yang telah digunakan dalam transaksi atau resep mungkin tidak dapat dihapus.`,
			variant: 'destructive',
			confirmLabel: 'Hapus Satuan',
			confirmValidationText: uom.code,
			onConfirm: async () => {
				const promise = deleteMutation.mutateAsync({ params: { id: uom.id } })
				await toast.promise(promise, toastLabelMessage('delete', 'satuan')).unwrap()
			},
		})
	}

	const columns = useMemo(() => getColumns(handleDelete), [handleDelete])

	const table = useDataTable({
		columns: columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<DataTableCard
			title="Daftar Satuan"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari satuan...' }]} />
			}
			action={
				<Button
					size="sm"
					onClick={() => {
						void UomFormDialog.upsert({})
					}}
				>
					Tambah Satuan
				</Button>
			}
		/>
	)
}
