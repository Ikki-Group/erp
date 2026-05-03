import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { CellDate, CellMenu, type CellMenuItem } from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import type { MaterialCategoryDto } from '../dto'
import { materialCategoryApi } from '../api'
import { MaterialCategoryFormDialog } from '../components/material-category-form-dialog'

function getColumns(
	onRemove: (item: MaterialCategoryDto) => Promise<void>,
): ColumnDef<MaterialCategoryDto>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Kategori',
			size: 400,
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium">{row.original.name}</span>
					{row.original.description && (
						<span className="text-sm text-muted-foreground line-clamp-1">
							{row.original.description}
						</span>
					)}
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
				const items: CellMenuItem[] = [
					{
						type: 'button',
						label: 'Edit',
						icon: <PencilIcon />,
						onClick: () => {
							void MaterialCategoryFormDialog.upsert({ id: row.original.id })
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

export function CategoryListPage() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(
		materialCategoryApi.list.query({ ...ds.pagination, q: ds.search }),
	)

	const deleteMutation = useMutation({ mutationFn: materialCategoryApi.remove.mutationFn })

	const handleDelete = async (item: MaterialCategoryDto) => {
		await ConfirmDialog.call({
			title: 'Hapus Kategori',
			description: `Apakah Anda yakin ingin menghapus kategori "${item.name}"? Menghapus kategori dapat mempengaruhi pengelompokan bahan baku yang terkait.`,
			variant: 'destructive',
			confirmLabel: 'Hapus Kategori',
			confirmValidationText: item.name,
			onConfirm: async () => {
				const promise = deleteMutation.mutateAsync({ params: { id: item.id } })
				await toast.promise(promise, toastLabelMessage('delete', 'kategori')).unwrap()
			},
		})
	}

	const columns = useMemo(() => getColumns(handleDelete), [handleDelete])

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
				title="Kategori Bahan Baku"
				description="Pengaturan kategori bahan baku untuk pengorganisasian inventaris dan klasifikasi produk yang lebih baik."
			/>
			<Page.Content>
				<MaterialCategoryFormDialog.Root />
				<DataTableCard
					title="Daftar Kategori"
					table={table}
					isLoading={isLoading}
					recordCount={data?.meta.total ?? 0}
					toolbar={
						<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari kategori...' }]} />
					}
					action={
						<Button
							size="sm"
							onClick={() => {
								void MaterialCategoryFormDialog.upsert({})
							}}
						>
							Tambah Kategori
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
