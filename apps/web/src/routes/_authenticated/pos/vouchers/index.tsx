import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { format, isPast } from 'date-fns'
import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import {
	listSearchSchema,
	rightAlignedHeader,
	TextCell,
	useResourceList,
} from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import { confirm } from '@/components/shared/confirm'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { voucherResource } from '@/features/pos/api.ts'
import type { VoucherDto } from '@/features/pos/dto/index.ts'

// Active/inactive filter as an explicit "true"/"false" enum in the URL — NOT
// `z.coerce.boolean` (which makes any non-empty string, including "false", true).
// Kept as the string enum so the URL, navigate(), and the dropdown all agree on
// one type; converted to a real boolean only at the query call. Absent = "All".
const vouchersSearchSchema = listSearchSchema.extend({
	isActive: z.enum(['true', 'false']).optional(),
})

export const Route = createFileRoute('/_authenticated/pos/vouchers/')({
	validateSearch: vouchersSearchSchema,
	component: VouchersPage,
})

// ─── Helpers ───

function getVoucherStatus(voucher: VoucherDto) {
	if (!voucher.isActive) return { label: 'Nonaktif', variant: 'outline' as const }
	if (isPast(new Date(voucher.validUntil)))
		return { label: 'Kedaluwarsa', variant: 'destructive' as const }
	if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit)
		return { label: 'Habis', variant: 'secondary' as const }
	return { label: 'Aktif', variant: 'default' as const }
}

function formatUsage(voucher: VoucherDto) {
	if (voucher.usageLimit === null) return `${voucher.usageCount} / Tanpa Batas`
	return `${voucher.usageCount} / ${voucher.usageLimit}`
}

const STATUS_FILTER_OPTIONS = [
	{ label: 'Aktif', value: 'true' },
	{ label: 'Nonaktif', value: 'false' },
] as const

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, VoucherDto>()

const baseColumns = [
	col.accessor('code', {
		header: 'Kode',
		size: 140,
		cell: ({ getValue }) => <TextCell value={getValue()} mono />,
	}),
	col.accessor('name', {
		header: 'Nama',
		size: 200,
		// oxlint-disable-next-line react/no-unstable-nested-components
		cell: ({ getValue }) => <TextCell value={getValue()} truncate />,
	}),
	col.accessor('type', {
		header: 'Tipe',
		size: 110,
		cell: ({ getValue }) => (
			<Badge variant="secondary" className="capitalize">
				{getValue()}
			</Badge>
		),
	}),
	col.accessor('value', {
		header: rightAlignedHeader('Nilai'),
		size: 100,
		cell: ({ row }) => {
			const v = row.original
			return (
				<div className="text-right font-mono text-sm tabular-nums">
					{v.type === 'percentage'
						? `${v.value}%`
						: `Rp ${Number(v.value).toLocaleString('id-ID')}`}
				</div>
			)
		},
	}),
	col.display({
		id: 'validity',
		header: 'Masa Berlaku',
		size: 180,
		cell: ({ row }) => {
			const v = row.original
			return (
				<span className="text-xs text-muted-foreground">
					{format(new Date(v.validFrom), 'dd MMM yy')} —{' '}
					{format(new Date(v.validUntil), 'dd MMM yy')}
				</span>
			)
		},
	}),
	col.display({
		id: 'usage',
		header: 'Pemakaian',
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
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canManage = usePermissionCheck({ permission: 'voucher.manage' })

	const listQuery = useQuery({
		...voucherResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive === undefined ? undefined : search.isActive === 'true',
		}),
		throwOnError: false,
	})
	const removeMut = useMutation(voucherResource.remove.mutationOptions())

	const handleDelete = useCallback(
		async (item: VoucherDto) => {
			await confirm({
				title: 'Hapus voucher?',
				description: `Voucher "${item.code}" (${item.name}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
				confirmLabel: 'Hapus',
				variant: 'destructive',
				onConfirm: async () => {
					await removeMut.mutateAsync({ id: item.id })
					toast.add({ title: 'Voucher berhasil dihapus.', type: 'success' })
				},
			})
		},
		[removeMut],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(
		() =>
			createActionColumn<VoucherDto>({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (voucher) => [
					canManage && {
						label: 'Ubah',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/pos/vouchers/$voucherId',
								params: { voucherId: String(voucher.id) },
							}),
					},
					canManage && {
						label: 'Hapus',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(voucher),
						variant: 'destructive' as const,
					},
				],
			}),
		[canManage, handleDelete, navigate],
	)

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, VoucherDto>[],
		[actionsColumn],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.isActive !== undefined,
	})

	return (
		<EntityListPage
			title="Voucher"
			description="Kelola voucher diskon untuk pembayaran POS."
			createAction={
				canManage ? (
					<Button onClick={() => navigate({ to: '/pos/vouchers/new' })}>
						<PlusIcon className="size-4" />
						Tambah Voucher
					</Button>
				) : undefined
			}
			list={list}
			emptyState={{
				title: 'Belum ada voucher',
				description: 'Mulai dengan membuat voucher diskon pertama Anda.',
			}}
			emptyMessage="Tidak ada voucher yang cocok dengan pencarian Anda."
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(value) => list.setFilters({ q: value.trim() || undefined })}
					searchPlaceholder="Cari voucher..."
					filters={[
						{
							key: 'isActive',
							label: 'Status',
							value: search.isActive,
							onChange: (value) =>
								list.setFilters({ isActive: value as 'true' | 'false' | undefined }),
							options: STATUS_FILTER_OPTIONS,
							allLabel: 'Semua',
						},
					]}
				/>
			}
		/>
	)
}
