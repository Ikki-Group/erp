import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { LockIcon, UnlockIcon } from 'lucide-react'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { shiftResource } from '@/features/pos/api.ts'
import { ShiftCloseFormBody } from '@/features/pos/components/shift-close-form.tsx'
import { ShiftOpenFormBody } from '@/features/pos/components/shift-open-form.tsx'
import { ShiftStatusEnum } from '@/features/pos/dto/index.ts'
import type { ShiftDto } from '@/features/pos/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

// Shifts have no free-text search server-side; only pagination + a status filter.
const shiftSearchSchema = listSearchSchema.omit({ q: true }).extend({
	status: ShiftStatusEnum.optional(),
})

export const Route = createFileRoute('/_authenticated/pos/shifts')({
	validateSearch: shiftSearchSchema,
	component: ShiftsPage,
})

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, ShiftDto>()

const baseColumns = [
	col.accessor('id', {
		header: 'ID',
		size: 60,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => {
			const status = getValue()
			return (
				<StatusBadge variant={status === 'open' ? 'success' : 'default'}>
					{status === 'open' ? 'Open' : 'Closed'}
				</StatusBadge>
			)
		},
	}),
	col.accessor('openingCash', {
		header: 'Opening Cash',
		size: 140,
		cell: ({ getValue }) => Number(getValue()).toLocaleString('id-ID'),
	}),
	col.accessor('closingCash', {
		header: 'Closing Cash',
		size: 140,
		cell: ({ getValue }) => {
			const val = getValue()
			return val ? (
				Number(val).toLocaleString('id-ID')
			) : (
				<span className="text-muted-foreground">—</span>
			)
		},
	}),
	col.accessor('openedAt', {
		header: 'Opened',
		size: 160,
		cell: ({ getValue }) => new Date(getValue()).toLocaleString('id-ID'),
	}),
	col.accessor('closedAt', {
		header: 'Closed',
		size: 160,
		cell: ({ getValue }) => {
			const val = getValue()
			return val ? (
				new Date(val).toLocaleString('id-ID')
			) : (
				<span className="text-muted-foreground">—</span>
			)
		},
	}),
]

// ─── Page Component ───

function ShiftsPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id
	const canOpen = usePermissionCheck({ permission: 'shift.open' })
	const canClose = usePermissionCheck({ permission: 'shift.close' })

	const listQuery = useQuery({
		...shiftResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			status: search.status,
			locationId: locationId!,
		}),
		enabled: !!locationId,
	})

	// Active-shift key is location-scoped inside the endpoint — no override here.
	const activeShiftQuery = useQuery({
		...shiftResource.active.queryOptions(),
		enabled: !!locationId,
	})

	const openMut = useMutation(shiftResource.open.mutationOptions())
	const closeMut = useMutation(shiftResource.close.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const activeShift = activeShiftQuery.data?.data ?? null

	const handleOpenShift = useCallback(async () => {
		if (!locationId) return

		const saved = await formDialog({
			title: 'Open Shift',
			description: 'Start a new cashier shift. Count your opening cash.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<ShiftOpenFormBody
					onSaved={() => close(true)}
					onCancel={() => close(false)}
					onCreate={(values) =>
						openMut.mutateAsync({
							locationId,
							openingCash: Number(values.openingCash),
						})
					}
				/>
			),
		})

		if (saved) {
			toast.add({ title: 'Shift opened successfully.', type: 'success' })
		}
	}, [openMut, locationId])

	const handleCloseShift = useCallback(async () => {
		if (!activeShift) return

		const saved = await formDialog({
			title: 'Close Shift',
			description: 'End your current shift. Count the cash drawer.',
			// oxlint-disable-next-line react/no-unstable-nested-components
			content: ({ close }) => (
				<ShiftCloseFormBody
					expectedCash={activeShift.expectedCash}
					onSaved={() => close(true)}
					onCancel={() => close(false)}
					onCreate={(values) =>
						closeMut.mutateAsync({
							shiftId: activeShift.id,
							closingCash: Number(values.closingCash),
							notes: values.notes,
						})
					}
				/>
			),
		})

		if (saved) {
			toast.add({ title: 'Shift closed successfully.', type: 'success' })
		}
	}, [closeMut, activeShift])

	// ─── Columns ───

	const columns = useMemo(() => baseColumns as ColumnDef<DataGridFeatures, ShiftDto>[], [])

	const { table } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	if (!locationId) {
		return (
			<div className="space-y-6">
				<PageHeader title="Shifts" description="Manage cashier shifts for this location." />
				<EmptyState
					title="No location selected"
					description="Please select a location to manage shifts."
				/>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Shifts"
				description="Manage cashier shifts for this location."
				actions={
					<div className="flex items-center gap-3">
						{activeShift && (
							<Badge variant="outline" className="gap-1.5 px-3 py-1">
								<span className="size-2 rounded-full bg-success" />
								Shift active
							</Badge>
						)}
						{activeShift
							? canClose && (
									<Button size="sm" variant="outline" onClick={handleCloseShift}>
										<LockIcon className="size-4" />
										Close Shift
									</Button>
								)
							: canOpen && (
									<Button size="sm" onClick={handleOpenShift}>
										<UnlockIcon className="size-4" />
										Open Shift
									</Button>
								)}
					</div>
				}
			/>

			{data.length === 0 && !listQuery.isLoading && !search.status ? (
				<EmptyState
					title="No shifts yet"
					description="Open your first shift to start tracking cash."
					action={
						!activeShift && canOpen ? (
							<Button size="sm" onClick={handleOpenShift}>
								<UnlockIcon className="size-4" />
								Open Shift
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No shifts found."
					toolbar={
						<TableToolbar
							filters={[
								{
									key: 'status',
									label: 'Status',
									value: search.status,
									onChange: (v) =>
										navigate({
											search: { ...search, page: 1, status: v as ShiftStatusEnum | undefined },
										}),
									options: [
										{ label: 'Open', value: 'open' },
										{ label: 'Closed', value: 'closed' },
									],
									allLabel: 'All status',
								},
							]}
						/>
					}
				/>
			)}
		</div>
	)
}
