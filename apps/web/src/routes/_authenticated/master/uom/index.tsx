import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowRightIcon, EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { listSearchSchema, TextCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import { confirm } from '@/components/shared/confirm'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { formDialog } from '@/components/shared/form-dialog'
import { PageError } from '@/components/shared/page-error'
import { PageSection } from '@/components/shared/page-section'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'

import { conversionResource, uomResource } from '@/features/uom/api.ts'
import { ConversionFormBody } from '@/features/uom/components/conversion-form.tsx'
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

const col = createColumnHelper<DataGridFeatures, UomDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 100,
		// oxlint-disable-next-line react/no-unstable-nested-components
		cell: ({ getValue }) => <TextCell value={getValue()} mono muted />,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 180,
		// oxlint-disable-next-line react/no-unstable-nested-components
		cell: ({ getValue }) => <TextCell value={getValue()} truncate />,
	}),
	col.accessor('category', {
		header: 'Category',
		size: 120,
		cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
	}),
]

// ─── Page Component ───

function UomPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canEdit = usePermissionCheck({ permission: 'uom.update' })
	const canDelete = usePermissionCheck({ permission: 'uom.delete' })

	const listQuery = useQuery(
		uomResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			category: search.category,
		}),
	)
	// ponytail: server caps `limit` at 100; labels for units beyond the first 100 fall back to `#id`.
	const allUnitsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))
	const conversionsQuery = useQuery(conversionResource.list.queryOptions(undefined))

	const removeMut = useMutation(uomResource.remove.mutationOptions())
	const convCreateMut = useMutation(conversionResource.create.mutationOptions())
	const convRemoveMut = useMutation(conversionResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const allUnits = allUnitsQuery.data?.data ?? []
	const conversions = conversionsQuery.data?.data ?? []

	const unitMap = useMemo(() => {
		const map = new Map<number, UomDto>()
		for (const unit of allUnits) {
			map.set(unit.id, unit)
		}
		return map
	}, [allUnits])

	const getUnitLabel = useCallback(
		(id: number) => {
			const unit = unitMap.get(id)
			return unit ? `${unit.name} (${unit.code})` : `#${id}`
		},
		[unitMap],
	)

	// ─── Handlers ───

	const handleDelete = useCallback(
		async (unit: UomDto) => {
			await confirm({
				title: 'Delete unit?',
				description: `This will permanently delete "${unit.name}" (${unit.code}). This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: unit.id })
					toast.add({ title: 'Unit deleted successfully.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	const handleAddConversion = useCallback(async () => {
		const saved = await formDialog({
			title: 'Add Conversion',
			description: 'Define a conversion factor between two units.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<ConversionFormBody
					units={allUnits}
					onSaved={() => close(true)}
					onCancel={() => close(false)}
					onCreate={(values) => convCreateMut.mutateAsync(values)}
				/>
			),
		})

		if (saved) {
			toast.add({ title: 'Conversion created successfully.', type: 'success' })
		}
	}, [convCreateMut, allUnits])

	const handleDeleteConversion = useCallback(
		async (conversion: UomConversionDto) => {
			const from = getUnitLabel(conversion.fromUomId)
			const to = getUnitLabel(conversion.toUomId)

			await confirm({
				title: 'Delete conversion?',
				description: `Remove the conversion from ${from} to ${to}?`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await convRemoveMut.mutateAsync({ id: conversion.id })
					toast.add({ title: 'Conversion deleted successfully.', type: 'success' })
				},
			})
		},
		[convRemoveMut, getUnitLabel],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(
		() =>
			createActionColumn<UomDto>({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (unit) => [
					canEdit && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/master/uom/$uomId/edit',
								params: { uomId: String(unit.id) },
							}),
					},
					canDelete && {
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(unit),
						variant: 'destructive' as const,
					},
				],
			}),
		[canEdit, canDelete, handleDelete, navigate],
	)

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, UomDto>[],
		[actionsColumn],
	)

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const isEmpty =
		!listQuery.isLoading &&
		!listQuery.isError &&
		data.length === 0 &&
		!globalFilter &&
		!search.category

	return (
		<div className="space-y-8">
			<EntityListPage
				title="Units of Measure"
				description="Manage units and conversion factors."
				actions={
					<PermissionGate permission="uom.create">
						<Button size="sm" onClick={() => navigate({ to: '/master/uom/new' })}>
							<PlusIcon className="size-4" />
							Add Unit
						</Button>
					</PermissionGate>
				}
				table={table}
				recordCount={totalCount}
				isLoading={listQuery.isFetching}
				isError={listQuery.isError}
				onRetry={() => void listQuery.refetch()}
				onRowClick={(unit) =>
					navigate({ to: '/master/uom/$uomId', params: { uomId: String(unit.id) } })
				}
				isEmpty={isEmpty}
				emptyState={{
					title: 'No units yet',
					description: 'Get started by creating your first unit of measure.',
					action: (
						<PermissionGate permission="uom.create">
							<Button size="sm" onClick={() => navigate({ to: '/master/uom/new' })}>
								<PlusIcon className="size-4" />
								Add Unit
							</Button>
						</PermissionGate>
					),
				}}
				emptyMessage="No units match your search."
				toolbar={
					<TableToolbar
						searchValue={globalFilter}
						onSearchChange={(value) => table.setGlobalFilter(value)}
						searchPlaceholder="Search units..."
						filters={[
							{
								key: 'category',
								label: 'Category',
								value: search.category,
								onChange: (v) =>
									navigate({
										search: {
											...search,
											page: 1,
											category: v as UomCategoryEnum | undefined,
										},
									}),
								options: UOM_CATEGORY_OPTIONS,
								allLabel: 'All categories',
							},
						]}
					/>
				}
			/>

			<PageSection
				title="Conversions"
				description="Factors used to convert between units."
				actions={
					<PermissionGate permission="uom.create">
						<Button
							size="sm"
							variant="outline"
							onClick={handleAddConversion}
							disabled={allUnits.length < 2}
						>
							<ArrowRightIcon className="size-4" />
							Add Conversion
						</Button>
					</PermissionGate>
				}
			>
				{conversionsQuery.isError ? (
					<PageError
						message="Could not load conversions."
						onRetry={() => void conversionsQuery.refetch()}
					/>
				) : conversionsQuery.isLoading ? (
					<Skeleton className="h-24 w-full" />
				) : conversions.length === 0 ? (
					<p className="text-xs text-muted-foreground">
						No conversions defined yet. Add at least two units, then create a conversion.
					</p>
				) : (
					<ul className="divide-y rounded-lg border">
						{conversions.map((conv) => (
							<li
								key={conv.id}
								className="flex min-h-10 items-center justify-between gap-2 px-4 py-1.5"
							>
								<div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
									<span>{getUnitLabel(conv.fromUomId)}</span>
									<ArrowRightIcon className="size-3.5 text-muted-foreground" aria-label="to" />
									<span>{getUnitLabel(conv.toUomId)}</span>
									<span className="font-mono text-xs tabular-nums text-muted-foreground">
										× {conv.factor}
									</span>
								</div>
								{canDelete && (
									<Button
										size="icon-sm"
										variant="ghost"
										aria-label="Delete conversion"
										onClick={() => handleDeleteConversion(conv)}
									>
										<TrashIcon className="size-3.5" />
									</Button>
								)}
							</li>
						))}
					</ul>
				)}
			</PageSection>
		</div>
	)
}
