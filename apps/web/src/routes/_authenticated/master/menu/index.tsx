import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, LayersIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { formDialog } from '@/components/shared/form-dialog'
import { LocationRequiredPage } from '@/components/shared/location-required-page'
import { PageShell } from '@/components/shared/page-shell'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import type { AuthLocation } from '@/features/auth/dto/index.ts'
import {
	menuCategoryResource,
	menuItemResource,
	modifierGroupResource,
} from '@/features/menu/api.ts'
import { CategoryFormBody } from '@/features/menu/components/category-form.tsx'
import { MenuCategoryFilter } from '@/features/menu/components/menu-category-filter.tsx'
import { ModifierGroupFormBody } from '@/features/menu/components/modifier-group-form.tsx'
import { MENU_ITEM_STATUS_OPTIONS, MenuItemStatusEnum } from '@/features/menu/dto/index.ts'
import type { MenuCategoryDto, MenuItemDto, ModifierGroupDto } from '@/features/menu/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

// The item list endpoint filters by text, category and status and cannot sort, so the URL
// carries exactly those.
const menuSearchSchema = listSearchSchema.omit({ sort: true }).extend({
	categoryId: z.coerce.number().int().positive().optional(),
	status: MenuItemStatusEnum.optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/master/menu/')({
	validateSearch: menuSearchSchema,
	component: MenuRoute,
})

function MenuRoute() {
	const { activeLocation } = useLocationContext()
	if (!activeLocation) {
		return (
			<LocationRequiredPage
				title="Menu"
				description="Kelola menu item, kategori, dan modifier."
				message="Pilih lokasi terlebih dahulu untuk mengelola menu."
			/>
		)
	}
	return <MenuPage location={activeLocation} />
}

// ─── Table Columns ───

const col = createEntityColumns<MenuItemDto>()

const CATEGORY_PAGE_SIZE = 100

// ─── Page Component ───

