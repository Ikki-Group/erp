import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import {
	createColumnHelper,
	dateColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { roleApi } from '@/features/iam'
import { RoleFormDialog } from '@/features/iam/components/role-form-dialog'
import type { RoleDto } from '@/features/iam/dto'

export const Route = createFileRoute('/_app/settings/_tab/role')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<>
			<RoleFormDialog.Root />
			<RolesTable />
		</>
	)
}

const ch = createColumnHelper<RoleDto>()

function RolesTable() {
	const ds = useDataTableState()

	const { data, isLoading } = useQuery(roleApi.list.query({ ...ds.pagination, q: ds.search }))

	const remove = useMutation({
		mutationFn: roleApi.remove.mutationFn,
	})

	const handleRemove = async (role: RoleDto) => {
		await ConfirmDialog.call({
			title: 'Hapus Role',
			description: `Apakah Anda yakin ingin menghapus role "${role.name}"? Data yang terkait dengan role ini mungkin akan terdampak.`,
			variant: 'destructive',
			confirmLabel: 'Hapus Role',
			confirmValidationText: role.name,
			onConfirm: async () => {
				await toast
					.promise(remove.mutateAsync({ body: { id: role.id } }), {
						...toastLabelMessage('delete', 'role'),
					})
					.unwrap()
			},
		})
	}

	const columns = useMemo(
		() => [
			ch.accessor('name', textColumn({ header: 'Role', size: 200 })),
			ch.accessor('code', textColumn({ header: 'Kode', size: 200 })),
			ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada' })),
			ch.display({
				id: 'action',
				cell: ({ row }) => {
					if (row.original.isSystem) return null
					return (
						<div className="flex items-center justify-end px-2">
							<DropdownMenu>
								<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
									<MoreHorizontalIcon />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-36">
									<DropdownMenuItem
										onClick={() => {
											void RoleFormDialog.call({ id: row.original.id })
										}}
									>
										<PencilIcon className="mr-2" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										variant="destructive"
										onClick={() => handleRemove(row.original)}
									>
										<Trash2Icon className="mr-2" />
										Hapus
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)
				},
			}),
		],
		// oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
		[remove],
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
			title="Daftar Role"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter
					ds={ds}
					options={[{ type: 'search', placeholder: 'Cari role (nama, kode)...' }]}
				/>
			}
			action={
				<Button
					size="sm"
					onClick={() => {
						void RoleFormDialog.call({})
					}}
				>
					Tambah Role
				</Button>
			}
		/>
	)
}
