import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import {
	actionColumn,
	createColumnHelper,
	dateColumn,
	linkColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { MaterialCategoryDto } from '@/features/material'
import { materialCategoryApi } from '@/features/material'
import { MaterialCategoryFormDialog } from '@/features/material/components/material-category-form-dialog'

const ch = createColumnHelper<MaterialCategoryDto>()

export const Route = createFileRoute('/_app/material/category')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page>
			<Page.BlockHeader
				title="Kategori Bahan Baku"
				description="Pengaturan kategori bahan baku untuk pengorganisasian inventaris dan klasifikasi produk yang lebih baik."
			/>
			<Page.Content>
				<MaterialCategoryFormDialog.Root />
				<CategoryTable />
			</Page.Content>
		</Page>
	)
}

function getColumns(handleDelete: (item: MaterialCategoryDto) => Promise<void>) {
	return [
		ch.accessor(
			'name',
			linkColumn({
				header: 'Kategori',
				render: (value, row) => (
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{value}</span>
						{row.description && (
							<span className="text-sm text-muted-foreground line-clamp-1">{row.description}</span>
						)}
					</div>
				),
				size: 400,
				enableSorting: false,
			}),
		),
		ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 180 })),
		actionColumn<MaterialCategoryDto>({
			id: 'action',
			size: 60,
			cell: ({ row }) => {
				return (
					<div className="flex items-center justify-end px-2">
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
								<MoreHorizontalIcon />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-36">
								<DropdownMenuItem
									onClick={() => {
										void MaterialCategoryFormDialog.upsert({ id: row.original.id })
									}}
								>
									<PencilIcon className="mr-2" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => void handleDelete(row.original)}
								>
									<Trash2Icon className="mr-2" />
									Hapus
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)
			},
		}),
	]
}

function CategoryTable() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(
		materialCategoryApi.list.query({ ...ds.pagination, q: ds.search }),
	)

	const deleteMutation = useMutation({
		mutationFn: materialCategoryApi.remove.mutationFn,
	})

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

	// oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
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
	)
}
