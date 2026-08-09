import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, MapPinIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchToolbar } from '@/components/shared/search-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

import { categoryResource, materialResource } from '@/features/material/api.ts'
import { CategoryForm } from '@/features/material/components/category-form.tsx'
import { LocationAssignment } from '@/features/material/components/location-assignment.tsx'
import { MaterialForm } from '@/features/material/components/material-form.tsx'
import { MATERIAL_TYPE_OPTIONS } from '@/features/material/dto/index.ts'

import type { CategoryFormRef } from '@/features/material/components/category-form.tsx'
import type { MaterialFormRef } from '@/features/material/components/material-form.tsx'
import type { MaterialCategoryDto, MaterialDto, MaterialTypeEnum } from '@/features/material/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/materials')({
	component: MaterialsPage,
})

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, MaterialDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 100,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('type', {
		header: 'Type',
		size: 120,
		cell: ({ getValue }) => {
			const type = getValue()
			const label = MATERIAL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
			return <Badge variant="secondary">{label}</Badge>
		},
	}),
	col.accessor('isActive', {
		header: 'Status',
		size: 80,
		cell: ({ getValue }) => (
			<Badge variant={getValue() ? 'default' : 'outline'}>
				{getValue() ? 'Active' : 'Inactive'}
			</Badge>
		),
	}),
]

// ─── Page Component ───

