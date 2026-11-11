import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, LayersIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { getActiveLocationId } from '@/lib/api'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { formDialog } from '@/components/shared/form-dialog'
import { LocationRequiredPage } from '@/components/shared/location-required-page'
import { PageTabs } from '@/components/shared/page-tabs'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { AuthLocation } from '@/features/auth/dto'
import { menuCategoryResource, menuItemResource, modifierGroupResource } from '@/features/menu/api'
import { CategoryFormBody } from '@/features/menu/components/category-form'
import { MenuCategoryFilter } from '@/features/menu/components/menu-category-filter'
import { MENU_ITEM_STATUS_OPTIONS, MenuItemStatusEnum } from '@/features/menu/dto'
import type { MenuCategoryDto, MenuItemDto, ModifierGroupDto } from '@/features/menu/dto'

import { useLocationContext } from '@/providers/location-provider'

const menuSearchSchema = listSearchSchema.omit({ sort: true }).extend({
	tab: z.enum(['items', 'modifiers']).default('items'),
	categoryId: z.coerce.number().int().positive().optional(),
	status: MenuItemStatusEnum.optional().catch(undefined),
})
export const Route = createFileRoute('/_authenticated/master/menu/')({
	validateSearch: menuSearchSchema,
	component: MenuRoute,
})
const itemColumns = createEntityColumns<MenuItemDto>()
const modifierColumns = createEntityColumns<ModifierGroupDto>()
const tabs = [
	{ id: 'items', label: 'Menu Items' },
	{ id: 'modifiers', label: 'Modifier Groups' },
]

function MenuRoute() {
	const { activeLocation } = useLocationContext()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	if (!activeLocation)
		return (
			<LocationRequiredPage
				title="Menu"
				description="Kelola menu item, kategori, dan modifier."
				message="Pilih lokasi terlebih dahulu untuk mengelola menu."
			/>
		)
	const navigation = (
		<PageTabs
			tabs={tabs}
			activeTab={search.tab}
			onTabChange={(tab) =>
				void navigate({
					search: {
						page: 1,
						pageSize: search.pageSize,
						tab: tab === 'modifiers' ? 'modifiers' : 'items',
					},
				})
			}
		/>
	)
	return search.tab === 'modifiers' ? (
		<ModifierList key={activeLocation.id} location={activeLocation} navigation={navigation} />
	) : (
		<MenuItems key={activeLocation.id} location={activeLocation} navigation={navigation} />
	)
}

interface ListProps {
	location: AuthLocation
	navigation: React.ReactNode
}

