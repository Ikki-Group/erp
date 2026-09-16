import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowRightIcon, EditIcon, LoaderIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { conversionResource, uomListAll, uomResource } from '@/features/uom/api.ts'
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
	}),
	col.accessor('name', {
		header: 'Name',
		size: 180,
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
	const allUnitsQuery = useQuery(uomListAll.queryOptions({ page: 1, limit: 999 }))
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
						onClick: () =>
							navigate({
								to: '/master/uom/$uomId',
								params: { uomId: String(row.original.id) },
							}),
					})
				}
				if (canDelete) {
					items.push({
						label: 'Delete',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(row.original),
						variant: 'destructive' as const,
					})
				}
				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [canEdit, canDelete, handleDelete, navigate])

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

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter && !search.category

	return (
		<div className="space-y-6">
			<PageHeader
				title="Units of Measure"
				description="Manage units and conversion factors."
				actions={
					<div className="flex gap-2">
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
						<PermissionGate permission="uom.create">
							<Button size="sm" onClick={() => navigate({ to: '/master/uom/new' })}>
								<PlusIcon className="size-4" />
								Add Unit
							</Button>
						</PermissionGate>
					</div>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No units yet"
					description="Get started by creating your first unit of measure."
					action={
						<PermissionGate permission="uom.create">
							<Button size="sm" onClick={() => navigate({ to: '/master/uom/new' })}>
								<PlusIcon className="size-4" />
								Add Unit
							</Button>
						</PermissionGate>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
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
			)}

			<div className="space-y-3">
				<h3 className="text-sm font-medium">Conversions</h3>
				{conversionsQuery.isLoading ? (
					<div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
						<LoaderIcon className="size-4 animate-spin" />
						Loading conversions...
					</div>
				) : conversions.length === 0 ? (
					<p className="py-4 text-sm text-muted-foreground">
						No conversions defined yet. Add at least two units, then create a conversion.
					</p>
				) : (
					<div className="divide-y rounded-md border">
						{conversions.map((conv) => (
							<div key={conv.id} className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center gap-2 text-sm">
									<Badge variant="secondary">{getUnitLabel(conv.fromUomId)}</Badge>
									<ArrowRightIcon className="size-3.5 text-muted-foreground" />
									<Badge variant="secondary">{getUnitLabel(conv.toUomId)}</Badge>
									<span className="text-muted-foreground">× {conv.factor}</span>
								</div>
								<Button
									size="icon"
									variant="ghost"
									className="size-7"
									onClick={() => handleDeleteConversion(conv)}
								>
									<TrashIcon className="size-3.5" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
