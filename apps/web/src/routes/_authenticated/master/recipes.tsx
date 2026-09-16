import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { usePermissionCheck } from '@/components/shared/permission-gate'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { menuItemResource } from '@/features/menu/api.ts'
import { recipeExtras, recipeResource } from '@/features/recipe/api.ts'
import { RecipeFormBody } from '@/features/recipe/components/recipe-form.tsx'
import type { RecipeDto } from '@/features/recipe/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

// Recipe list has no server-side text search (RecipeFilterDto has no `q`), so
// the URL carries only pagination — no dead search box.
const recipesSearchSchema = listSearchSchema.omit({ q: true })

export const Route = createFileRoute('/_authenticated/master/recipes')({
	validateSearch: recipesSearchSchema,
	component: RecipesPage,
})

// ─── Helpers ───

function formatCurrency(value: string): string {
	const num = Number(value)
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(num)
}

// ─── HPP Cell ───

function HppCell({ menuItemId, locationId }: { menuItemId: number; locationId: number }) {
	const hppQuery = useQuery({
		...recipeExtras.hpp.queryOptions({ menuItemId, locationId }),
		enabled: !!menuItemId && !!locationId,
	})

	if (hppQuery.isLoading) return <span className="text-muted-foreground">...</span>
	if (!hppQuery.data?.data) return <span className="text-muted-foreground">—</span>

	return <span className="font-mono text-sm">{formatCurrency(hppQuery.data.data.hpp)}</span>
}

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, RecipeDto>()

const baseColumns = [
	col.accessor('name', { header: 'Nama Resep', size: 200 }),
	col.accessor('yieldQty', {
		header: 'Yield',
		size: 80,
		cell: ({ getValue }) => getValue(),
	}),
	col.accessor('isActive', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => (
			<Badge variant={getValue() ? 'default' : 'outline'}>
				{getValue() ? 'Active' : 'Inactive'}
			</Badge>
		),
	}),
]

// ─── Page Component ───

function RecipesPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const locationId = activeLocation?.id
	const canCreate = usePermissionCheck({ permission: 'recipe.create' })
	const canEdit = usePermissionCheck({ permission: 'recipe.update' })
	const canDelete = usePermissionCheck({ permission: 'recipe.delete' })

	// ─── Queries ───

	const listQuery = useQuery({
		...recipeResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
		}),
		enabled: !!locationId,
	})

	const menuItemsQuery = useQuery({
		...menuItemResource.list.queryOptions({ page: 1, limit: 200, locationId: locationId! }),
		enabled: !!locationId,
	})

	// ─── Mutations ───

	const createMut = useMutation(recipeResource.create.mutationOptions())
	const updateMut = useMutation(recipeResource.update.mutationOptions())
	const removeMut = useMutation(recipeResource.remove.mutationOptions())

	// ─── Derived Data ───

	const recipes = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const menuItemMap = useMemo(() => {
		const map = new Map<number, string>()
		for (const item of menuItemsQuery.data?.data ?? []) {
			map.set(item.id, item.name)
		}
		return map
	}, [menuItemsQuery.data])

	// ─── Handlers ───

	const handleCreate = useCallback(async () => {
		if (!locationId) return

		const saved = await formDialog({
			title: 'Tambah Resep',
			description: 'Definisikan resep (BOM) untuk menu item.',
			className: 'sm:max-w-lg',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<RecipeFormBody
					locationId={locationId}
					onSaved={() => close(true)}
					onCancel={() => close(false)}
					onSubmitValues={(v) => createMut.mutateAsync(v)}
				/>
			),
		})

		if (saved) {
			toast.add({ title: 'Resep berhasil dibuat.', type: 'success' })
		}
	}, [createMut, locationId])

	const handleEdit = useCallback(
		async (recipe: RecipeDto) => {
			if (!locationId) return

			const detailQuery = await recipeExtras.detail.fetch({ id: recipe.id })
			const detail = detailQuery?.data

			if (!detail) {
				toast.add({ title: 'Gagal memuat detail resep.', type: 'error' })
				return
			}

			const saved = await formDialog({
				title: 'Edit Resep',
				description: `Edit "${recipe.name}".`,
				className: 'sm:max-w-lg',
				// oxlint-disable-next-line react/no-unstable-nested-components
				content: ({ close }) => (
					<RecipeFormBody
						locationId={locationId}
						defaultValues={detail}
						onSaved={() => close(true)}
						onCancel={() => close(false)}
						onSubmitValues={(v) => updateMut.mutateAsync({ id: recipe.id, ...v })}
					/>
				),
			})

			if (saved) {
				toast.add({ title: 'Resep berhasil diperbarui.', type: 'success' })
			}
		},
		[updateMut, locationId],
	)

	const handleDelete = useCallback(
		async (recipe: RecipeDto) => {
			await confirm({
				title: 'Hapus resep?',
				description: `"${recipe.name}" akan dihapus permanen.`,
				confirmLabel: 'Hapus',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: recipe.id })
					toast.add({ title: 'Resep berhasil dihapus.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	// ─── Table Columns with HPP + Actions ───

	const menuItemColumn = useMemo(() => {
		return col.display({
			id: 'menuItem',
			header: 'Menu Item',
			size: 180,
			cell: ({ row }) => (
				<span className="text-sm">
					{menuItemMap.get(row.original.menuItemId) ?? `#${row.original.menuItemId}`}
				</span>
			),
		})
	}, [menuItemMap])

	const hppColumn = useMemo(() => {
		return col.display({
			id: 'hpp',
			header: 'HPP',
			size: 140,
			cell: ({ row }) =>
				locationId ? <HppCell menuItemId={row.original.menuItemId} locationId={locationId} /> : '—',
		})
	}, [locationId])

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
						onClick: () => handleEdit(row.original),
					})
				}
				if (canDelete) {
					items.push({
						label: 'Hapus',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(row.original),
						variant: 'destructive' as const,
					})
				}
				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [canEdit, canDelete, handleEdit, handleDelete])

	const columns = useMemo(
		() =>
			[...baseColumns, menuItemColumn, hppColumn, actionsColumn] as ColumnDef<
				DataGridFeatures,
				RecipeDto
			>[],
		[menuItemColumn, hppColumn, actionsColumn],
	)

	const { table } = useServerTable({
		data: recipes,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	// ─── No Location Guard ───

	if (!locationId) {
		return (
			<div className="space-y-6">
				<PageHeader title="Resep (BOM)" description="Kelola resep dan HPP menu item." />
				<EmptyState
					title="Belum ada lokasi dipilih"
					description="Pilih lokasi terlebih dahulu untuk mengelola resep."
				/>
			</div>
		)
	}

	const isEmpty = !listQuery.isLoading && recipes.length === 0

	return (
		<div className="space-y-6">
			<PageHeader
				title="Resep (BOM)"
				description={`Kelola resep dan HPP di ${activeLocation?.name ?? 'lokasi ini'}.`}
				actions={
					canCreate ? (
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Tambah Resep
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="Belum ada resep"
					description="Mulai dengan menambahkan resep pertama untuk menu item."
					action={
						canCreate ? (
							<Button size="sm" onClick={handleCreate}>
								<PlusIcon className="size-4" />
								Tambah Resep
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada resep yang cocok."
				/>
			)}
		</div>
	)
}