function MenuItems({ location, navigation }: ListProps) {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const canRead = usePermissionCheck({ permission: 'item.read' })
	const canCreate = usePermissionCheck({ permission: 'item.create' })
	const canEdit = usePermissionCheck({ permission: 'item.update' })
	const canDelete = usePermissionCheck({ permission: 'item.delete' })
	const canReadCategories = usePermissionCheck({ permission: 'category.read' })
	const query = useQuery({
		...menuItemResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			categoryId: search.categoryId,
			status: search.status,
			locationId: location.id,
		}),
		enabled: canRead,
		throwOnError: false,
	})
	const { run: remove, isPending: deleting } = useWorkflowAction<MenuItemDto>({
		availability: () => canDelete && getActiveLocationId() === location.id,
		confirmation: (item) => ({
			title: 'Hapus menu item?',
			description: `"${item.name}" (${item.sku}) akan dihapus permanen.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
		}),
		execute: (item) => menuItemResource.remove.fetch({ id: item.id }),
		successMessage: 'Menu item berhasil dihapus.',
	})
	const columns = useMemo(
		() =>
			[
				itemColumns.code('sku', { header: 'SKU', size: 120, enableSorting: false }),
				itemColumns.text('name', { header: 'Name', size: 200, enableSorting: false }),
				itemColumns.money('basePrice', { header: 'Price', size: 120, enableSorting: false }),
				itemColumns.status(
					'status',
					{
						active: { label: 'Active', variant: 'success' },
						inactive: { label: 'Inactive', variant: 'outline' },
					},
					{ header: 'Status', size: 100, enableSorting: false },
				),
				itemColumns.actions({
					// oxlint-disable-next-line react/no-unstable-nested-components -- action factory
					getItems: (item) => [
						canEdit && {
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () =>
								navigate({ to: '/master/menu/items/$itemId', params: { itemId: String(item.id) } }),
						},
						canDelete && {
							label: 'Hapus',
							icon: <TrashIcon className="size-4" />,
							onClick: () => remove(item),
							variant: 'destructive',
							disabled: deleting,
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, MenuItemDto>[],
		[canEdit, canDelete, deleting, remove, navigate],
	)
	const list = useResourceList({
		query,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.categoryId !== undefined || value.status !== undefined,
	})
	return (
		<div className="space-y-6">
			{canRead ? (
				<EntityListPage
					title="Menu"
					description={`Kelola menu item di ${location.name}.`}
					list={list}
					createAction={
						canCreate ? (
							<Button size="sm" onClick={() => navigate({ to: '/master/menu/items/new' })}>
								<PlusIcon className="size-4" />
								Menu Item
							</Button>
						) : undefined
					}
					emptyState={{
						title: 'Belum ada menu item',
						description: 'Mulai dengan menambahkan menu item pertama.',
					}}
					emptyMessage="Tidak ada menu item yang cocok."
					toolbar={
						<div className="space-y-3">
							{navigation}
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
								{canReadCategories && (
									<MenuCategoryFilter
										locationId={location.id}
										value={search.categoryId}
										onChange={(categoryId) => list.setFilters({ categoryId })}
									/>
								)}
							</div>
						</div>
					}
				/>
			) : (
				<>
					{navigation}
					<p role="status">Anda tidak memiliki izin melihat menu item.</p>
				</>
			)}
			<CategoryManagement location={location} />
		</div>
	)
}

function CategoryManagement({ location }: { location: AuthLocation }) {
	const canRead = usePermissionCheck({ permission: 'category.read' })
	const canCreate = usePermissionCheck({ permission: 'category.create' })
	const canEdit = usePermissionCheck({ permission: 'category.update' })
	const canDelete = usePermissionCheck({ permission: 'category.delete' })
	const live = useRef({ canCreate, canEdit, mounted: true })
	live.current.canCreate = canCreate
	live.current.canEdit = canEdit
	useEffect(() => {
		live.current.mounted = true
		return () => {
			live.current.mounted = false
		}
	}, [])
	const [pageCount, setPageCount] = useState(1)
	const pages = useQueries({
		queries: Array.from({ length: pageCount }, (_, index) => ({
			...menuCategoryResource.list.queryOptions({
				page: index + 1,
				limit: 25,
				locationId: location.id,
			}),
			enabled: canRead,
			throwOnError: false,
		})),
	})
	const categories = pages.flatMap((page) => page.data?.data ?? [])
	const last = pages[pages.length - 1]!
	const failed = pages.filter((page) => page.isError)
	const more = !!last.data && last.data.meta.page < last.data.meta.totalPages
	const openCategory = useCallback(
		async (category?: MenuCategoryDto) => {
			const canSave = () =>
				live.current.mounted &&
				(category ? live.current.canEdit : live.current.canCreate) &&
				getActiveLocationId() === (category?.locationId ?? location.id)
			if (!canSave()) return
			await formDialog({
				title: category ? 'Edit Kategori' : 'Tambah Kategori',
				description: category
					? `Edit "${category.name}" di ${location.name}.`
					: `Buat kategori menu di ${location.name}.`,
				// oxlint-disable-next-line react/no-unstable-nested-components -- callable dialog renderer
				content: ({ close }) => (
					<CategoryFormBody
						category={category}
						location={location}
						canSave={canSave}
						onSaved={() => close(true)}
						onCancel={() => close(false)}
					/>
				),
			})
		},
		[location],
	)
	const { run: remove, isPending: deleting } = useWorkflowAction<MenuCategoryDto>({
		availability: (category) => canDelete && getActiveLocationId() === category.locationId,
		confirmation: (category) => ({
			title: 'Hapus kategori?',
			description: `"${category.name}" akan dihapus permanen.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
		}),
		execute: (category) => menuCategoryResource.remove.fetch({ id: category.id }),
		successMessage: 'Kategori berhasil dihapus.',
	})
	if (!canRead && !canCreate) return null
	return (
		<section className="space-y-3" aria-label="Kategori menu">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-sm font-medium">Kategori</h2>
				{canCreate && (
					<Button size="sm" variant="outline" onClick={() => openCategory()}>
						<TagIcon className="size-4" />
						Tambah Kategori
					</Button>
				)}
			</div>
			{canRead && (
				<>
					{failed.length > 0 && (
						<div
							role="alert"
							className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 p-3 text-sm"
						>
							<p>Kategori gagal dimuat. Data terakhir tetap ditampilkan.</p>
							<Button
								size="sm"
								variant="outline"
								disabled={failed.some((page) => page.isFetching)}
								onClick={() => failed.forEach((page) => void page.refetch())}
							>
								Coba muat kategori lagi
							</Button>
						</div>
					)}
					{pages[0]!.isPending ? (
						<p role="status" className="text-sm text-muted-foreground">
							Memuat kategori…
						</p>
					) : failed.length === 0 && categories.length === 0 ? (
						<p className="text-sm text-muted-foreground">Belum ada kategori.</p>
					) : null}
					{categories.length > 0 && (
						<div className="divide-y rounded-md border">
							{categories.map((category) => (
								<div
									key={category.id}
									className="flex items-center justify-between gap-3 px-4 py-3"
								>
									<div className="min-w-0">
										<span className="break-words text-sm font-medium">{category.name}</span>
										<Badge variant="outline" className="ml-2 font-mono tabular-nums">
											{category.sortOrder}
										</Badge>
									</div>
									<div className="flex shrink-0 gap-1">
										{canEdit && (
											<Button
												size="icon"
												variant="ghost"
												aria-label={`Edit kategori ${category.name}`}
												onClick={() => openCategory(category)}
											>
												<EditIcon className="size-4" />
											</Button>
										)}
										{canDelete && (
											<Button
												size="icon"
												variant="ghost"
												aria-label={`Hapus kategori ${category.name}`}
												disabled={deleting}
												onClick={() => remove(category)}
											>
												<TrashIcon className="size-4" />
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
					{more && (
						<Button
							size="sm"
							variant="outline"
							disabled={last.isFetching || failed.length > 0}
							onClick={() => setPageCount((count) => count + 1)}
						>
							Muat kategori berikutnya
						</Button>
					)}
				</>
			)}
		</section>
	)
}

function ModifierList({ location, navigation }: ListProps) {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const canRead = usePermissionCheck({ permission: 'modifier.read' })
	const canCreate = usePermissionCheck({ permission: 'modifier.create' })
	const canEdit = usePermissionCheck({ permission: 'modifier.update' })
	const canDelete = usePermissionCheck({ permission: 'modifier.delete' })
	const query = useQuery({
		...modifierGroupResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			locationId: location.id,
		}),
		enabled: canRead,
		throwOnError: false,
	})
	const { run: remove, isPending: deleting } = useWorkflowAction<ModifierGroupDto>({
		availability: (group) => canDelete && getActiveLocationId() === group.locationId,
		confirmation: (group) => ({
			title: 'Hapus modifier group?',
			description: `"${group.name}" beserta semua opsinya akan dihapus permanen.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
		}),
		execute: (group) => modifierGroupResource.remove.fetch({ id: group.id }),
		successMessage: 'Modifier group berhasil dihapus.',
	})
	const columns = useMemo(
		() =>
			[
				modifierColumns.text('name', { header: 'Nama', size: 230, enableSorting: false }),
				modifierColumns.text('selectionType', {
					header: 'Tipe Seleksi',
					size: 140,
					enableSorting: false,
				}),
				modifierColumns.booleanStatus('isRequired', {
					header: 'Wajib',
					size: 100,
					enableSorting: false,
					labels: {
						true: { label: 'Wajib', variant: 'info' },
						false: { label: 'Opsional', variant: 'outline' },
					},
				}),
				modifierColumns.quantity('minSelect', { header: 'Min', size: 75, enableSorting: false }),
				modifierColumns.quantity('maxSelect', { header: 'Max', size: 75, enableSorting: false }),
				modifierColumns.actions({
					// oxlint-disable-next-line react/no-unstable-nested-components -- action factory
					getItems: (group) => [
						canRead && {
							label: canEdit ? 'Edit' : 'Lihat',
							icon: <EditIcon className="size-4" />,
							onClick: () =>
								navigate({
									to: '/master/menu/modifiers/$groupId',
									params: { groupId: String(group.id) },
								}),
						},
						canDelete && {
							label: 'Hapus',
							icon: <TrashIcon className="size-4" />,
							disabled: deleting,
							variant: 'destructive',
							onClick: () => remove(group),
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, ModifierGroupDto>[],
		[canRead, canEdit, canDelete, deleting, remove, navigate],
	)
	const list = useResourceList({
		query,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})
	return canRead ? (
		<EntityListPage
			title="Modifier Groups"
			description={`Kelola pilihan tambahan di ${location.name}. Max kosong berarti tanpa batas.`}
			list={list}
			createAction={
				canCreate ? (
					<Button size="sm" onClick={() => navigate({ to: '/master/menu/modifiers/new' })}>
						<LayersIcon className="size-4" />
						Tambah Modifier Group
					</Button>
				) : undefined
			}
			emptyState={{
				title: 'Belum ada modifier group',
				description: 'Tambahkan pilihan seperti ukuran atau level gula.',
			}}
			emptyMessage="Tidak ada modifier group yang cocok."
			toolbar={
				<div className="space-y-3">
					{navigation}
					<TableToolbar
						searchValue={list.globalFilter}
						onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
						searchPlaceholder="Cari modifier group..."
					/>
				</div>
			}
		/>
	) : (
		<div className="space-y-4">
			{navigation}
			<p role="status">Anda tidak memiliki izin melihat modifier group.</p>
		</div>
	)
}
