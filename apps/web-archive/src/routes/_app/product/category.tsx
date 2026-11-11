import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { FolderIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { CellDate, CellMenu } from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import type { ProductCategoryDto } from '@/features/product'
import { productCategoryApi } from '@/features/product'
import { ProductCategoryFormDialog } from '@/features/product/components/product-category-form-dialog'

export const Route = createFileRoute('/_app/product/category')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Kategori Produk"
				description="Kelola kategori produk untuk memudahkan pengorganisasian dan pencarian item menu."
			/>
			<Page.Content>
				<ProductCategoryFormDialog.Root />
				<CategoryTable />
			</Page.Content>
		</Page>
	)
}

interface GetColumnsProps {
	onRemove: (category: ProductCategoryDto) => Promise<void>
}

function getColumns({ onRemove }: GetColumnsProps): ColumnDef<ProductCategoryDto>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Kategori',
			size: 300,
			cell: ({ row }) => {
				const { name, description } = row.original
				return (
					<div className="flex gap-3 items-start py-0.5">
						<div className="mt-0.5 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
							<FolderIcon className="text-info size-4" />
						</div>
						<div className="flex flex-col gap-0.5 min-w-0">
							<p className="font-semibold text-foreground truncate">{name}</p>
							{description && (
								<p className="text-[11px] text-muted-foreground/80 truncate max-w-70">
									{description}
								</p>
							)}
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
				const { id, name } = row.original
				return (
					<CellMenu
						items={[
							{
								type: 'button',
								label: 'Edit',
								icon: <PencilIcon />,
								onClick: () => {
									void ProductCategoryFormDialog.upsert({ id })
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

function CategoryTable() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(
		productCategoryApi.list.query({ ...ds.pagination, q: ds.search }),
	)

	const remove = useMutation({
		mutationFn: productCategoryApi.remove.mutationFn,
	})

	const handleRemove = async (category: ProductCategoryDto) => {
		await ConfirmDialog.call({
			title: 'Hapus Kategori',
			description: `Apakah Anda yakin ingin menghapus kategori "${category.name}"? Tindakan ini tidak dapat dibatalkan.`,
			variant: 'destructive',
			confirmLabel: 'Hapus Kategori',
			confirmValidationText: category.name,
			onConfirm: async () => {
				await toast
					.promise(remove.mutateAsync({ params: { id: category.id } }), {
						...toastLabelMessage('delete', 'kategori'),
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
			title="Daftar Kategori Produk"
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
						void ProductCategoryFormDialog.upsert({})
					}}
				>
					Tambah Kategori
				</Button>
			}
		/>
	)
}
