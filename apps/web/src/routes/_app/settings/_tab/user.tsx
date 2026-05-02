import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { KeyRoundIcon, MoreHorizontalIcon, PencilIcon, ZoomInIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Badge } from '@/components/reui/badge'
import {
	createColumnHelper,
	dateColumn,
	linkColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const ch = createColumnHelper<UserDetailDto>()
const columnDefs = [
	ch.accessor(
		'fullname',
		linkColumn({
			header: 'Nama',
			render: (value, row) => (
				<Link to="/settings/user/$id" params={{ id: String(row.id) }}>
					<div className="flex flex-col gap-1 py-0.5 min-w-0">
						<span className="font-semibold text-sm tracking-tight hover:text-primary hover:underline truncate">
							{value}
						</span>
						<span className="text-muted-foreground italic text-xs truncate">{row.email}</span>
					</div>
				</Link>
			),
			size: 200,
			enableSorting: false,
		}),
	),
	ch.accessor('isActive', {
		header: 'Aktif',
		cell: ({ row }) => <BadgeDot {...getUserStatusBadge(row.original.isActive)} />,
	}),
	ch.accessor('username', {
		header: 'Username',
		cell: ({ row }) => <span className="text-muted-foreground">@{row.original.username}</span>,
		enableSorting: false,
	}),
	ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada' })),
	ch.accessor('assignments', {
		header: 'Penugasan',
		cell: ({ row }) => {
			const { isRoot, assignments } = row.original
			if (isRoot) return <Badge variant="secondary">Super Admin</Badge>

			if (!assignments?.length) {
				return <span className="text-muted-foreground italic text-xs">Belum ada penugasan</span>
			}

			return (
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium">{assignments.length} Penugasan</span>
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
											<span className="font-semibold text-xs truncate">{a.role.name}</span>
											{a.isDefault && (
												<Badge variant="outline" className="h-4 px-1 text-[10px]">
													Default
												</Badge>
											)}
										</div>
										<span className="text-muted-foreground text-[11px] truncate">
											{a.location.name}
										</span>
									</div>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>
			)
		},
		size: 150,
		enableSorting: false,
	}),
	ch.display({
		id: 'action',
		cell: ({ row }) => {
			const { id, username } = row.original
			return (
				<div className="flex items-center justify-end px-2">
					<DropdownMenu>
						<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
							<MoreHorizontalIcon />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem
								nativeButton={false}
								render={<Link to="/settings/user/$id" params={{ id: String(id) }} />}
							>
								<PencilIcon className="mr-2" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								variant="destructive"
								onClick={() => {
									UserPasswordDialog.call({ id, username })
								}}
								className="text-nowrap"
							>
								<KeyRoundIcon className="mr-2" />
								Ubah Password
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)
		},
		size: 60,
	}),
]

function UserTable() {
	const ds = useDataTableState<{ isActive?: boolean }>()
	const { data, isLoading } = useQuery(
		userApi.list.query({ ...ds.pagination, ...ds.filters, q: ds.search }),
	)

	const columns = useMemo(() => columnDefs, [])
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
