import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { ArrowRightIcon, EditIcon, LoaderIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { formDialog } from '@/components/shared/form-dialog'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Button } from '@/components/ui/button'

import { conversionResource, uomResource } from '@/features/uom/api.ts'
import { ConversionFormBody } from '@/features/uom/components/conversion-form.tsx'
import { UomLabel } from '@/features/uom/components/uom-label.tsx'
import { UOM_CATEGORY_OPTIONS, UomCategoryEnum } from '@/features/uom/dto/index.ts'
import type { UomConversionDto, UomDto } from '@/features/uom/dto/index.ts'

const uomSearchSchema = listSearchSchema.extend({
	category: UomCategoryEnum.optional(),
})

export const Route = createFileRoute('/_authenticated/master/uom/')({
	validateSearch: uomSearchSchema,
	component: UomPage,
})

// ─── Table Columns ───

const col = createEntityColumns<UomDto>()

const baseColumns = [
	col.code('code', { header: 'Kode', size: 100 }),
	col.text('name', { header: 'Nama', size: 180 }),
	col.text('category', { header: 'Kategori', size: 120, cellProps: { className: 'capitalize' } }),
]

// ─── Page Component ───

function UomPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'uom.update' })
	const canDelete = usePermissionCheck({ permission: 'uom.delete' })

	const listQuery = useQuery({
		...uomResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			category: search.category,
		}),
		throwOnError: false,
	})
	const conversionsQuery = useQuery({
		...conversionResource.list.queryOptions(undefined),
		throwOnError: false,
	})

	const removeMut = useMutation(uomResource.remove.mutationOptions())
	const convRemoveMut = useMutation(conversionResource.remove.mutationOptions())

	const conversions = conversionsQuery.data?.data ?? []

	// ─── Handlers ───

	const { run: handleDelete, isPending: deletingUnit } = useWorkflowAction<UomDto>({
		availability: () => canDelete,
		confirmation: (unit) => ({
			title: 'Hapus satuan?',
			description: `Satuan "${unit.name}" (${unit.code}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
		}),
		execute: (unit) => removeMut.mutateAsync({ id: unit.id }),
		successMessage: 'Satuan berhasil dihapus.',
	})

	const handleAddConversion = useCallback(async () => {
		await formDialog({
			title: 'Tambah Konversi',
			description: 'Tentukan faktor konversi antara dua satuan.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<ConversionFormBody onSaved={() => close(true)} onCancel={() => close(false)} />
			),
		})
	}, [])

	const { run: handleDeleteConversion, isPending: deletingConversion } =
		useWorkflowAction<UomConversionDto>({
			availability: () => canDelete,
			confirmation: () => ({
				title: 'Hapus konversi?',
				description: 'Hapus konversi ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
				confirmLabel: 'Hapus',
				variant: 'destructive',
			}),
			execute: (conversion) => convRemoveMut.mutateAsync({ id: conversion.id }),
			successMessage: 'Konversi berhasil dihapus.',
		})

	// ─── Columns with actions ───

	const actionsColumn = useMemo(
		() =>
			col.actions({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (unit) => [
					canEdit && {
						label: 'Ubah',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/uom/$uomId',
								params: { uomId: String(unit.id) },
							}),
					},
					canDelete && {
						label: 'Hapus',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(unit),
						variant: 'destructive' as const,
						disabled: deletingUnit,
					},
				],
			}),
		[canEdit, canDelete, deletingUnit, handleDelete, navigate],
	)

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, UomDto>[],
		[actionsColumn],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.category !== undefined,
	})

	return (
		<>
			<EntityListPage
				title="Satuan"
				description="Kelola satuan dan faktor konversi."
				list={list}
				actions={
					<PermissionGate permission="uom.create">
						<Button size="sm" variant="outline" onClick={handleAddConversion}>
							<ArrowRightIcon className="size-4" />
							Tambah Konversi
						</Button>
					</PermissionGate>
				}
				createAction={
					<PermissionGate permission="uom.create">
						<Button onClick={() => navigate({ to: '/master/uom/new' })}>
							<PlusIcon className="size-4" />
							Tambah Satuan
						</Button>
					</PermissionGate>
				}
				emptyState={{
					title: 'Belum ada satuan',
					description: 'Mulai dengan membuat satuan pertama Anda.',
				}}
				emptyMessage="Tidak ada satuan yang cocok dengan pencarian Anda."
				toolbar={
					<TableToolbar
						searchValue={list.globalFilter}
						onSearchChange={(value) => list.table.setGlobalFilter(value)}
						searchPlaceholder="Cari satuan..."
						filters={[
							{
								key: 'category',
								label: 'Kategori',
								value: search.category,
								onChange: (value) =>
									list.setFilters({ category: value as UomCategoryEnum | undefined }),
								options: UOM_CATEGORY_OPTIONS,
								allLabel: 'Semua kategori',
							},
						]}
					/>
				}
			/>

			<div className="mt-6 space-y-3">
				<h3 className="text-sm font-medium">Konversi</h3>
				{conversionsQuery.isError && (
					<div
						role="alert"
						className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 p-3 text-sm"
					>
						<p>
							Gagal memuat konversi.{' '}
							{conversionsQuery.data ? 'Menampilkan konversi terakhir yang dimuat.' : ''}
						</p>
						<Button size="sm" variant="outline" onClick={() => void conversionsQuery.refetch()}>
							Coba lagi
						</Button>
					</div>
				)}
				{conversionsQuery.isLoading ? (
					<div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
						<LoaderIcon className="size-4 animate-spin" />
						Memuat konversi...
					</div>
				) : conversionsQuery.isError && !conversionsQuery.data ? null : conversions.length === 0 ? (
					<p className="py-4 text-sm text-muted-foreground">
						Belum ada konversi. Tambahkan minimal dua satuan, lalu buat konversi.
					</p>
				) : (
					<div className="divide-y rounded-md border">
						{conversions.map((conv) => (
							<div key={conv.id} className="flex items-start justify-between gap-3 px-4 py-3">
								<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
									<UomLabel id={conv.fromUomId} />
									<ArrowRightIcon
										className="size-3.5 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
									<UomLabel id={conv.toUomId} />
									<span className="min-w-0 break-all text-right font-mono tabular-nums text-muted-foreground sm:ml-auto">
										× {conv.factor}
									</span>
								</div>
								<PermissionGate permission="uom.delete">
									<Button
										size="icon"
										variant="ghost"
										className="shrink-0"
										aria-label="Hapus konversi"
										disabled={deletingConversion}
										onClick={() => handleDeleteConversion(conv)}
									>
										<TrashIcon className="size-3.5" />
									</Button>
								</PermissionGate>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	)
}
