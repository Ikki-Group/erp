import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowRightIcon, EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

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

import { conversionResource, uomResource } from '@/features/uom/api.ts'
import { ConversionForm } from '@/features/uom/components/conversion-form.tsx'
import type { ConversionFormRef } from '@/features/uom/components/conversion-form.tsx'
import { UomForm } from '@/features/uom/components/uom-form.tsx'
import type { UomFormRef } from '@/features/uom/components/uom-form.tsx'
import type { UomConversionDto, UomDto } from '@/features/uom/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/uom')({
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
	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	const listQuery = useQuery(uomResource.list.queryOptions(listParams))
	const conversionsQuery = useQuery(conversionResource.list.queryOptions(undefined))

	const createMut = useMutation(uomResource.create.mutationOptions())
	const updateMut = useMutation(uomResource.update.mutationOptions())
	const removeMut = useMutation(uomResource.remove.mutationOptions())
	const convCreateMut = useMutation(conversionResource.create.mutationOptions())
	const convRemoveMut = useMutation(conversionResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const conversions = conversionsQuery.data?.data ?? []

	const unitMap = useMemo(() => {
		const map = new Map<number, UomDto>()
		for (const unit of data) {
			map.set(unit.id, unit)
		}
		return map
	}, [data])

	const getUnitLabel = useCallback(
		(id: number) => {
			const unit = unitMap.get(id)
			return unit ? `${unit.name} (${unit.code})` : `#${id}`
		},
		[unitMap],
	)

	// ─── Handlers ───

	const handleCreate = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<UomFormRef | null>

		const saved = await formDialog({
			title: 'Add Unit',
			description: 'Create a new unit of measure.',
			submitLabel: 'Create',
			content: (
				<UomForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const values = formRef.current!.getValues()
				await createMut.mutateAsync({
					code: values.code,
					name: values.name,
					category: values.category as UomDto['category'],
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Unit created successfully.', type: 'success' })
		}
	}, [createMut])

	const handleEdit = useCallback(
		async (unit: UomDto) => {
			const formRef = { current: null } as React.MutableRefObject<UomFormRef | null>

			const saved = await formDialog({
				title: 'Edit Unit',
				description: `Update details for ${unit.name}.`,
				submitLabel: 'Save Changes',
				content: (
					<UomForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={unit}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const values = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: unit.id,
						code: values.code,
						name: values.name,
						category: values.category as UomDto['category'],
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Unit updated successfully.', type: 'success' })
			}
		},
		[updateMut],
	)

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
		const formRef = { current: null } as React.MutableRefObject<ConversionFormRef | null>

		const saved = await formDialog({
			title: 'Add Conversion',
			description: 'Define a conversion factor between two units.',
			submitLabel: 'Create',
			content: (
				<ConversionForm
					ref={(el) => {
						formRef.current = el
					}}
					units={data}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const values = formRef.current!.getValues()
				await convCreateMut.mutateAsync({
					fromUomId: Number(values.fromUomId),
					toUomId: Number(values.toUomId),
					factor: values.factor,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Conversion created successfully.', type: 'success' })
		}
	}, [convCreateMut, data])

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
			cell: ({ row }) => (
				<ActionMenu
					items={[
						{
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () => handleEdit(row.original),
						},
						{
							label: 'Delete',
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
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, UomDto>[],
		[actionsColumn],
	)

	const { table, globalFilter, setGlobalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		pageSize: listParams.limit,
		onStateChange: (params) => {
			setListParams({
				page: params.page + 1,
				limit: params.pageSize,
				q: params.search || undefined,
			})
		},
	})

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Units of Measure"
				description="Manage units and conversion factors."
				actions={
					<div className="flex gap-2">
						<Button size="sm" variant="outline" onClick={handleAddConversion} disabled={data.length < 2}>
							<ArrowRightIcon className="size-4" />
							Add Conversion
						</Button>
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Unit
						</Button>
					</div>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No units yet"
					description="Get started by creating your first unit of measure."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Unit
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No units match your search."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search units..."
						/>
					}
				/>
			)}

			{conversions.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Conversions</h3>
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
				</div>
			)}
		</div>
	)
}
