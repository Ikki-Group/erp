import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import {
	CurrencyCell,
	listSearchSchema,
	rightAlignedHeader,
	TextCell,
	useServerTable,
} from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageError } from '@/components/shared/page-error'
import { PageHeader } from '@/components/shared/page-header'
import { PageTabs } from '@/components/shared/page-tabs'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
	tab: z.enum(['items', 'categories', 'modifiers']).optional().default('items'),
})

export const Route = createFileRoute('/_authenticated/master/menu/')({
	validateSearch: menuSearchSchema,
	component: MenuPage,
})

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, MenuItemDto>()

const baseColumns = [
	col.accessor('sku', {
		header: 'SKU',
		size: 120,
		// oxlint-disable-next-line react/no-unstable-nested-components
		cell: ({ getValue }) => <TextCell value={getValue()} mono muted />,
	}),
	col.accessor('name', { header: 'Name', size: 200 }),
	col.accessor('basePrice', {
		header: rightAlignedHeader('Price'),
		size: 120,
		// oxlint-disable-next-line react/no-unstable-nested-components
		cell: ({ getValue }) => <CurrencyCell value={getValue()} />,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => (
			<StatusBadge variant={getValue() === 'active' ? 'success' : 'outline'}>
				{getValue() === 'active' ? 'Active' : 'Inactive'}
			</StatusBadge>
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

	const activeTab = search.tab

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

	const actionsColumn = useMemo(
		() =>
			createActionColumn<MenuItemDto>({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (item) => [
					canEditItem && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/menu/items/$itemId/edit',
								params: { itemId: String(item.id) },
							}),
					},
					canDeleteItem && {
						label: 'Hapus',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDeleteItem(item),
						variant: 'destructive' as const,
					},
				],
			}),
		[canEditItem, canDeleteItem, handleDeleteItem, navigate],
	)

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

	// One primary action per tab: the tab's own entity.
	const createItemButton = canCreateItem ? (
		<Button size="sm" onClick={() => navigate({ to: '/master/menu/items/new' })}>
			<PlusIcon className="size-4" />
			Tambah Menu Item
		</Button>
	) : undefined
	const createCategoryButton = canCreateCategory ? (
		<Button size="sm" onClick={handleCreateCategory}>
			<PlusIcon className="size-4" />
			Tambah Kategori
		</Button>
	) : undefined
	const createModifierButton = canCreateModifier ? (
		<Button size="sm" onClick={handleCreateModifier}>
			<PlusIcon className="size-4" />
			Tambah Modifier Group
		</Button>
	) : undefined
	const headerAction = {
		items: createItemButton,
		categories: createCategoryButton,
		modifiers: createModifierButton,
	}[activeTab]

	return (
		<div className="space-y-6">
			<PageHeader
				title="Menu"
				description={`Kelola menu item di ${activeLocation?.name ?? 'lokasi ini'}.`}
				actions={headerAction}
			/>

			<PageTabs
				tabs={[
					{ id: 'items', label: 'Menu Items', count: itemListQuery.data?.meta?.total },
					{ id: 'categories', label: 'Kategori', count: categoriesQuery.data?.data.length },
					{ id: 'modifiers', label: 'Modifier Groups', count: modifiersQuery.data?.data.length },
				]}
				activeTab={activeTab}
				onTabChange={(tab) =>
					navigate({ search: { tab: tab as typeof activeTab, page: 1, pageSize: search.pageSize } })
				}
			/>

			{activeTab === 'items' &&
				(itemListQuery.isError ? (
					<PageError
						message="Gagal memuat menu item."
						onRetry={() => void itemListQuery.refetch()}
					/>
				) : isItemsEmpty ? (
					<EmptyState
						title="Belum ada menu item"
						description="Mulai dengan menambahkan menu item pertama."
						action={createItemButton}
					/>
				) : (
					<DataTable
						table={table}
						recordCount={totalCount}
						isLoading={itemListQuery.isFetching}
						emptyMessage="Tidak ada menu item yang cocok."
						onRowClick={(item) =>
							navigate({ to: '/master/menu/items/$itemId', params: { itemId: String(item.id) } })
						}
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
				))}

			{activeTab === 'categories' &&
				(categoriesQuery.isError ? (
					<PageError
						message="Gagal memuat kategori."
						onRetry={() => void categoriesQuery.refetch()}
					/>
				) : categoriesQuery.isLoading ? (
					<ListSkeleton />
				) : categories.length === 0 ? (
					<EmptyState
						title="Belum ada kategori"
						description="Kategori mengelompokkan menu item di POS."
						action={createCategoryButton}
					/>
				) : (
					<ul className="divide-y rounded-lg border">
						{categories.map((cat) => (
							<li
								key={cat.id}
								className="flex min-h-11 items-center justify-between gap-2 px-4 py-1.5"
							>
								<div className="flex items-center gap-2">
									<span className="text-sm">{cat.name}</span>
									{cat.sortOrder > 0 && (
										<span className="font-mono text-xs tabular-nums text-muted-foreground">
											#{cat.sortOrder}
										</span>
									)}
								</div>
								<RowActions
									name={cat.name}
									onEdit={canEditCategory ? () => handleEditCategory(cat) : undefined}
									onDelete={canDeleteCategory ? () => handleDeleteCategory(cat) : undefined}
								/>
							</li>
						))}
					</ul>
				))}

			{activeTab === 'modifiers' &&
				(modifiersQuery.isError ? (
					<PageError
						message="Gagal memuat modifier group."
						onRetry={() => void modifiersQuery.refetch()}
					/>
				) : modifiersQuery.isLoading ? (
					<ListSkeleton />
				) : modifiers.length === 0 ? (
					<EmptyState
						title="Belum ada modifier group"
						description="Modifier group digunakan untuk opsi tambahan (mis. Level Gula, Ukuran)."
						action={createModifierButton}
					/>
				) : (
					<ul className="divide-y rounded-lg border">
						{modifiers.map((group) => (
							<li
								key={group.id}
								className="flex min-h-11 items-center justify-between gap-2 px-4 py-2"
							>
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-sm font-medium">{group.name}</span>
									<Badge variant="secondary" className="capitalize">
										{group.selectionType}
									</Badge>
									{group.isRequired && <Badge variant="outline">Wajib</Badge>}
								</div>
								<RowActions
									name={group.name}
									onEdit={canEditModifier ? () => handleEditModifier(group) : undefined}
									onDelete={canDeleteModifier ? () => handleDeleteModifier(group) : undefined}
								/>
							</li>
						))}
					</ul>
				))}
		</div>
	)
}

function ListSkeleton() {
	return (
		<div className="divide-y rounded-lg border">
			{[0, 1, 2].map((i) => (
				<div key={i} className="px-4 py-3.5">
					<Skeleton className="h-4 w-48" />
				</div>
			))}
		</div>
	)
}

function RowActions({
	name,
	onEdit,
	onDelete,
}: {
	name: string
	onEdit?: () => void
	onDelete?: () => void
}) {
	if (!onEdit && !onDelete) return null
	return (
		<div className="flex shrink-0 gap-1">
			{onEdit && (
				<Button size="icon-sm" variant="ghost" aria-label={`Edit ${name}`} onClick={onEdit}>
					<EditIcon className="size-3.5" />
				</Button>
			)}
			{onDelete && (
				<Button size="icon-sm" variant="ghost" aria-label={`Hapus ${name}`} onClick={onDelete}>
					<TrashIcon className="size-3.5" />
				</Button>
			)}
		</div>
	)
}
