import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, MapPinIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { FormDialogFooter } from '@/lib/form/index.ts'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { categoryResource, materialResource } from '@/features/material/api.ts'
import {
	CategoryFormFields,
	useCategoryForm,
} from '@/features/material/components/category-form.tsx'
import { LocationAssignment } from '@/features/material/components/location-assignment.tsx'
import { MATERIAL_TYPE_OPTIONS } from '@/features/material/dto/index.ts'
import type { MaterialCategoryDto, MaterialDto } from '@/features/material/dto/index.ts'

const materialsSearchSchema = listSearchSchema.extend({
	categoryId: z.coerce.number().int().positive().optional(),
})

export const Route = createFileRoute('/_authenticated/master/materials/')({
	validateSearch: materialsSearchSchema,
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
			<StatusBadge variant={getValue() ? 'success' : 'outline'}>
				{getValue() ? 'Active' : 'Inactive'}
			</StatusBadge>
		),
	}),
]

// ─── Category Quick-Add Dialog ───
// Categories stay a dialog: one field, no reason to leave the list page.
// Materials themselves are full-page forms — see `materials.new.tsx` and
// `materials.$materialId.tsx`.

function CategoryDialogBody({
	close,
	defaultValues,
}: {
	close: (result?: boolean) => void
	defaultValues?: MaterialCategoryDto
}) {
	const createMut = useMutation(categoryResource.create.mutationOptions())
	const updateMut = useMutation(categoryResource.update.mutationOptions())

	const form = useCategoryForm({
		defaultValues,
		onSubmit: async (values) => {
			if (defaultValues) {
				await updateMut.mutateAsync({ id: defaultValues.id, name: values.name })
			} else {
				await createMut.mutateAsync({ name: values.name })
			}
			close(true)
		},
	})

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<CategoryFormFields form={form} />
			<FormDialogFooter
				onCancel={() => close(false)}
				submitLabel={defaultValues ? 'Save Changes' : 'Create'}
			/>
		</form>
	)
}

// ─── Page Component ───

function MaterialsPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canCreate = usePermissionCheck({ permission: 'material.create' })
	const canEdit = usePermissionCheck({ permission: 'material.update' })
	const canDelete = usePermissionCheck({ permission: 'material.delete' })

	const listQuery = useQuery(
		materialResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			categoryId: search.categoryId,
		}),
	)
	const categoriesQuery = useQuery(categoryResource.list.queryOptions({ page: 1, limit: 100 }))

	const removeMut = useMutation(materialResource.remove.mutationOptions())
	const catRemoveMut = useMutation(categoryResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const categories = categoriesQuery.data?.data ?? []

	// ─── Material Handlers ───
	// Create/edit navigate to the full-page form routes — no dialog, no ref
	// plumbing. See materials.new.tsx / materials.$materialId.tsx.

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
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<div className="space-y-4">
					<LocationAssignment materialId={material.id} />
					<div className="flex justify-end">
						<Button size="sm" onClick={() => close(true)}>
							Done
						</Button>
					</div>
				</div>
			),
		})
	}, [])

	// ─── Category Handlers ───

	const handleCreateCategory = useCallback(async () => {
		const saved = await formDialog({
			title: 'Add Category',
			description: 'Create a new material category.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => <CategoryDialogBody close={close} />,
		})
		if (saved) toast.add({ title: 'Category created successfully.', type: 'success' })
	}, [])

	const handleEditCategory = useCallback(async (category: MaterialCategoryDto) => {
		const saved = await formDialog({
			title: 'Edit Category',
			description: `Update "${category.name}".`,
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => <CategoryDialogBody close={close} defaultValues={category} />,
		})
		if (saved) toast.add({ title: 'Category updated successfully.', type: 'success' })
	}, [])

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
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				const items = []
				if (canEdit) {
					items.push({
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/materials/$materialId',
								params: { materialId: String(row.original.id) },
							}),
					})
				}
				if (canCreate || canDelete) {
					items.push({
						label: 'Locations',
						icon: <MapPinIcon className="size-4" />,
						onClick: () => handleLocations(row.original),
					})
				}
				if (canDelete) {
					items.push({
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(row.original),
						variant: 'destructive' as const,
					})
				}
				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [canCreate, canEdit, canDelete, handleDelete, handleLocations, navigate])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, MaterialDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter && !search.categoryId

	return (
		<div className="space-y-6">
			<PageHeader
				title="Materials"
				description="Manage materials, categories, and location assignments."
				actions={
					<PermissionGate permission="material.create">
						<div className="flex gap-2">
							<Button size="sm" variant="outline" onClick={handleCreateCategory}>
								<TagIcon className="size-4" />
								Add Category
							</Button>
							<Button size="sm" onClick={() => navigate({ to: '/master/materials/new' })}>
								<PlusIcon className="size-4" />
								Add Material
							</Button>
						</div>
					</PermissionGate>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No materials yet"
					description="Get started by creating your first material."
					action={
						<PermissionGate permission="material.create">
							<Button size="sm" onClick={() => navigate({ to: '/master/materials/new' })}>
								<PlusIcon className="size-4" />
								Add Material
							</Button>
						</PermissionGate>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No materials match your filters."
					onRowClick={(row) =>
						navigate({
							to: '/master/materials/$materialId',
							params: { materialId: String(row.id) },
						})
					}
					toolbar={
						<TableToolbar
							searchValue={globalFilter}
							onSearchChange={(value) => table.setGlobalFilter(value)}
							searchPlaceholder="Search materials..."
							filters={[
								{
									key: 'categoryId',
									label: 'Category',
									value: search.categoryId?.toString(),
									onChange: (v) =>
										navigate({
											search: {
												...search,
												page: 1,
												categoryId: v ? Number(v) : undefined,
											},
										}),
									options: categories.map((cat) => ({
										label: cat.name,
										value: cat.id.toString(),
									})),
									allLabel: 'All categories',
								},
							]}
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
								{(canEdit || canDelete) && (
									<div className="flex gap-1">
										{canEdit && (
											<Button
												size="icon"
												variant="ghost"
												className="size-7"
												onClick={() => handleEditCategory(cat)}
											>
												<EditIcon className="size-3.5" />
											</Button>
										)}
										{canDelete && (
											<Button
												size="icon"
												variant="ghost"
												className="size-7"
												onClick={() => handleDeleteCategory(cat)}
											>
												<TrashIcon className="size-3.5" />
											</Button>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
