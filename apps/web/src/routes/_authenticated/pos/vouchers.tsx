import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { format, isPast } from 'date-fns'
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

import { voucherResource } from '@/features/pos/api.ts'
import { VoucherForm } from '@/features/pos/components/voucher-form.tsx'
import type { VoucherFormRef } from '@/features/pos/components/voucher-form.tsx'
import type { VoucherDto } from '@/features/pos/dto/index.ts'

export const Route = createFileRoute('/_authenticated/pos/vouchers')({
	component: VouchersPage,
})

// ─── Helpers ───

function getVoucherStatus(voucher: VoucherDto) {
	if (!voucher.isActive) return { label: 'Inactive', variant: 'outline' as const }
	if (isPast(new Date(voucher.validUntil))) return { label: 'Expired', variant: 'destructive' as const }
	if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit)
		return { label: 'Exhausted', variant: 'secondary' as const }
	return { label: 'Active', variant: 'default' as const }
}

function formatUsage(voucher: VoucherDto) {
	if (voucher.usageLimit === null) return `${voucher.usageCount} / Unlimited`
	return `${voucher.usageCount} / ${voucher.usageLimit}`
}

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, VoucherDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Code',
		size: 140,
		cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
	}),
	col.accessor('type', {
		header: 'Type',
		size: 110,
		cell: ({ getValue }) => (
			<Badge variant="secondary" className="capitalize">
				{getValue()}
			</Badge>
		),
	}),
	col.accessor('value', {
		header: 'Value',
		size: 100,
		cell: ({ row }) => {
			const v = row.original
			return v.type === 'percentage' ? `${v.value}%` : `Rp ${Number(v.value).toLocaleString('id-ID')}`
		},
	}),
	col.display({
		id: 'validity',
		header: 'Validity',
		size: 180,
		cell: ({ row }) => {
			const v = row.original
			return (
				<span className="text-xs text-muted-foreground">
					{format(new Date(v.validFrom), 'dd MMM yy')} — {format(new Date(v.validUntil), 'dd MMM yy')}
				</span>
			)
		},
	}),
	col.display({
		id: 'usage',
		header: 'Usage',
		size: 120,
		cell: ({ row }) => <span className="text-xs">{formatUsage(row.original)}</span>,
	}),
	col.display({
		id: 'status',
		header: 'Status',
		size: 100,
		cell: ({ row }) => {
			const status = getVoucherStatus(row.original)
			return <Badge variant={status.variant}>{status.label}</Badge>
		},
	}),
]

// ─── Page Component ───

function VouchersPage() {
	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		q: undefined as string | undefined,
	})

	const listQuery = useQuery(voucherResource.list.queryOptions(listParams))

	const createMut = useMutation(voucherResource.create.mutationOptions())
	const updateMut = useMutation(voucherResource.update.mutationOptions())
	const removeMut = useMutation(voucherResource.remove.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	// ─── Handlers ───

	const handleCreate = useCallback(async () => {
		const formRef = { current: null } as React.MutableRefObject<VoucherFormRef | null>

		const saved = await formDialog({
			title: 'Add Voucher',
			description: 'Create a new discount voucher.',
			submitLabel: 'Create',
			content: (
				<VoucherForm
					ref={(el) => {
						formRef.current = el
					}}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Please fix the validation errors.')
				const vals = formRef.current!.getValues()
				await createMut.mutateAsync({
					code: vals.code,
					name: vals.name,
					type: vals.type as VoucherDto['type'],
					value: vals.value!,
					minPurchase: vals.minPurchase || null,
					maxDiscount: vals.maxDiscount || null,
					validFrom: vals.validFrom!,
					validUntil: vals.validUntil!,
					usageLimit: vals.usageLimit || null,
					isActive: vals.isActive,
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Voucher created.', type: 'success' })
		}
	}, [createMut])

	const handleEdit = useCallback(
		async (item: VoucherDto) => {
			const formRef = { current: null } as React.MutableRefObject<VoucherFormRef | null>

			const saved = await formDialog({
				title: 'Edit Voucher',
				description: `Update details for ${item.code}.`,
				submitLabel: 'Save Changes',
				content: (
					<VoucherForm
						ref={(el) => {
							formRef.current = el
						}}
						defaultValues={item}
					/>
				),
				onSubmit: async () => {
					const errors = formRef.current?.validate()
					if (errors) throw new Error('Please fix the validation errors.')
					const vals = formRef.current!.getValues()
					await updateMut.mutateAsync({
						id: item.id,
						code: vals.code,
						name: vals.name,
						type: vals.type as VoucherDto['type'],
						value: vals.value!,
						minPurchase: vals.minPurchase || null,
						maxDiscount: vals.maxDiscount || null,
						validFrom: vals.validFrom!,
						validUntil: vals.validUntil!,
						usageLimit: vals.usageLimit || null,
						isActive: vals.isActive,
					})
				},
			})

			if (saved) {
				toast.add({ title: 'Voucher updated.', type: 'success' })
			}
		},
		[updateMut],
	)

	const handleDelete = useCallback(
		async (item: VoucherDto) => {
			await confirm({
				title: 'Delete voucher?',
				description: `This will permanently delete "${item.code}" (${item.name}). This action cannot be undone.`,
				confirmLabel: 'Delete',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: item.id })
					toast.add({ title: 'Voucher deleted.', type: 'success' })
				},
			})
		},
		[removeMut],
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
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, VoucherDto>[],
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
				title="Vouchers"
				description="Manage discount vouchers for POS checkout."
				actions={
					<Button size="sm" onClick={handleCreate}>
						<PlusIcon className="size-4" />
						Add Voucher
					</Button>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="No vouchers yet"
					description="Get started by creating your first discount voucher."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Add Voucher
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="No vouchers match your search."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Search vouchers..."
						/>
					}
				/>
			)}
		</div>
	)
}
