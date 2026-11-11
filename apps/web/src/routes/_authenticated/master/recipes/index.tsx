import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import {
	createEntityColumns,
	listSearchSchema,
	rightAlignedHeader,
	useResourceList,
} from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { LocationRequiredPage } from '@/components/shared/location-required-page'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Button } from '@/components/ui/button'

import type { AuthLocation } from '@/features/auth/dto/index.ts'
import { recipeResource } from '@/features/recipe/api.ts'
import { RecipeHppCell, RecipeMenuItemLabel } from '@/features/recipe/components/recipe-cells.tsx'
import type { RecipeDto } from '@/features/recipe/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

// The recipe list endpoint filters only by page/limit/menuItemId, so the URL carries pagination
// alone — no text search or sorting the server would ignore.
const recipesSearchSchema = listSearchSchema.omit({ q: true, sort: true })

export const Route = createFileRoute('/_authenticated/master/recipes/')({
	validateSearch: recipesSearchSchema,
	component: RecipesRoute,
})

function RecipesRoute() {
	const { activeLocation } = useLocationContext()
	if (!activeLocation) {
		return (
			<LocationRequiredPage
				title="Resep (BOM)"
				description="Kelola resep dan HPP menu item."
				message="Pilih lokasi terlebih dahulu untuk mengelola resep."
			/>
		)
	}
	return <RecipesPage location={activeLocation} />
}

// ─── Table Columns ───

const col = createEntityColumns<RecipeDto>()
const display = createColumnHelper<DataGridFeatures, RecipeDto>()

function RecipesPage({ location }: { location: AuthLocation }) {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'recipe.update' })
	const canDelete = usePermissionCheck({ permission: 'recipe.delete' })

	const query = useQuery({
		...recipeResource.list.queryOptions({ page: search.page, limit: search.pageSize }),
		throwOnError: false,
	})

	const { run: handleDelete, isPending: deleting } = useWorkflowAction<RecipeDto>({
		availability: () => canDelete,
		confirmation: (recipe) => ({
			title: 'Hapus resep?',
			description: `"${recipe.name}" akan dihapus permanen.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
		}),
		execute: (recipe) => recipeResource.remove.fetch({ id: recipe.id }),
		successMessage: 'Resep berhasil dihapus.',
	})

	const columns = useMemo(
		() =>
			[
				col.text('name', { header: 'Nama Resep', size: 200, enableSorting: false }),
				display.display({
					id: 'menuItem',
					header: 'Menu Item',
					size: 180,
					enableSorting: false,
					// oxlint-disable-next-line react/no-unstable-nested-components
					cell: ({ row }) => <RecipeMenuItemLabel id={row.original.menuItemId} />,
				}),
				col.text('yieldQty', {
					header: rightAlignedHeader('Yield'),
					size: 80,
					enableSorting: false,
					cellProps: { className: 'block text-right font-mono tabular-nums' },
				}),
				col.booleanStatus('isActive', { header: 'Status', size: 100, enableSorting: false }),
				display.display({
					id: 'hpp',
					header: rightAlignedHeader('HPP'),
					size: 200,
					enableSorting: false,
					// oxlint-disable-next-line react/no-unstable-nested-components
					cell: ({ row }) => <RecipeHppCell recipe={row.original} locationId={location.id} />,
				}),
				col.actions({
					// oxlint-disable-next-line react/no-unstable-nested-components -- action-item factory, not a rendered component
					getItems: (recipe) => [
						canEdit && {
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () =>
								navigate({
									to: '/master/recipes/$recipeId',
									params: { recipeId: String(recipe.id) },
								}),
						},
						canDelete && {
							label: 'Hapus',
							icon: <TrashIcon className="size-4" />,
							onClick: () => handleDelete(recipe),
							variant: 'destructive' as const,
							disabled: deleting,
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, RecipeDto>[],
		[canEdit, canDelete, deleting, handleDelete, location.id, navigate],
	)

	const list = useResourceList({
		query,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	return (
		<EntityListPage
			title="Resep (BOM)"
			description={`Daftar resep berlaku untuk semua lokasi. HPP dan pilihan bahan mengikuti lokasi aktif: ${location.name}.`}
			list={list}
			createAction={
				<PermissionGate permission="recipe.create">
					<Button size="sm" onClick={() => navigate({ to: '/master/recipes/new' })}>
						<PlusIcon className="size-4" />
						Tambah Resep
					</Button>
				</PermissionGate>
			}
			emptyState={{
				title: 'Belum ada resep',
				description: 'Mulai dengan menambahkan resep pertama untuk menu item.',
			}}
			emptyMessage="Tidak ada resep yang cocok."
		/>
	)
}