function MaterialsPage() {
	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
		categoryId: undefined as number | undefined,
	})

	const listQuery = useQuery(materialResource.list.queryOptions(listParams))
	const categoriesQuery = useQuery(categoryResource.list.queryOptions({ page: 1, limit: 100 }))

	const createMut = useMutation(materialResource.create.mutationOptions())
	const updateMut = useMutation(materialResource.update.mutationOptions())
	const removeMut = useMutation(materialResource.remove.mutationOptions())
	const catCreateMut = useMutation(categoryResource.create.mutationOptions())
	const catUpdateMut = useMutation(categoryResource.update.mutationOptions())
	const catRemoveMut = useMutation(categoryResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const categories = categoriesQuery.data?.data ?? []

	// ─── Material Handlers ───

	const handleCreate = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<MaterialFormRef | null>

		const saved = await formDialog({
			title: 'Add Material',
			description: 'Create a new material.',
			submitLabel: 'Create',
			content: (
				<MaterialForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const v = formRef.current!.getValues()
				await createMut.mutateAsync({
					code: v.code,
					name: v.name,
					type: v.type as MaterialTypeEnum,
					categoryId: v.categoryId ? Number(v.categoryId) : null,
					baseUomId: Number(v.baseUomId),
					defaultPurchaseUomId: v.defaultPurchaseUomId ? Number(v.defaultPurchaseUomId) : null,
					defaultStockUomId: v.defaultStockUomId ? Number(v.defaultStockUomId) : null,
					defaultRecipeUomId: v.defaultRecipeUomId ? Number(v.defaultRecipeUomId) : null,
					minStock: v.minStock || null,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Material created successfully.', type: 'success' })
		}
	}, [createMut])

	const handleEdit = useCallback(
		async (material: MaterialDto) => {
			const formRef = { current: null } as React.MutableRefObject<MaterialFormRef | null>

			const saved = await formDialog({
				title: 'Edit Material',
				description: `Update details for ${material.name}.`,
				submitLabel: 'Save Changes',
				content: (
					<MaterialForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={material}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const v = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: material.id,
						code: v.code,
						name: v.name,
						type: v.type as MaterialTypeEnum,
						categoryId: v.categoryId ? Number(v.categoryId) : null,
						baseUomId: Number(v.baseUomId),
						defaultPurchaseUomId: v.defaultPurchaseUomId ? Number(v.defaultPurchaseUomId) : null,
						defaultStockUomId: v.defaultStockUomId ? Number(v.defaultStockUomId) : null,
						defaultRecipeUomId: v.defaultRecipeUomId ? Number(v.defaultRecipeUomId) : null,
						minStock: v.minStock || null,
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Material updated successfully.', type: 'success' })
			}
		},
		[updateMut],
	)

	const handleDelete = useCallback(
		async (material: MaterialDto) => {
			await confirm({
				title: 'Delete material?',
				description: `This will permanently delete "${material.name}" (${material.code}). This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: material.id })
					toast.add({ title: 'Material deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	const handleLocations = useCallback(async (material: MaterialDto) => {
		await formDialog({
			title: 'Location Assignment',
			description: `Manage locations for ${material.name}.`,
			submitLabel: 'Done',
			content: <LocationAssignment materialId={material.id} />,
			onSubmit: async () => {},
		})
	}, [])

	// ─── Category Handlers ───

	const handleCreateCategory = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<CategoryFormRef | null>

		const saved = await formDialog({
			title: 'Add Category',
			description: 'Create a new material category.',
			submitLabel: 'Create',
			content: (
				<CategoryForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const v = formRef.current!.getValues()
				await catCreateMut.mutateAsync({ name: v.name })
			},
		})

		if (saved) {
			toast.add({ title: 'Category created successfully.', type: 'success' })
		}
	}, [catCreateMut])

	const handleEditCategory = useCallback(
		async (category: MaterialCategoryDto) => {
			const formRef = { current: null } as React.MutableRefObject<CategoryFormRef | null>

			const saved = await formDialog({
				title: 'Edit Category',
				description: `Update "${category.name}".`,
				submitLabel: 'Save Changes',
				content: (
					<CategoryForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={category}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const v = formRef.current!.getValues()
					await catUpdateMut.mutateAsync({ id: category.id, name: v.name })
				},
			})

			if (saved) {
				toast.add({ title: 'Category updated successfully.', type: 'success' })
			}
		},
		[catUpdateMut],
	)

	const handleDeleteCategory = useCallback(
		async (category: MaterialCategoryDto) => {
			await confirm({
				title: 'Delete category?',
				description: `This will permanently delete "${category.name}". This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await catRemoveMut.mutateAsync({ id: category.id })
					toast.add({ title: 'Category deleted successfully.', type: 'success' })
				},
			})
		},
		[catRemoveMut],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => (
				<ActionMenu
					items={[
						{
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () => handleEdit(row.original),
						},
						{
							label: 'Locations',
							icon: <MapPinIcon className="size-4" />,
							onClick: () => handleLocations(row.original),
						},
						{
							label: 'Delete',
							icon: <TrashIcon className="size-4" />,
							onClick: () => handleDelete(row.original),
							variant: 'destructive' as const,
						},
					]}
				/>
			),
		})
	}, [handleEdit, handleDelete, handleLocations])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, MaterialDto>[],
		[actionsColumn],
	)

	const { table, globalFilter, setGlobalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		pageSize: listParams.limit,
		onStateChange: (params) => {
			setListParams((prev) => ({
				...prev,
				page: params.page + 1,
				limit: params.pageSize,
				q: params.search || undefined,
			}))
		},
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter && !listParams.categoryId

	return (
		<div className="space-y-6">
			<PageHeader
				title="Materials"
				description="Manage materials, categories, and location assignments."
				actions={
					<div className="flex gap-2">
						<Button size="sm" variant="outline" onClick={handleCreateCategory}>
							<TagIcon className="size-4" />
							Add Category
						</Button>
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Material
						</Button>
					</div>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No materials yet"
					description="Get started by creating your first material."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Material
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No materials match your filters."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search materials..."
							actions={
								<Select
									value={listParams.categoryId?.toString() ?? 'all'}
									onValueChange={(v) =>
										setListParams((prev) => ({
											...prev,
											page: 1,
											categoryId: v === 'all' ? undefined : Number(v),
										}))
									}
								>
									<SelectTrigger className="w-[160px]">
										<SelectValue placeholder="All categories" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All categories</SelectItem>
										{categories.map((cat) => (
											<SelectItem key={cat.id} value={cat.id.toString()}>
												{cat.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							}
						/>
					}
				/>
			)}

			{categories.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Categories</h3>
					<div className="divide-y rounded-md border">
						{categories.map((cat) => (
							<div key={cat.id} className="flex items-center justify-between px-4 py-3">
								<span className="text-sm font-medium">{cat.name}</span>
								<div className="flex gap-1">
									<Button
										size="icon"
										variant="ghost"
										className="size-7"
										onClick={() => handleEditCategory(cat)}
									>
										<EditIcon className="size-3.5" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										className="size-7"
										onClick={() => handleDeleteCategory(cat)}
									>
										<TrashIcon className="size-3.5" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
