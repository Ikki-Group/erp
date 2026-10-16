import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { toDisplayCurrency } from '@/lib/currency'

import {
	createEntityColumns,
	DataTable,
	EmptyCell,
	rightAlignedHeader,
	TextCell,
	useResourceList,
} from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { formDialog } from '@/components/shared/form-dialog'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Button } from '@/components/ui/button'

import { materialResource } from '@/features/material/api'
import { uomResource } from '@/features/uom/api'

import { pricingResource } from '../api.ts'
import type { SupplierMaterialDto } from '../dto/index.ts'
import { PricingForm } from './pricing-form'

interface PricingLabelProps {
	id: number
	kind: 'Material' | 'UoM'
	record?: { name: string; code: string }
	isError: boolean
	isFetching: boolean
	retry: () => void
}

function PricingLabel({ id, kind, record, isError, isFetching, retry }: PricingLabelProps) {
	return (
		<div className="min-w-0 space-y-1">
			{record ? (
				<>
					{kind === 'Material' && <TextCell value={record.name} truncate />}
					<TextCell value={record.code} mono muted={kind === 'Material'} />
				</>
			) : (
				<TextCell value={`${kind} #${id} — ${isError ? 'unavailable' : 'loading…'}`} muted />
			)}
			{isError && (
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={isFetching}
					aria-label={`Retry ${kind.toLowerCase()} #${id}`}
					onClick={retry}
				>
					Retry label
				</Button>
			)}
		</div>
	)
}

function PricingMaterial({ id }: { id: number }) {
	const query = useQuery({
		...materialResource.detail.queryOptions({ id }),
		throwOnError: false,
	})
	return (
		<PricingLabel
			id={id}
			kind="Material"
			record={query.data?.data}
			isError={query.isError}
			isFetching={query.isFetching}
			retry={() => void query.refetch()}
		/>
	)
}

function PricingUom({ id }: { id: number }) {
	const query = useQuery({
		...uomResource.detail.queryOptions({ id }),
		throwOnError: false,
	})
	return (
		<PricingLabel
			id={id}
			kind="UoM"
			record={query.data?.data}
			isError={query.isError}
			isFetching={query.isFetching}
			retry={() => void query.refetch()}
		/>
	)
}

const col = createEntityColumns<SupplierMaterialDto>()
const baseColumns = [
	col.text('materialId', {
		header: 'Material',
		size: 240,
		enableSorting: false,
		cell: ({ row }) => <PricingMaterial id={row.original.materialId} />,
	}),
	col.text('unitPrice', {
		header: rightAlignedHeader('Unit Price'),
		size: 170,
		enableSorting: false,
		cell: ({ row }) => (
			<TextCell
				value={`Rp ${toDisplayCurrency(row.original.unitPrice)}`}
				mono
				className="block text-right tabular-nums"
			/>
		),
	}),
	col.text('uomId', {
		header: 'UoM',
		size: 100,
		enableSorting: false,
		cell: ({ row }) => <PricingUom id={row.original.uomId} />,
	}),
	col.text('minOrderQty', {
		header: rightAlignedHeader('Min Order Qty'),
		size: 140,
		enableSorting: false,
		cell: ({ row }) =>
			row.original.minOrderQty === null ? (
				<EmptyCell className="block text-right" />
			) : (
				<TextCell
					value={toDisplayCurrency(row.original.minOrderQty)}
					mono
					className="block text-right tabular-nums"
				/>
			),
	}),
]

export interface PricingPermissions {
	read: boolean
	create: boolean
	update: boolean
	delete: boolean
}

interface PricingTableProps {
	supplierId: number
	/** Resolve in the authenticated route: callable dialog roots do not inherit auth context. */
	permissions: PricingPermissions
}

/** Each supplier opens a new local pagination session; no dialog state enters the route URL. */
export function PricingTable({ supplierId, permissions }: PricingTableProps) {
	if (!permissions.read)
		return <p role="alert">You do not have permission to view supplier pricing.</p>
	return <SupplierPricingList key={supplierId} supplierId={supplierId} permissions={permissions} />
}

