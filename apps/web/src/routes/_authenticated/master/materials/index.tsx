import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, MapPinIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { FormDialogFooter } from '@/lib/form/index.ts'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { formDialog } from '@/components/shared/form-dialog'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
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

const col = createEntityColumns<MaterialDto>()

const baseColumns = [
	col.code('code', { header: 'Code', size: 100 }),
	col.text('name', { header: 'Name', size: 200 }),
	col.text('type', {
		header: 'Type',
		size: 120,
		cell: ({ getValue }) => {
			const type = getValue()
			const label = MATERIAL_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
			return <Badge variant="secondary">{label}</Badge>
		},
	}),
	col.booleanStatus('isActive', { header: 'Status', size: 80 }),
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
	const canRead = usePermissionCheck({ permission: 'material.read' })
	const canReadLocations = usePermissionCheck({ permission: 'location.read' })
	const canAssignLocations = usePermissionCheck({ permission: 'material.create' })
	const canEdit = usePermissionCheck({ permission: 'material.update' })
	const canDelete = usePermissionCheck({ permission: 'material.delete' })

	const listQuery = useQuery({
		...materialResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			categoryId: search.categoryId,
		}),
		throwOnError: false,
	})
	const categoriesQuery = useQuery({
		...categoryResource.list.queryOptions({ page: 1, limit: 100 }),
		throwOnError: false,
	})

	const removeMut = useMutation(materialResource.remove.mutationOptions())
	const catRemoveMut = useMutation(categoryResource.remove.mutationOptions())

	const categories = categoriesQuery.data?.data ?? []

	// ─── Material Handlers ───
	// Create/edit navigate to the full-page form routes — no dialog, no ref
	// plumbing. See materials.new.tsx / materials.$materialId.tsx.

	const { run: handleDelete, isPending: deletingMaterial } = useWorkflowAction<MaterialDto>({
		availability: () => canDelete,
		confirmation: (material) => ({
			title: 'Delete material?',
			description: `Remove "${material.name}" (${material.code}) from the material list? Existing records are retained.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
		}),
		execute: (material) => removeMut.mutateAsync({ id: material.id }),
		successMessage: 'Material deleted successfully.',
	})

	const handleLocations = useCallback(
		async (material: MaterialDto) => {
			await formDialog({
				title: 'Location Assignment',
				description: `Locations stocking ${material.name}.`,
				className: 'sm:max-w-2xl max-h-[90dvh] flex flex-col',
				// oxlint-disable-next-line react/no-unstable-nested-components
				content: ({ close }) => (
					<>
						<div className="min-h-0 overflow-y-auto">
							<LocationAssignment
								materialId={material.id}
								permissions={{
									canRead: canRead && canReadLocations,
									canAssign: canAssignLocations,
									canUnassign: canDelete,
								}}
							/>
						</div>
						<DialogFooter>
							<Button size="sm" onClick={() => close(true)}>
								Done
							</Button>
						</DialogFooter>
					</>
				),
			})
		},
		[canRead, canReadLocations, canAssignLocations, canDelete],
	)

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

	const { run: handleDeleteCategory, isPending: deletingCategory } =
		useWorkflowAction<MaterialCategoryDto>({
			availability: () => canDelete,
			confirmation: (category) => ({
				title: 'Delete category?',
				description: `Permanently delete "${category.name}"? Materials in this category will become uncategorized. This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
			}),
			execute: (category) => catRemoveMut.mutateAsync({ id: category.id }),
			successMessage: 'Category deleted successfully.',
		})

	// ─── Columns with actions ───

	const actionsColumn = useMemo(
		() =>
			col.actions({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (material) => [
					canEdit && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/materials/$materialId',
								params: { materialId: String(material.id) },
							}),
					},
					canRead && {
						label: 'Locations',
						icon: <MapPinIcon className="size-4" />,
						onClick: () => handleLocations(material),
					},
					canDelete && {
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(material),
						variant: 'destructive' as const,
						disabled: deletingMaterial,
					},
				],
			}),
		[canRead, canEdit, canDelete, deletingMaterial, handleDelete, handleLocations, navigate],
	)

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, MaterialDto>[],
		[actionsColumn],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.categoryId !== undefined,
	})

	return (
		<>
			<EntityListPage
				title="Materials"
				description="Manage materials, categories, and location assignments."
				list={list}
				actions={
					<PermissionGate permission="material.create">
						<Button size="sm" variant="outline" onClick={handleCreateCategory}>
							<TagIcon className="size-4" />
							Add Category
						</Button>
					</PermissionGate>
				}
				createAction={
					<PermissionGate permission="material.create">
						<Button size="sm" onClick={() => navigate({ to: '/master/materials/new' })}>
							<PlusIcon className="size-4" />
							Add Material
						</Button>
					</PermissionGate>
				}
				emptyState={{
					title: 'No materials yet',
					description: 'Get started by creating your first material.',
				}}
				emptyMessage="No materials match your filters."
				onRowClick={(row) =>
					navigate({
						to: '/master/materials/$materialId',
						params: { materialId: String(row.id) },
					})
				}
				toolbar={
					<TableToolbar
						searchValue={list.globalFilter}
						onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
						searchPlaceholder="Search materials..."
						filters={[
							{
								key: 'categoryId',
								label: 'Category',
								value: search.categoryId?.toString(),
								onChange: (value) =>
									list.setFilters({ categoryId: value ? Number(value) : undefined }),
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

			{categoriesQuery.isError && (
				<div
					role="alert"
					className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 p-3 text-sm"
				>
					<p>
						Could not load categories.{' '}
						{categoriesQuery.data
							? 'Showing the last loaded categories.'
							: 'Retry to restore category filters.'}
					</p>
					<Button size="sm" variant="outline" onClick={() => void categoriesQuery.refetch()}>
						Retry categories
					</Button>
				</div>
			)}
			{categories.length > 0 && (
				<div className="space-y-3">
					<h3 className="font-heading text-sm font-semibold tracking-tight">Categories</h3>
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
												disabled={deletingCategory}
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
		</>
	)
}
