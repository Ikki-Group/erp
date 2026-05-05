import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { PlusIcon, Trash2Icon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import {
	CellDate,
	CellMenu,
	CellText,
	type CellMenuItem,
} from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import { recipeApi } from '@/features/recipe'
import type { RecipeSelectDto } from '@/features/recipe'

export const Route = createFileRoute('/_app/production/recipes')({ component: ProductionRecipes })

function getTargetLabel(recipe: RecipeSelectDto): string {
	if (recipe.productId) return `Produk #${recipe.productId}`
	if (recipe.productVariantId) return `Varian #${recipe.productVariantId}`
	if (recipe.materialId) return `Bahan #${recipe.materialId}`
	return 'Tidak ditargetkan'
}

function getColumns(
	onEdit: (r: RecipeSelectDto) => void,
	onRemove: (r: RecipeSelectDto) => Promise<void>,
): ColumnDef<RecipeSelectDto>[] {
	return [
		{
			accessorKey: 'id',
			header: 'No. Resep',
			size: 120,
			cell: ({ row }) => (
				<span className="font-medium font-mono">R{String(row.original.id).padStart(4, '0')}</span>
			),
		},
		{
			accessorKey: 'target',
			header: 'Target Output',
			size: 250,
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium">{getTargetLabel(row.original)}</span>
					<span className="text-xs text-muted-foreground">
						Qty Target: {row.original.targetQty}
					</span>
				</div>
			),
		},
		{
			accessorKey: 'items',
			header: 'Bahan',
			size: 100,
			cell: ({ row }) => (
				<Badge variant="outline" size="sm">
					{row.original.items?.length ?? 0} Item
				</Badge>
			),
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			size: 110,
			cell: ({ row }) =>
				row.original.isActive ? (
					<Badge variant="success" size="sm">
						Aktif
					</Badge>
				) : (
					<Badge variant="secondary" size="sm">
						Nonaktif
					</Badge>
				),
		},
		{
			accessorKey: 'instructions',
			header: 'Instruksi',
			size: 300,
			cell: ({ row }) => (
				<CellText
					value={row.original.instructions}
					className="text-sm text-muted-foreground truncate max-w-[280px]"
				/>
			),
		},
		{
			accessorKey: 'createdAt',
			header: 'Dibuat Pada',
			size: 160,
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
						icon: <PencilIcon className="size-4" />,
						onClick: () => onEdit(row.original),
					},
					{ type: 'separator' },
					{
						type: 'button',
						label: 'Hapus',
						variant: 'destructive',
						icon: <Trash2Icon className="size-4" />,
						onClick: () => onRemove(row.original),
					},
				]
				return <CellMenu items={items} label={`Aksi Resep ${row.original.id}`} />
			},
		},
	]
}

function ProductionRecipes() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(recipeApi.list.query({ ...ds.pagination, q: ds.search }))

	const deleteMutation = useMutation({ mutationFn: recipeApi.remove.mutationFn })

	const handleDelete = useCallback(
		async (recipe: RecipeSelectDto) => {
			await ConfirmDialog.call({
				title: 'Hapus Resep',
				description: `Apakah Anda yakin ingin menghapus resep R${String(recipe.id).padStart(4, '0')}? Data work order yang sudah terhubung tidak akan terpengaruh.`,
				variant: 'destructive',
				confirmLabel: 'Hapus Resep',
				confirmValidationText: `R${String(recipe.id).padStart(4, '0')}`,
				onConfirm: async () => {
					const promise = deleteMutation.mutateAsync({ params: { id: recipe.id } })
					await toast.promise(promise, toastLabelMessage('delete', 'resep')).unwrap()
				},
			})
		},
		[deleteMutation],
	)

	const handleEdit = useCallback((recipe: RecipeSelectDto) => {
		toast.info(`Edit resep R${String(recipe.id).padStart(4, '0')} (fitur form belum tersedia)`)
	}, [])

	const columns = useMemo(() => getColumns(handleEdit, handleDelete), [handleEdit, handleDelete])

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
				title="Resep & BOM"
				description="Kelola resep produksi (Bill of Materials) untuk barang setengah jadi dan jadi."
			/>
			<Page.Content>
				<DataTableCard
					title="Daftar Resep"
					table={table}
					isLoading={isLoading}
					recordCount={data?.meta.total ?? 0}
					toolbar={
						<DataGridFilter
							ds={ds}
							options={[
								{ type: 'search', placeholder: 'Cari resep...' },
								{
									type: 'select',
									key: 'isActive',
									placeholder: 'Semua Status',
									options: [
										{ label: 'Aktif', value: 'true' },
										{ label: 'Nonaktif', value: 'false' },
									],
								},
							]}
						/>
					}
					action={
						<Button size="sm" disabled>
							<PlusIcon className="mr-2 h-4 w-4" /> Tambah Resep
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
