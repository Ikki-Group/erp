import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { LockIcon, UnlockIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { shiftResource } from '@/features/pos/api.ts'
import { ShiftCloseForm } from '@/features/pos/components/shift-close-form.tsx'
import type { ShiftCloseFormRef } from '@/features/pos/components/shift-close-form.tsx'
import { ShiftOpenForm } from '@/features/pos/components/shift-open-form.tsx'
import type { ShiftOpenFormRef } from '@/features/pos/components/shift-open-form.tsx'
import type { ShiftDto } from '@/features/pos/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/pos/shifts')({
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
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
	})

	const listQuery = useQuery({
		...shiftResource.list.queryOptions({
			...listParams,
			locationId: locationId!,
		}),
		enabled: !!locationId,
	})

	const activeShiftQuery = useQuery({
		...shiftResource.active.queryOptions(undefined as never),
		queryKey: shiftResource.keys.active(locationId),
		enabled: !!locationId,
	})

	const openMut = useMutation(shiftResource.open.mutationOptions())
	const closeMut = useMutation(shiftResource.close.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const activeShift = activeShiftQuery.data?.data ?? null

	const handleOpenShift = useCallback(async () => {
		if (!locationId) return
		const formRef = { current: null } as React.MutableRefObject<ShiftOpenFormRef | null>

		const saved = await formDialog({
			title: 'Open Shift',
			description: 'Start a new cashier shift. Count your opening cash.',
			submitLabel: 'Open Shift',
			content: (
				<ShiftOpenForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const values = formRef.current!.getValues()
				await openMut.mutateAsync({
					locationId,
					openingCash: Number(values.openingCash),
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Shift opened successfully.', type: 'success' })
		}
	}, [openMut, locationId])

	const handleCloseShift = useCallback(async () => {
		if (!activeShift) return
		const formRef = { current: null } as React.MutableRefObject<ShiftCloseFormRef | null>

		const saved = await formDialog({
			title: 'Close Shift',
			description: 'End your current shift. Count the cash drawer.',
			submitLabel: 'Close Shift',
			content: (
				<ShiftCloseForm
					ref={(el) => {
						formRef.current = el
					}}
					expectedCash={activeShift.expectedCash}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const values = formRef.current!.getValues()
				await closeMut.mutateAsync({
					shiftId: activeShift.id,
					closingCash: Number(values.closingCash),
					notes: values.notes || undefined,
				})
			},
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
		pageSize: listParams.limit,
		onStateChange: (params) => {
			setListParams({
				page: params.page + 1,
				limit: params.pageSize,
			})
		},
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
								<span className="size-2 rounded-full bg-green-500" />
								Shift active
							</Badge>
						)}
						{activeShift ? (
							<Button size="sm" variant="outline" onClick={handleCloseShift}>
								<LockIcon className="size-4" />
								Close Shift
							</Button>
						) : (
							<Button size="sm" onClick={handleOpenShift}>
								<UnlockIcon className="size-4" />
								Open Shift
							</Button>
						)}
					</div>
				}
			/>

			{data.length === 0 && !listQuery.isLoading ? (
				<EmptyState
					title="No shifts yet"
					description="Open your first shift to start tracking cash."
					action={
						!activeShift ? (
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
				/>
			)}
		</div>
	)
}
