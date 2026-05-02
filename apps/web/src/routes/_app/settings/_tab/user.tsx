import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { KeyRoundIcon, PencilIcon, Trash2Icon, ZoomInIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Badge } from '@/components/reui/badge'
import {
	CellDate,
	CellLabelDesc,
	CellMenu,
	CellText,
} from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@/components/ui/popover'

import type { UserDetailDto } from '@/features/iam'
import { userApi } from '@/features/iam'
import { UserPasswordDialog } from '@/features/iam/components/user-password-dialog'
import { getUserStatusBadge } from '@/features/iam/utils'

export const Route = createFileRoute('/_app/settings/_tab/user')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<>
			<UserPasswordDialog.Root />
			<UserTable />
		</>
	)
}

function UserTable() {
	const ds = useDataTableState<{ isActive?: boolean }>()
	const { data, isLoading } = useQuery(
		userApi.list.query({ ...ds.pagination, ...ds.filters, q: ds.search }),
	)

	const remove = useMutation({
		mutationFn: userApi.remove.mutationFn,
	})

	const columns = useMemo(
		() =>
			getColumns({
				onRemove: (user) => {
					ConfirmDialog.call({
						title: 'Hapus Pengguna',
						description: `Apakah Anda yakin ingin menghapus pengguna "${user.fullname ?? user.username}"? Tindakan ini tidak dapat dibatalkan.`,
						variant: 'destructive',
						confirmLabel: 'Hapus Pengguna',
						confirmValidationText: user.username,
						onConfirm: async () => {
							await toast
								.promise(
									remove.mutateAsync({ body: { id: user.id } }),
									toastLabelMessage('delete', 'pengguna'),
								)
								.unwrap()
						},
					})
				},
			}),
		[remove.mutateAsync],
	)

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<DataTableCard
			title="Daftar Pengguna"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter
					ds={ds}
					options={[
						{ type: 'search', placeholder: 'Cari user (nama, email, username)...' },
						{
							type: 'select',
							key: 'isActive',
							placeholder: 'Status',
							options: [
								{ label: 'Semua', value: '' },
								{ label: 'Aktif', value: 'true' },
								{ label: 'Non-Aktif', value: 'false' },
							],
						},
					]}
				/>
			}
			action={
				<Button
					size="sm"
					nativeButton={false}
					render={<Link to="/settings/user/create" from={Route.fullPath} />}
				>
					Tambah Pengguna
				</Button>
			}
		/>
	)
}

interface GetColumnsProps {
	onRemove: (user: UserDetailDto) => void
}

function getColumns({ onRemove }: GetColumnsProps): ColumnDef<UserDetailDto>[] {
	return [
		{
			accessorKey: 'fullname',
			header: 'Nama',
			size: 200,
			cell: ({ row }) => {
				const { email, fullname } = row.original
				return <CellLabelDesc label={fullname} desc={email} />
			},
		},
		{
			accessorKey: 'isActive',
			header: 'Aktif',
			cell: ({ row }) => <BadgeDot {...getUserStatusBadge(row.original.isActive)} />,
		},
		{
			accessorKey: 'username',
			header: 'Username',
			cell: ({ row }) => <CellText value={`@${row.original.username}`} />,
		},
		{
			accessorKey: 'assignments',
			size: 150,
			enableSorting: false,
			header: 'Penugasan',
			cell: ({ row }) => {
				const { isRoot, assignments } = row.original
				if (isRoot) return <Badge variant="secondary">Super Admin</Badge>
				if (!assignments?.length) {
					return <CellText value="Belum ada penugasan" />
				}
				return (
					<div className="flex items-center gap-2">
						<CellText value={`${assignments.length} Penugasan`} />
						<Popover>
							<PopoverTrigger render={<Button variant="ghost" size="icon-xs" className="size-6" />}>
								<ZoomInIcon />
							</PopoverTrigger>
							<PopoverContent className="w-64 p-0 gap-0" side="right">
								<PopoverHeader className="px-3 py-2 border-b bg-muted/50">
									<PopoverTitle className="text-xs font-semibold">Daftar Penugasan</PopoverTitle>
									<PopoverDescription className="text-[11px]">
										Detail role dan lokasi pengguna
									</PopoverDescription>
								</PopoverHeader>
								<div className="space-y-2 max-h-60 overflow-auto p-3">
									{assignments.map((a, i) => (
										<div
											key={i}
											className="flex flex-col gap-0.5 border-b last:border-0 pb-1.5 last:pb-0"
										>
											<div className="flex items-center justify-between gap-2">
												<p className="font-medium">{a.location.name}</p>
												{a.isDefault && (
													<Badge variant="outline" className="h-4 px-1 text-[10px]">
														Default
													</Badge>
												)}
											</div>
											<p className="text-muted-foreground text-[11px]">{a.role.name}</p>
										</div>
									))}
								</div>
							</PopoverContent>
						</Popover>
					</div>
				)
			},
		},
		{
			accessorKey: 'createdAt',
			header: 'Dibuat Pada',
			cell: ({ row }) => <CellDate value={row.original.createdAt} />,
		},
		{
			id: 'action',
			size: 60,
			cell: ({ row }) => {
				const { id, username } = row.original
				return (
					<CellMenu
						items={[
							{
								type: 'link',
								label: 'Edit',
								icon: <PencilIcon className="mr-2" />,
								to: `/settings/user/${id}`,
							},
							{
								type: 'button',
								label: 'Ubah Password',
								icon: <KeyRoundIcon className="mr-2" />,
								onClick: () => {
									UserPasswordDialog.call({ id, username })
								},
							},
							{
								type: 'button',
								label: 'Hapus',
								variant: 'destructive',
								icon: <Trash2Icon className="mr-2" />,
								onClick: () => onRemove(row.original),
							},
						]}
					/>
				)
			},
		},
	]
}
