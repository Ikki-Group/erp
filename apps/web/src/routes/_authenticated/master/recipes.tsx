import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

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
import { toast } from '@/components/ui/toast'

import { recipeExtras, recipeResource } from '@/features/recipe/api.ts'
import { RecipeForm } from '@/features/recipe/components/recipe-form.tsx'
import type { RecipeFormRef, RecipeFormValues } from '@/features/recipe/components/recipe-form.tsx'
import type { RecipeDto } from '@/features/recipe/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/master/recipes')({
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

function formToCreatePayload(v: RecipeFormValues) {
	return {
		menuItemId: Number(v.menuItemId),
		name: v.name,
		yieldQty: v.yieldQty,
		lines: v.lines.map((l) => ({
			materialId: Number(l.materialId),
			quantity: l.quantity,
			uomId: Number(l.uomId),
		})),
	}
}

function formToUpdatePayload(v: RecipeFormValues, id: number) {
	return {
		id,
		name: v.name,
		yieldQty: v.yieldQty,
		lines: v.lines.map((l) => ({
			materialId: Number(l.materialId),
			quantity: l.quantity,
			uomId: Number(l.uomId),
		})),
	}
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
	const locationId = activeLocation?.id

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	// ─── Queries ───

	const listQuery = useQuery({
		...recipeResource.list.queryOptions(listParams),
		enabled: !!locationId,
	})

	// ─── Mutations ───

	const createMut = useMutation(recipeResource.create.mutationOptions())
	const updateMut = useMutation(recipeResource.update.mutationOptions())
	const removeMut = useMutation(recipeResource.remove.mutationOptions())

	// ─── Derived Data ───

	const recipes = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	// ─── Handlers ───

	const handleCreate = useCallback(async () => {
		if (!locationId) return
		const formRef = { current: null } as React.MutableRefObject<RecipeFormRef | null>

		const saved = await formDialog({
			title: 'Tambah Resep',
			description: 'Definisikan resep (BOM) untuk menu item.',
			submitLabel: 'Simpan',
			content: (
				<RecipeForm
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
				await createMut.mutateAsync(formToCreatePayload(v))
			},
		})

		if (saved) {
			toast.add({ title: 'Resep berhasil dibuat.', type: 'success' })
		}
	}, [createMut, locationId])

	const handleEdit = useCallback(
		async (recipe: RecipeDto) => {
			if (!locationId) return
			const formRef = { current: null } as React.MutableRefObject<RecipeFormRef | null>

			const detailQuery = await recipeExtras.detail.fetch({ id: recipe.id })
			const detail = detailQuery?.data

			if (!detail) {
				toast.add({ title: 'Gagal memuat detail resep.', type: 'error' })
				return
			}

			const saved = await formDialog({
				title: 'Edit Resep',
				description: `Edit "${recipe.name}".`,
				submitLabel: 'Simpan',
				content: (
					<RecipeForm
						ref={(el) => {
							formRef.current = el
						}}
						locationId={locationId}
						defaultValues={detail}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Mohon perbaiki error validasi.')
					const v = formRef.current!.getValues()
					await updateMut.mutateAsync(formToUpdatePayload(v, recipe.id))
				},
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
			cell: ({ row }) => (
				<ActionMenu
					items={[
						{
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () => handleEdit(row.original),
						},
						{
							label: 'Hapus',
							icon: <TrashIcon className="size-4" />,
							onClick: () => handleDelete(row.original),
							variant: 'destructive' as const,
						},
					]}
				/>
			),
		})
	}, [handleEdit, handleDelete])

	const columns = useMemo(
		() => [...baseColumns, hppColumn, actionsColumn] as ColumnDef<DataGridFeatures, RecipeDto>[],
		[hppColumn, actionsColumn],
	)

	const { table, globalFilter, setGlobalFilter } = useServerTable({
		data: recipes,
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
				<PageHeader title="Resep (BOM)" description="Kelola resep dan HPP menu item." />
				<EmptyState
					title="Belum ada lokasi dipilih"
					description="Pilih lokasi terlebih dahulu untuk mengelola resep."
				/>
			</div>
		)
	}

	const isEmpty = !listQuery.isLoading && recipes.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Resep (BOM)"
				description={`Kelola resep dan HPP di ${activeLocation?.name ?? 'lokasi ini'}.`}
				actions={
					<Button size="sm" onClick={handleCreate}>
						<PlusIcon className="size-4" />
						Tambah Resep
					</Button>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="Belum ada resep"
					description="Mulai dengan menambahkan resep pertama untuk menu item."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Tambah Resep
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada resep yang cocok."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Cari resep..."
						/>
					}
				/>
			)}
		</div>
	)
}