function MenuPage({ location }: { location: AuthLocation }) {
	const locationId = location.id
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEditItem = usePermissionCheck({ permission: 'item.update' })
	const canDeleteItem = usePermissionCheck({ permission: 'item.delete' })
	const canCreateCategory = usePermissionCheck({ permission: 'category.create' })
	const canEditCategory = usePermissionCheck({ permission: 'category.update' })
	const categoryAccess = useRef({ create: canCreateCategory, update: canEditCategory, mounted: true })
	categoryAccess.current.create = canCreateCategory
	categoryAccess.current.update = canEditCategory
	useEffect(() => {
		categoryAccess.current.mounted = true
		return () => { categoryAccess.current.mounted = false }
	}, [])
	const canDeleteCategory = usePermissionCheck({ permission: 'category.delete' })
	const canCreateModifier = usePermissionCheck({ permission: 'modifier.create' })
	const canEditModifier = usePermissionCheck({ permission: 'modifier.update' })
	const canDeleteModifier = usePermissionCheck({ permission: 'modifier.delete' })

	const [activeTab, setActiveTab] = useState<'items' | 'modifiers'>('items')
	const [categoryPageCount, setCategoryPageCount] = useState(1)

	// ─── Queries ───

	const itemListQuery = useQuery({
		...menuItemResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			categoryId: search.categoryId,
			status: search.status,
			locationId,
		}),
		throwOnError: false,
	})

	// Category management pages in on demand, so no category past the first page is unreachable.
	const categoryPages = useQueries({
		queries: Array.from({ length: categoryPageCount }, (_, index) => ({
			...menuCategoryResource.list.queryOptions({
				page: index + 1,
				limit: CATEGORY_PAGE_SIZE,
				locationId,
			}),
			throwOnError: false,
		})),
	})

	const modifiersQuery = useQuery({
		...modifierGroupResource.list.queryOptions({
			page: 1,
			limit: 100,
			locationId,
		}),
		throwOnError: false,
	})

	// ─── Mutations ───

	const catRemoveMut = useMutation(menuCategoryResource.remove.mutationOptions())

	const modCreateMut = useMutation(modifierGroupResource.create.mutationOptions())
	const modUpdateMut = useMutation(modifierGroupResource.update.mutationOptions())
	const modRemoveMut = useMutation(modifierGroupResource.remove.mutationOptions())

	// ─── Derived Data ───

	const categories = categoryPages.flatMap((page) => page.data?.data ?? [])
	const lastCategoryPage = categoryPages[categoryPages.length - 1]
	const failedCategoryPages = categoryPages.filter((page) => page.isError)
	const hasMoreCategories =
		lastCategoryPage?.data !== undefined &&
		lastCategoryPage.data.meta.page < lastCategoryPage.data.meta.totalPages
	const modifiers = modifiersQuery.data?.data ?? []

	// ─── Menu Item Handlers ───

	const { run: handleDeleteItem, isPending: deletingItem } = useWorkflowAction<MenuItemDto>({
		availability: () => canDeleteItem,
		confirmation: (item) => ({
			title: 'Hapus menu item?',
			description: `"${item.name}" (${item.sku}) akan dihapus permanen.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
		}),
		execute: (item) => menuItemResource.remove.fetch({ id: item.id }),
		successMessage: 'Menu item berhasil dihapus.',
	})

	// ─── Category Handlers ───

	const handleCreateCategory = useCallback(async () => {
		if (!locationId) return

		await formDialog({
			title: 'Tambah Kategori',
			description: 'Buat kategori menu baru.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<CategoryFormBody
					onSaved={() => close(true)}
					onCancel={() => close(false)}
					location={location}
					canSave={() => categoryAccess.current.mounted && categoryAccess.current.create}
				/>
			),
		})

	}, [location, locationId])

	const handleEditCategory = useCallback(
		async (category: MenuCategoryDto) => {
			await formDialog({
				title: 'Edit Kategori',
				description: `Edit "${category.name}".`,
				// oxlint-disable-next-line react/no-unstable-nested-components
				content: ({ close }) => (
					<CategoryFormBody
						category={category}
						onSaved={() => close(true)}
						onCancel={() => close(false)}
						location={location}
						canSave={() => categoryAccess.current.mounted && categoryAccess.current.update}
					/>
				),
			})

		},
		[location],
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

	const columns = useMemo(
		() =>
			[
				col.code('sku', { header: 'SKU', size: 120, enableSorting: false }),
				col.text('name', { header: 'Name', size: 200, enableSorting: false }),
				col.money('basePrice', { header: 'Price', size: 120, enableSorting: false }),
				col.status(
					'status',
					{
						active: { label: 'Active', variant: 'success' },
						inactive: { label: 'Inactive', variant: 'outline' },
					},
					{ header: 'Status', size: 100, enableSorting: false },
				),
				col.actions({
					// oxlint-disable-next-line react/no-unstable-nested-components -- action-item factory, not a rendered component
					getItems: (item) => [
						canEditItem && {
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () =>
								navigate({
									to: '/master/menu/items/$itemId',
									params: { itemId: String(item.id) },
								}),
						},
						canDeleteItem && {
							label: 'Hapus',
							icon: <TrashIcon className="size-4" />,
							onClick: () => handleDeleteItem(item),
							variant: 'destructive' as const,
							disabled: deletingItem,
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, MenuItemDto>[],
		[canEditItem, canDeleteItem, deletingItem, handleDeleteItem, navigate],
	)

	const list = useResourceList({
		query: itemListQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.categoryId !== undefined || value.status !== undefined,
	})

	const tabs = (
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
	)

	const headerActions = (
		<>
			<PermissionGate permission="category.create">
				<Button size="sm" variant="outline" onClick={handleCreateCategory}>
					<TagIcon className="size-4" />
					Kategori
				</Button>
			</PermissionGate>
			{canCreateModifier && (
				<Button size="sm" variant="outline" onClick={handleCreateModifier}>
					<LayersIcon className="size-4" />
					Modifier
				</Button>
			)}
		</>
	)

	const description = `Kelola menu item di ${location.name}.`

	if (activeTab === 'modifiers') {
		return (
			<PageShell title="Menu" description={description} actions={headerActions}>
				<div className="space-y-6">
					{tabs}
					{modifiersQuery.isError && (
						<div
							role="alert"
							className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 p-3 text-sm"
						>
							<p>Could not load modifier groups.</p>
							<Button size="sm" variant="outline" onClick={() => void modifiersQuery.refetch()}>
								Coba lagi
							</Button>
						</div>
					)}
					{modifiers.length === 0 ? (
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
					)}
				</div>
			</PageShell>
		)
	}

	return (
		<div className="space-y-6">
			<EntityListPage
				title="Menu"
				description={description}
				list={list}
				actions={headerActions}
				createAction={
					<PermissionGate permission="item.create">
						<Button size="sm" onClick={() => navigate({ to: '/master/menu/items/new' })}>
							<PlusIcon className="size-4" />
							Menu Item
						</Button>
					</PermissionGate>
				}
				emptyState={{
					title: 'Belum ada menu item',
					description: 'Mulai dengan menambahkan menu item pertama.',
				}}
				emptyMessage="Tidak ada menu item yang cocok."
				toolbar={
					<div className="space-y-3">
						{tabs}
						<div className="flex flex-wrap items-start gap-2">
							<TableToolbar
								className="min-w-0 flex-1"
								searchValue={list.globalFilter}
								onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
								searchPlaceholder="Cari menu item..."
								filters={[
									{
										key: 'status',
										label: 'Status',
										value: search.status,
										onChange: (value) =>
											list.setFilters({ status: MenuItemStatusEnum.safeParse(value).data }),
										options: MENU_ITEM_STATUS_OPTIONS,
										allLabel: 'Semua status',
									},
								]}
							/>
							<MenuCategoryFilter
								locationId={locationId}
								value={search.categoryId}
								onChange={(categoryId) => list.setFilters({ categoryId })}
							/>
						</div>
					</div>
				}
			/>
			{failedCategoryPages.length > 0 && (
				<div
					role="alert"
					className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 p-3 text-sm"
				>
					<p>Could not load all categories.</p>
					<Button
						size="sm"
						variant="outline"
						onClick={() => failedCategoryPages.forEach((page) => void page.refetch())}
					>
						Coba lagi
					</Button>
				</div>
			)}
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
			{hasMoreCategories && (
				<Button
					size="sm"
					variant="outline"
					disabled={lastCategoryPage?.isFetching}
					onClick={() => setCategoryPageCount((count) => count + 1)}
				>
					Muat kategori berikutnya
				</Button>
			)}
		</div>
	)
}