function SupplierPricingList({ supplierId, permissions }: PricingTableProps) {
	const [search, setSearch] = useState({ page: 1, pageSize: 20 })
	const [editing, setEditing] = useState(false)
	const editorOpen = useRef(false)
	const { create: canCreate, update: canUpdate, delete: canDelete } = permissions
	const listQuery = useQuery({
		...pricingResource.list.queryOptions({ supplierId, page: search.page, limit: search.pageSize }),
		throwOnError: false,
	})
	const totalPages = Math.max(1, listQuery.data?.meta.totalPages ?? search.page)

	useEffect(() => {
		if (listQuery.isSuccess && !listQuery.isFetching && search.page > totalPages) {
			setSearch((current) => ({ ...current, page: totalPages }))
		}
	}, [listQuery.isSuccess, listQuery.isFetching, search.page, totalPages])

	const handleEdit = useCallback(
		async (pricing?: SupplierMaterialDto) => {
			if (editorOpen.current || (pricing ? !canUpdate : !canCreate)) return
			editorOpen.current = true
			setEditing(true)
			try {
				await formDialog({
					title: pricing ? 'Edit Pricing' : 'Add Material Pricing',
					description: pricing
						? 'Update the price and ordering unit for this material.'
						: 'Set the price for a material from this supplier.',
					className: 'max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg',
					// oxlint-disable-next-line react/no-unstable-nested-components
					content: ({ close }) => (
						<PricingForm
							key={pricing?.id ?? 'new'}
							supplierId={supplierId}
							pricing={pricing}
							canSave={permissions.read && (pricing ? canUpdate : canCreate)}
							onSaved={() => close(true)}
							onCancel={() => close(false)}
						/>
					),
				})
			} finally {
				editorOpen.current = false
				setEditing(false)
			}
		},
		[canCreate, canUpdate, permissions.read, supplierId],
	)

	const { run: handleRemove, isPending: removing } = useWorkflowAction<SupplierMaterialDto>({
		availability: () => permissions.read && canDelete && !editorOpen.current,
		confirmation: (pricing) => ({
			title: 'Remove pricing?',
			description: `Remove the price for material #${pricing.materialId}? This action cannot be undone.`,
			confirmLabel: 'Remove',
			variant: 'destructive',
		}),
		execute: async (pricing) => {
			await pricingResource.remove.fetch({ id: pricing.id })
			if (listQuery.data?.data.length === 1 && search.page > 1) {
				setSearch((current) =>
					current.page === search.page ? { ...current, page: current.page - 1 } : current,
				)
			}
		},
		successMessage: 'Pricing removed.',
	})

	const columns = useMemo(
		() =>
			[
				...baseColumns,
				col.actions({
					label: 'Pricing actions',
					// oxlint-disable-next-line react/no-unstable-nested-components
					getItems: (pricing) => [
						canUpdate && {
							label: 'Edit',
							icon: <EditIcon className="size-4" />,
							onClick: () => handleEdit(pricing),
							disabled: editing || removing,
						},
						canDelete && {
							label: 'Remove',
							icon: <TrashIcon className="size-4" />,
							onClick: () => handleRemove(pricing),
							variant: 'destructive' as const,
							disabled: editing || removing,
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, SupplierMaterialDto>[],
		[canUpdate, canDelete, editing, removing, handleEdit, handleRemove],
	)
	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: setSearch,
	})

	return (
		<div className="min-w-0 space-y-3" aria-busy={list.isRefreshing}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">Prices and minimum quantities by material.</p>
				{canCreate && (
					<Button size="sm" onClick={() => handleEdit()} disabled={editing || removing}>
						<PlusIcon className="size-4" />
						Add Pricing
					</Button>
				)}
			</div>
			{list.state === 'refresh-error' && (
				<div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-sm">
					<p>Could not refresh pricing. Showing the last loaded results.</p>
					<Button size="sm" variant="outline" disabled={list.isRefreshing} onClick={list.retry}>
						Retry
					</Button>
				</div>
			)}
			{list.isRefreshing && (
				<p role="status" className="text-xs text-muted-foreground">
					Refreshing pricing…
				</p>
			)}
			<DataTable
				table={list.table}
				recordCount={list.recordCount}
				isLoading={list.state === 'initial-loading'}
				isError={list.state === 'initial-error'}
				errorTitle="Could not load pricing"
				errorMessage="Try again to load this supplier's material pricing."
				onRetry={list.retry}
				emptyMessage="No pricing entries for this supplier."
				showPagination={false}
			/>
			<div className="flex flex-wrap items-center justify-end gap-2">
				<Button
					size="sm"
					variant="outline"
					disabled={search.page <= 1}
					onClick={() => setSearch((current) => ({ ...current, page: current.page - 1 }))}
				>
					Previous
				</Button>
				<span className="text-xs text-muted-foreground">
					Page {search.page} of {totalPages}
				</span>
				<Button
					size="sm"
					variant="outline"
					disabled={search.page >= totalPages}
					onClick={() => setSearch((current) => ({ ...current, page: current.page + 1 }))}
				>
					Next
				</Button>
			</div>
		</div>
	)
}
