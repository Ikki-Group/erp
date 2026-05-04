import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { MailIcon, PhoneIcon, PlusIcon, Trash2Icon, UserRoundIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import {
	CellDate,
	CellLabelDesc,
	CellMenu,
	CellText,
	type CellMenuItem,
} from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { customerApi } from '@/features/crm'
import type { CustomerDto, CustomerTierDto } from '@/features/crm'
import { CustomerFormDialog } from '@/features/crm/components/customer-form-dialog'

export const Route = createFileRoute('/_app/sales/customers')({ component: SalesCustomersPage })

const tierBadge: Record<CustomerTierDto, string> = {
	bronze: 'bg-amber-700/10 text-amber-700 border-amber-700/20',
	silver: 'bg-slate-400/10 text-slate-500 border-slate-400/20',
	gold: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
	platinum: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
}

function getColumns(
	onEdit: (c: CustomerDto) => void,
	onRemove: (c: CustomerDto) => Promise<void>,
): ColumnDef<CustomerDto>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Pelanggan',
			size: 280,
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<Avatar className="h-8 w-8 rounded-lg">
						<AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
							{row.original.name.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<span className="font-medium block truncate">{row.original.name}</span>
						<p className="text-muted-foreground text-xs font-mono">{row.original.code}</p>
					</div>
				</div>
			),
		},
		{
			accessorKey: 'email',
			header: 'Kontak',
			size: 260,
			cell: ({ row }) => (
				<div className="flex flex-col gap-1">
					{row.original.email && (
						<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
							<MailIcon className="size-3" />
							<span className="truncate">{row.original.email}</span>
						</div>
					)}
					{row.original.phone && (
						<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
							<PhoneIcon className="size-3" />
							<span>{row.original.phone}</span>
						</div>
					)}
				</div>
			),
		},
		{
			accessorKey: 'tier',
			header: 'Tier',
			size: 120,
			cell: ({ row }) => (
				<Badge variant="outline" size="sm" className={tierBadge[row.original.tier] ?? ''}>
					{row.original.tier.toUpperCase()}
				</Badge>
			),
		},
		{
			accessorKey: 'pointsBalance',
			header: 'Poin',
			size: 100,
			cell: ({ row }) => (
				<span className="font-medium tabular-nums">
					{row.original.pointsBalance.toLocaleString('id-ID')}
				</span>
			),
		},
		{
			accessorKey: 'lastVisitAt',
			header: 'Kunjungan Terakhir',
			size: 160,
			cell: ({ row }) => <CellDate value={row.original.lastVisitAt} />,
		},
		{
			accessorKey: 'registeredAt',
			header: 'Terdaftar',
			size: 160,
			cell: ({ row }) => <CellDate value={row.original.registeredAt} />,
		},
		{
			id: 'action',
			header: '',
			size: 60,
			enableSorting: false,
			enableHiding: false,
			enableResizing: false,
			enablePinning: true,
			cell: ({ row }) => {
				const items: CellMenuItem[] = [
					{
						type: 'button',
						label: 'Edit',
						icon: <UserRoundIcon className="size-4" />,
						onClick: () => onEdit(row.original),
					},
					{ type: 'separator' },
					{
						type: 'button',
						label: 'Hapus',
						variant: 'destructive',
						icon: <Trash2Icon className="size-4" />,
						onClick: () => onRemove(row.original),
					},
				]
				return <CellMenu items={items} label={`Aksi ${row.original.name}`} />
			},
		},
	]
}

function SalesCustomersPage() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(customerApi.list.query({ ...ds.pagination, q: ds.search }))

	const deleteMutation = useMutation({ mutationFn: customerApi.remove.mutationFn })

	const handleDelete = useCallback(
		async (customer: CustomerDto) => {
			await ConfirmDialog.call({
				title: 'Hapus Pelanggan',
				description: `Apakah Anda yakin ingin menghapus pelanggan "${customer.name}"? Data loyalty dan riwayat transaksi tidak akan terhapus.`,
				variant: 'destructive',
				confirmLabel: 'Hapus Pelanggan',
				confirmValidationText: customer.code,
				onConfirm: async () => {
					const promise = deleteMutation.mutateAsync({ params: { id: customer.id } })
					await toast.promise(promise, toastLabelMessage('delete', 'pelanggan')).unwrap()
				},
			})
		},
		[deleteMutation],
	)

	const handleEdit = useCallback(async (customer: CustomerDto) => {
		await CustomerFormDialog.upsert({ id: customer.id })
	}, [])

	const columns = useMemo(() => getColumns(handleEdit, handleDelete), [handleEdit, handleDelete])

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Data Pelanggan"
				description="Basis data pelanggan dari seluruh channel penjualan."
			/>
			<Page.Content>
				<CustomerFormDialog.Root />
				<DataTableCard
					title="Daftar Pelanggan"
					table={table}
					isLoading={isLoading}
					recordCount={data?.meta.total ?? 0}
					toolbar={
						<DataGridFilter
							ds={ds}
							options={[
								{ type: 'search', placeholder: 'Cari nama, kode, atau telepon...' },
								{
									type: 'select',
									key: 'tier',
									placeholder: 'Semua Tier',
									options: [
										{ label: 'Bronze', value: 'bronze' },
										{ label: 'Silver', value: 'silver' },
										{ label: 'Gold', value: 'gold' },
										{ label: 'Platinum', value: 'platinum' },
									],
								},
							]}
						/>
					}
					action={
						<Button size="sm" onClick={() => CustomerFormDialog.upsert({})}>
							<PlusIcon className="mr-2 h-4 w-4" /> Tambah Pelanggan
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
