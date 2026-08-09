import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, LayersIcon, PlusIcon, TagIcon, TrashIcon } from 'lucide-react'

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

import {
	menuCategoryResource,
	menuItemResource,
	modifierGroupResource,
} from '@/features/menu/api.ts'
import { CategoryForm } from '@/features/menu/components/category-form.tsx'
import type { CategoryFormRef } from '@/features/menu/components/category-form.tsx'
import { MenuItemForm } from '@/features/menu/components/menu-item-form.tsx'
import type {
	MenuItemFormRef,
	MenuItemFormValues,
} from '@/features/menu/components/menu-item-form.tsx'
import { ModifierGroupForm } from '@/features/menu/components/modifier-group-form.tsx'
import type { ModifierGroupFormRef } from '@/features/menu/components/modifier-group-form.tsx'
import type {
	MenuCategoryDto,
	MenuItemDto,
	MenuItemStatusEnum,
	ModifierGroupDto,
} from '@/features/menu/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/master/menu')({
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

function formToPayload(v: MenuItemFormValues, locationId: number) {
	return {
		locationId,
		sku: v.sku,
		name: v.name,
		categoryId: v.categoryId ? Number(v.categoryId) : null,
		basePrice: v.basePrice,
		status: v.status as MenuItemStatusEnum,
	}
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
	const locationId = activeLocation?.id

	const [activeTab, setActiveTab] = useState<'items' | 'modifiers'>('items')
	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
		categoryId: undefined as number | undefined,
	})

	// ─── Queries ───

	const itemListQuery = useQuery({
		...menuItemResource.list.queryOptions({
			...listParams,
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

	const itemCreateMut = useMutation(menuItemResource.create.mutationOptions())
	const itemUpdateMut = useMutation(menuItemResource.update.mutationOptions())
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

	const handleCreateItem = useCallback(async () => {
		if (!locationId) return
		const formRef = { current: null } as React.MutableRefObject<MenuItemFormRef | null>

		const saved = await formDialog({
			title: 'Tambah Menu Item',
			description: 'Buat item menu baru untuk lokasi ini.',
			submitLabel: 'Simpan',
			content: (
				<MenuItemForm
					ref={(el) => {
						formRef.current = el
					}}
					locationId={locationId}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Mohon perbaiki error validasi.')
				const v = formRef.current!.getValues()
				await itemCreateMut.mutateAsync(formToPayload(v, locationId))
			},
		})

		if (saved) {
			toast.add({ title: 'Menu item berhasil dibuat.', type: 'success' })
		}
	}, [itemCreateMut, locationId])

	const handleEditItem = useCallback(
		async (item: MenuItemDto) => {
			if (!locationId) return
			const formRef = { current: null } as React.MutableRefObject<MenuItemFormRef | null>

			const saved = await formDialog({
				title: 'Edit Menu Item',
				description: `Edit "${item.name}".`,
				submitLabel: 'Simpan',
				content: (
					<MenuItemForm
						ref={(el) => {
							formRef.current = el
						}}
						locationId={locationId}
						defaultValues={item}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Mohon perbaiki error validasi.')
					const v = formRef.current!.getValues()
					const { locationId: _loc, ...payload } = formToPayload(v, locationId)
					await itemUpdateMut.mutateAsync({ id: item.id, ...payload })
				},
			})

			if (saved) {
				toast.add({ title: 'Menu item berhasil diperbarui.', type: 'success' })
			}
		},
		[itemUpdateMut, locationId],
	)

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
		const formRef = { current: null } as React.MutableRefObject<CategoryFormRef | null>

		const saved = await formDialog({
			title: 'Tambah Kategori',
			description: 'Buat kategori menu baru.',
			submitLabel: 'Simpan',
			content: (
				<CategoryForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Mohon perbaiki error validasi.')
				const v = formRef.current!.getValues()
				await catCreateMut.mutateAsync({ locationId, name: v.name, sortOrder: v.sortOrder })
			},
		})

		if (saved) {
			toast.add({ title: 'Kategori berhasil dibuat.', type: 'success' })
		}
	}, [catCreateMut, locationId])

	const handleEditCategory = useCallback(
		async (category: MenuCategoryDto) => {
			const formRef = { current: null } as React.MutableRefObject<CategoryFormRef | null>

			const saved = await formDialog({
				title: 'Edit Kategori',
				description: `Edit "${category.name}".`,
				submitLabel: 'Simpan',
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
					if (errors) throw new Error('Mohon perbaiki error validasi.')
					const v = formRef.current!.getValues()
					await catUpdateMut.mutateAsync({ id: category.id, name: v.name, sortOrder: v.sortOrder })
				},
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
		const formRef = { current: null } as React.MutableRefObject<ModifierGroupFormRef | null>

		const saved = await formDialog({
			title: 'Tambah Modifier Group',
			description: 'Buat grup modifier baru (mis. Ukuran, Level Gula).',
			submitLabel: 'Simpan',
			content: (
				<ModifierGroupForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Mohon perbaiki error validasi.')
				const v = formRef.current!.getValues()
				await modCreateMut.mutateAsync({
					locationId,
					name: v.name,
					selectionType: v.selectionType,
					isRequired: v.isRequired,
					minSelect: v.minSelect,
					maxSelect: v.maxSelect,
					options: v.options,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Modifier group berhasil dibuat.', type: 'success' })
		}
	}, [modCreateMut, locationId])

	const handleEditModifier = useCallback(
		async (group: ModifierGroupDto) => {
			const formRef = { current: null } as React.MutableRefObject<ModifierGroupFormRef | null>

			const saved = await formDialog({
				title: 'Edit Modifier Group',
				description: `Edit "${group.name}".`,
				submitLabel: 'Simpan',
				content: (
					<ModifierGroupForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={group}
						locationId={locationId!}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Mohon perbaiki error validasi.')
					const v = formRef.current!.getValues()
					await modUpdateMut.mutateAsync({
						id: group.id,
						name: v.name,
						selectionType: v.selectionType,
						isRequired: v.isRequired,
						minSelect: v.minSelect,
						maxSelect: v.maxSelect,
						options: v.options,
					})
				},
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
			cell: ({ row }) => (
				<ActionMenu
					items={[
						{
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () => handleEditItem(row.original),
						},
						{
							label: 'Hapus',
							icon: <TrashIcon className="size-4" />,
							onClick: () => handleDeleteItem(row.original),
							variant: 'destructive' as const,
						},
					]}
				/>
			),
		})
	}, [handleEditItem, handleDeleteItem])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, MenuItemDto>[],
		[actionsColumn],
	)

	const { table, globalFilter, setGlobalFilter } = useServerTable({
		data: items,
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
		!itemListQuery.isLoading && items.length === 0 && !globalFilter && !listParams.categoryId

	return (
		<div className="space-y-6">
			<PageHeader
				title="Menu"
				description={`Kelola menu item di ${activeLocation?.name ?? 'lokasi ini'}.`}
				actions={
					<div className="flex gap-2">
						<Button size="sm" variant="outline" onClick={handleCreateCategory}>
							<TagIcon className="size-4" />
							Kategori
						</Button>
						<Button size="sm" variant="outline" onClick={handleCreateModifier}>
							<LayersIcon className="size-4" />
							Modifier
						</Button>
						<Button size="sm" onClick={handleCreateItem}>
							<PlusIcon className="size-4" />
							Menu Item
						</Button>
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
								<Button size="sm" onClick={handleCreateItem}>
									<PlusIcon className="size-4" />
									Tambah Menu Item
								</Button>
							}
						/>
					) : (
						<DataTable
							table={table}
							recordCount={totalCount}
							isLoading={itemListQuery.isLoading}
							emptyMessage="Tidak ada menu item yang cocok."
							toolbar={
								<SearchToolbar
									value={globalFilter}
									onChange={setGlobalFilter}
									placeholder="Cari menu item..."
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
												<SelectValue placeholder="Semua kategori" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Semua kategori</SelectItem>
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
				</>
			)}

			{/* Modifiers Tab */}
			{activeTab === 'modifiers' &&
				(modifiers.length === 0 ? (
					<EmptyState
						title="Belum ada modifier group"
						description="Modifier group digunakan untuk opsi tambahan (mis. Level Gula, Ukuran)."
						action={
							<Button size="sm" onClick={handleCreateModifier}>
								<PlusIcon className="size-4" />
								Tambah Modifier Group
							</Button>
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
								<div className="flex gap-1">
									<Button
										size="icon"
										variant="ghost"
										className="size-7"
										onClick={() => handleEditModifier(group)}
									>
										<EditIcon className="size-3.5" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										className="size-7"
										onClick={() => handleDeleteModifier(group)}
									>
										<TrashIcon className="size-3.5" />
									</Button>
								</div>
							</div>
						))}
					</div>
				))}
		</div>
	)
}
