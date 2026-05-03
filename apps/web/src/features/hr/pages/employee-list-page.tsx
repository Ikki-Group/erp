import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { MailIcon, PhoneIcon, Trash2Icon, UserRoundIcon } from 'lucide-react'
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

import { Button } from '@/components/ui/button'

import { employeeApi } from '../api'
import type { EmployeeDto } from '../dto'

function getEmployeeColumns(onRemove: (employee: EmployeeDto) => Promise<void>): ColumnDef<EmployeeDto>[] {
	return [
		{
			accessorKey: 'code',
			header: 'Kode',
			size: 120,
			cell: ({ row }) => (
				<Badge variant="outline" size="sm" className="font-bold uppercase tracking-wider">
					{row.original.code}
				</Badge>
			),
		},
		{
			accessorKey: 'name',
			header: 'Staff',
			size: 260,
			cell: ({ row }) => (
				<CellLabelDesc
					label={row.original.name}
					desc={row.original.jobTitle ?? row.original.department ?? 'Belum ada jabatan'}
				/>
			),
		},
		{
			accessorKey: 'email',
			header: 'Email',
			size: 220,
			cell: ({ row }) => (
				<div className="flex items-center gap-2 text-muted-foreground">
					<MailIcon className="size-3.5" />
					<CellText value={row.original.email} />
				</div>
			),
		},
		{
			accessorKey: 'phone',
			header: 'Telepon',
			size: 160,
			cell: ({ row }) => (
				<div className="flex items-center gap-2 text-muted-foreground">
					<PhoneIcon className="size-3.5" />
					<CellText value={row.original.phone} />
				</div>
			),
		},
		{
			accessorKey: 'department',
			header: 'Departemen',
			size: 160,
			cell: ({ row }) => <CellText value={row.original.department} />,
		},
		{
			accessorKey: 'createdAt',
			header: 'Dibuat Pada',
			size: 180,
			cell: ({ row }) => <CellDate value={row.original.createdAt} />,
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
						label: 'Hapus',
						variant: 'destructive',
						icon: <Trash2Icon />,
						onClick: () => onRemove(row.original),
					},
				]
				return <CellMenu items={items} label={`Aksi ${row.original.name}`} />
			},
		},
	]
}

export function EmployeeListPage() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(employeeApi.list.query({ ...ds.pagination, q: ds.search }))

	const deleteMutation = useMutation({ mutationFn: employeeApi.remove.mutationFn })

	const handleDelete = useCallback(
		async (employee: EmployeeDto) => {
			await ConfirmDialog.call({
				title: 'Hapus Staff',
				description: `Apakah Anda yakin ingin menghapus staff "${employee.name}"? Data yang sudah terhubung dengan absensi/payroll mungkin tidak dapat dihapus.`,
				variant: 'destructive',
				confirmLabel: 'Hapus Staff',
				confirmValidationText: employee.code,
				onConfirm: async () => {
					const promise = deleteMutation.mutateAsync({ params: { id: employee.id } })
					await toast.promise(promise, toastLabelMessage('delete', 'staff')).unwrap()
				},
			})
		},
		[deleteMutation],
	)

	const columns = useMemo(() => getEmployeeColumns(handleDelete), [handleDelete])

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
				title="Daftar Staff"
				description="Kelola data staff, jabatan, departemen, dan relasi user untuk kebutuhan operasional HR."
			/>
			<Page.Content>
				<DataTableCard
					title="Staff"
					table={table}
					isLoading={isLoading}
					recordCount={data?.meta.total ?? 0}
					toolbar={
						<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari staff...' }]} />
					}
					action={
						<Button size="sm" disabled>
							<UserRoundIcon />
							Tambah Staff
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
