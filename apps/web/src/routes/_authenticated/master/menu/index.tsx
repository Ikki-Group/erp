import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, LayersIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import {
	menuCategoryResource,
	menuItemResource,
	modifierGroupResource,
} from '@/features/menu/api.ts'
import { CategoryFormBody } from '@/features/menu/components/category-form.tsx'
import { ModifierGroupFormBody } from '@/features/menu/components/modifier-group-form.tsx'
import type { MenuCategoryDto, MenuItemDto, ModifierGroupDto } from '@/features/menu/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

const menuSearchSchema = listSearchSchema.extend({
	categoryId: z.coerce.number().int().positive().optional(),
})

export const Route = createFileRoute('/_authenticated/master/menu/')({
	validateSearch: menuSearchSchema,
	component: MenuPage,
})

// ─── Helpers ───

function formatPrice(price: string): string {
	const num = Number(price)
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(num)
}

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, MenuItemDto>()

const baseColumns = [
	col.accessor('sku', { header: 'SKU', size: 120 }),
	col.accessor('name', { header: 'Name', size: 200 }),
	col.accessor('basePrice', {
		header: 'Price',
		size: 120,
		cell: ({ getValue }) => formatPrice(getValue()),
	}),
	col.accessor('status', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => (
			<Badge variant={getValue() === 'active' ? 'default' : 'outline'}>
				{getValue() === 'active' ? 'Active' : 'Inactive'}
			</Badge>
		),
	}),
]

// ─── Page Component ───

function MenuPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const locationId = activeLocation?.id
	const canCreateItem = usePermissionCheck({ permission: 'item.create' })
	const canEditItem = usePermissionCheck({ permission: 'item.update' })
	const canDeleteItem = usePermissionCheck({ permission: 'item.delete' })
	const canCreateCategory = usePermissionCheck({ permission: 'category.create' })
	const canEditCategory = usePermissionCheck({ permission: 'category.update' })
	const canDeleteCategory = usePermissionCheck({ permission: 'category.delete' })
	const canCreateModifier = usePermissionCheck({ permission: 'modifier.create' })
	const canEditModifier = usePermissionCheck({ permission: 'modifier.update' })
	const canDeleteModifier = usePermissionCheck({ permission: 'modifier.delete' })

	const [activeTab, setActiveTab] = useState<'items' | 'modifiers'>('items')

	// ─── Queries ───

	const itemListQuery = useQuery({
		...menuItemResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			categoryId: search.categoryId,
			locationId: locationId!,
		}),
		enabled: !!locationId,
	})

	const categoriesQuery = useQuery({
		...menuCategoryResource.list.queryOptions({
			page: 1,
			limit: 100,
			locationId: locationId!,
		}),
		enabled: !!locationId,
	})

	const modifiersQuery = useQuery({
		...modifierGroupResource.list.queryOptions({
			page: 1,
			limit: 100,
			locationId: locationId!,
		}),
		enabled: !!locationId,
	})

	// ─── Mutations ───

	const itemRemoveMut = useMutation(menuItemResource.remove.mutationOptions())

	const catCreateMut = useMutation(menuCategoryResource.create.mutationOptions())
	const catUpdateMut = useMutation(menuCategoryResource.update.mutationOptions())
	const catRemoveMut = useMutation(menuCategoryResource.remove.mutationOptions())

	const modCreateMut = useMutation(modifierGroupResource.create.mutationOptions())
	const modUpdateMut = useMutation(modifierGroupResource.update.mutationOptions())
	const modRemoveMut = useMutation(modifierGroupResource.remove.mutationOptions())

	// ─── Derived Data ───

	const items = itemListQuery.data?.data ?? []
	const totalCount = itemListQuery.data?.meta?.total ?? 0
	const categories = categoriesQuery.data?.data ?? []
	const modifiers = modifiersQuery.data?.data ?? []

	// ─── Menu Item Handlers ───

	const handleDeleteItem = useCallback(
		async (item: MenuItemDto) => {
			await confirm({
				title: 'Hapus menu item?',
				description: `"${item.name}" (${item.sku}) akan dihapus permanen.`,
				confirmLabel: 'Hapus',
				variant: 'destructive',
				onConfirm: async () => {
					await itemRemoveMut.mutateAsync({ id: item.id })
					toast.add({ title: 'Menu item berhasil dihapus.', type: 'success' })
				},
			})
		},
		[itemRemoveMut],
	)

	// ─── Category Handlers ───

	const handleCreateCategory = useCallback(async () => {
		if (!locationId) return

		const saved = await formDialog({
			title: 'Tambah Kategori',
			description: 'Buat kategori menu baru.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<CategoryFormBody
					onSaved={() => close(true)}
					onCancel={() => close(false)}
					onSubmitValues={(v) => catCreateMut.mutateAsync({ locationId, ...v })}
				/>
			),
		})

		if (saved) {
			toast.add({ title: 'Kategori berhasil dibuat.', type: 'success' })
		}
	}, [catCreateMut, locationId])

	const handleEditCategory = useCallback(
		async (category: MenuCategoryDto) => {
			const saved = await formDialog({
				title: 'Edit Kategori',
				description: `Edit "${category.name}".`,
				// oxlint-disable-next-line react/no-unstable-nested-components
				content: ({ close }) => (
					<CategoryFormBody
						defaultValues={category}
						onSaved={() => close(true)}
						onCancel={() => close(false)}
						onSubmitValues={(v) => catUpdateMut.mutateAsync({ id: category.id, ...v })}
					/>
				),
			})

			if (saved) {
				toast.add({ title: 'Kategori berhasil diperbarui.', type: 'success' })
			}
		},
		[catUpdateMut],
	)

	const handleDeleteCategory = useCallback(
		async (category: MenuCategoryDto) => {
			await confirm({
				title: 'Hapus kategori?',
				description: `"${category.name}" akan dihapus permanen.`,
				confirmLabel: 'Hapus',
				variant: 'destructive',
				onConfirm: async () => {
					await catRemoveMut.mutateAsync({ id: category.id })
					toast.add({ title: 'Kategori berhasil dihapus.', type: 'success' })
				},
			})
		},
		[catRemoveMut],
	)

	// ─── Modifier Group Handlers ───

	const handleCreateModifier = useCallback(async () => {
		if (!locationId) return

		const saved = await formDialog({
			title: 'Tambah Modifier Group',
			description: 'Buat grup modifier baru (mis. Ukuran, Level Gula).',
			className: 'sm:max-w-lg',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<ModifierGroupFormBody
					onSaved={() => close(true)}
					onCancel={() => close(false)}
					onSubmitValues={(v) => modCreateMut.mutateAsync({ locationId, ...v })}
				/>
			),
		})

		if (saved) {
			toast.add({ title: 'Modifier group berhasil dibuat.', type: 'success' })
		}
	}, [modCreateMut, locationId])

	const handleEditModifier = useCallback(
		async (group: ModifierGroupDto) => {
			const saved = await formDialog({
				title: 'Edit Modifier Group',
				description: `Edit "${group.name}".`,
				className: 'sm:max-w-lg',
				// oxlint-disable-next-line react/no-unstable-nested-components
				content: ({ close }) => (
					<ModifierGroupFormBody
						defaultValues={group}
						locationId={locationId!}
						onSaved={() => close(true)}
						onCancel={() => close(false)}
						onSubmitValues={(v) => modUpdateMut.mutateAsync({ id: group.id, ...v })}
					/>
				),
			})

			if (saved) {
				toast.add({ title: 'Modifier group berhasil diperbarui.', type: 'success' })
			}
		},
		[modUpdateMut, locationId],
	)

	const handleDeleteModifier = useCallback(
		async (group: ModifierGroupDto) => {
			await confirm({
				title: 'Hapus modifier group?',
				description: `"${group.name}" beserta semua opsinya akan dihapus permanen.`,
				confirmLabel: 'Hapus',
				variant: 'destructive',
				onConfirm: async () => {
					await modRemoveMut.mutateAsync({ id: group.id })
					toast.add({ title: 'Modifier group berhasil dihapus.', type: 'success' })
				},
			})
		},
		[modRemoveMut],
	)

	// ─── Table Columns ───

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				const items = []
				if (canEditItem) {
					items.push({
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/menu/items/$itemId',
								params: { itemId: String(row.original.id) },
							}),
					})
				}
				if (canDeleteItem) {
					items.push({
						label: 'Hapus',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDeleteItem(row.original),
						variant: 'destructive' as const,
					})
				}
				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [canEditItem, canDeleteItem, handleDeleteItem, navigate])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, MenuItemDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data: items,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	// ─── No Location Guard ───

	if (!locationId) {
		return (
			<div className="space-y-6">
				<PageHeader title="Menu" description="Kelola menu item, kategori, dan modifier." />
				<EmptyState
					title="Belum ada lokasi dipilih"
					description="Pilih lokasi terlebih dahulu untuk mengelola menu."
				/>
			</div>
		)
	}

	const isItemsEmpty =
		!itemListQuery.isLoading && items.length === 0 && !globalFilter && !search.categoryId

	return (
		<div className="space-y-6">
			<PageHeader
				title="Menu"
				description={`Kelola menu item di ${activeLocation?.name ?? 'lokasi ini'}.`}
				actions={
					<div className="flex gap-2">
						{canCreateCategory && (
							<Button size="sm" variant="outline" onClick={handleCreateCategory}>
								<TagIcon className="size-4" />
								Kategori
							</Button>
						)}
						{canCreateModifier && (
							<Button size="sm" variant="outline" onClick={handleCreateModifier}>
								<LayersIcon className="size-4" />
								Modifier
							</Button>
						)}
						{canCreateItem && (
							<Button size="sm" onClick={() => navigate({ to: '/master/menu/items/new' })}>
								<PlusIcon className="size-4" />
								Menu Item
							</Button>
						)}
					</div>
				}
			/>

			{/* Tab Switcher */}
			<div className="flex gap-1 rounded-lg border p-1">
				<button
					type="button"
					className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'items' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
					onClick={() => setActiveTab('items')}
				>
					Menu Items
				</button>
				<button
					type="button"
					className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'modifiers' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
					onClick={() => setActiveTab('modifiers')}
				>
					Modifier Groups
				</button>
			</div>

			{/* Items Tab */}
			{activeTab === 'items' && (
				<>
					{isItemsEmpty ? (
						<EmptyState
							title="Belum ada menu item"
							description="Mulai dengan menambahkan menu item pertama."
							action={
								canCreateItem ? (
									<Button size="sm" onClick={() => navigate({ to: '/master/menu/items/new' })}>
										<PlusIcon className="size-4" />
										Tambah Menu Item
									</Button>
								) : undefined
							}
						/>
					) : (
						<DataTable
							table={table}
							recordCount={totalCount}
							isLoading={itemListQuery.isLoading}
							emptyMessage="Tidak ada menu item yang cocok."
							toolbar={
								<TableToolbar
									searchValue={globalFilter}
									onSearchChange={(value) => table.setGlobalFilter(value)}
									searchPlaceholder="Cari menu item..."
									filters={[
										{
											key: 'categoryId',
											label: 'Kategori',
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
											allLabel: 'Semua kategori',
										},
									]}
								/>
							}
						/>
					)}

					{/* Categories Section */}
					{categories.length > 0 && (
						<div className="space-y-3">
							<h3 className="text-sm font-medium">Kategori</h3>
							<div className="divide-y rounded-md border">
								{categories.map((cat) => (
									<div key={cat.id} className="flex items-center justify-between px-4 py-3">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">{cat.name}</span>
											{cat.sortOrder > 0 && (
												<Badge variant="outline" className="text-xs">
													#{cat.sortOrder}
												</Badge>
											)}
										</div>
										{(canEditCategory || canDeleteCategory) && (
											<div className="flex gap-1">
												{canEditCategory && (
													<Button
														size="icon"
														variant="ghost"
														className="size-7"
														onClick={() => handleEditCategory(cat)}
													>
														<EditIcon className="size-3.5" />
													</Button>
												)}
												{canDeleteCategory && (
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
				</>
			)}

			{/* Modifiers Tab */}
			{activeTab === 'modifiers' &&
				(modifiers.length === 0 ? (
					<EmptyState
						title="Belum ada modifier group"
						description="Modifier group digunakan untuk opsi tambahan (mis. Level Gula, Ukuran)."
						action={
							canCreateModifier ? (
								<Button size="sm" onClick={handleCreateModifier}>
									<PlusIcon className="size-4" />
									Tambah Modifier Group
								</Button>
							) : undefined
						}
					/>
				) : (
					<div className="divide-y rounded-md border">
						{modifiers.map((group) => (
							<div key={group.id} className="flex items-center justify-between px-4 py-3">
								<div className="space-y-0.5">
									<span className="text-sm font-medium">{group.name}</span>
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="text-xs capitalize">
											{group.selectionType}
										</Badge>
										{group.isRequired === 1 && (
											<Badge variant="outline" className="text-xs">
												Wajib
											</Badge>
										)}
									</div>
								</div>
								{(canEditModifier || canDeleteModifier) && (
									<div className="flex gap-1">
										{canEditModifier && (
											<Button
												size="icon"
												variant="ghost"
												className="size-7"
												onClick={() => handleEditModifier(group)}
											>
												<EditIcon className="size-3.5" />
											</Button>
										)}
										{canDeleteModifier && (
											<Button
												size="icon"
												variant="ghost"
												className="size-7"
												onClick={() => handleDeleteModifier(group)}
											>
												<TrashIcon className="size-3.5" />
											</Button>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				))}
		</div>
	)
}
