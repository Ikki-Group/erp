import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { MoreHorizontalIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react'

import { useDataTableAuto, useDataTableState } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/examples/data-table/')({ component: DataTableDocs })

function DataTableDocs() {
	return (
		<Page>
			<Page.Header>
				<Page.Title>Data Table</Page.Title>
				<Page.Description>
					Comprehensive examples of data table features and use cases
				</Page.Description>
			</Page.Header>

			<Page.Content className="space-y-8">
				<AdvancedExample />
				<BasicExample />
				<ConditionalCellExample />
				<EmptyStateExample />
				<LoadingStateExample />
			</Page.Content>
		</Page>
	)
}

// ============================================================================
// Types & Mock Data
// ============================================================================

interface User {
	id: string
	name: string
	email: string
	role: 'Admin' | 'User' | 'Guest'
	status: 'Active' | 'Inactive' | 'Pending'
	createdAt: Date
}

// @ts-expect-error
const MOCK_USERS: Array<User> = Array.from({ length: 100 }).map((_, index) => ({
	id: `user-${index + 1}`,
	name: `User ${index + 1}`,
	email: `user${index + 1}@example.com`,
	role: (['Admin', 'User', 'Guest'] as const)[index % 3],
	status: (['Active', 'Inactive', 'Pending'] as const)[index % 3],
	createdAt: new Date(2024, 0, (index % 28) + 1),
}))

// ============================================================================
// Example 1: Basic Table
// ============================================================================

function BasicExample() {
	const ds = useDataTableState()
	const table = useDataTableAuto({ data: MOCK_USERS, columns: basicColumns, ds, isLoading: true })

	return (
		<Card>
			<Card.Header>
				<Card.Title>Basic Table</Card.Title>
				<Card.Description>Simple data table with pagination</Card.Description>
			</Card.Header>
			<DataTable table={table}>
				<DataTable.Table />
				<Card.Footer>
					<DataTable.Pagination />
				</Card.Footer>
			</DataTable>
		</Card>
	)
}

const ch = createColumnHelper<User>()

const basicColumns = [
	ch.accessor('name', { header: 'Name', cell: (info) => info.getValue() }),
	ch.accessor('email', { header: 'Email', cell: (info) => info.getValue() }),
	ch.accessor('role', {
		header: 'Role',
		cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
	}),
]

// ============================================================================
// Example 2: Advanced Table
// ============================================================================

function AdvancedExample() {
	const ds = useDataTableState()
	const table = useDataTableAuto({ data: MOCK_USERS, columns: advancedColumns, ds })

	return (
		<Card>
			<Card.Header className="border-b">
				<Card.Title>Advanced Table</Card.Title>
				<Card.Description>
					Table with selection, search, column visibility, and row actions
				</Card.Description>
			</Card.Header>

			<DataTable table={table}>
				<div className="px-4 pb-2">
					<DataTable.Toolbar />
				</div>
				<DataTable.Table className="border-y" />
				<Card.Footer className="pt-4">
					<DataTable.Pagination />
				</Card.Footer>
			</DataTable>
		</Card>
	)
}

const advancedColumns = [
	ch.display({
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				// oxlint-disable-next-line typescript/no-unnecessary-type-conversion
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
				className="translate-y-0.5"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				// oxlint-disable-next-line typescript/no-unnecessary-type-conversion
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
				className="translate-y-0.5"
			/>
		),
		enableSorting: false,
		enableHiding: false,
		size: 8,
	}),
	ch.accessor('name', {
		header: ({ column }) => <DataTable.ColumnHeader column={column} title="Name" />,
		cell: (info) => info.getValue(),
	}),
	ch.accessor('email', {
		header: ({ column }) => <DataTable.ColumnHeader column={column} title="Email" />,
		cell: (info) => info.getValue(),
	}),
	ch.accessor('role', {
		header: ({ column }) => <DataTable.ColumnHeader column={column} title="Role" />,
		cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
	}),
	ch.display({
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			const user = row.original
			return (
				<DropdownMenu>
					<DropdownMenuTrigger render={<Button variant="ghost" className="size-8 p-0" />}>
						<span className="sr-only">Open menu</span>
						<MoreHorizontalIcon className="size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
							Copy user ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>Edit user</DropdownMenuItem>
						<DropdownMenuItem>View details</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	}),
]

// ============================================================================
// Example 3: Conditional Cell Styling
// ============================================================================

function ConditionalCellExample() {
	const ds = useDataTableState()
	const table = useDataTableAuto({ data: MOCK_USERS, columns: conditionalCellColumns, ds })

	return (
		<Card>
			<Card.Header>
				<Card.Title>Conditional Cell Styling</Card.Title>
				<Card.Description>Cells styled based on status with icons</Card.Description>
			</Card.Header>
			<DataTable table={table}>
				<DataTable.Table />
				<Card.Footer>
					<DataTable.Pagination />
				</Card.Footer>
			</DataTable>
		</Card>
	)
}

const conditionalCellColumns = [
	ch.accessor('name', { header: 'Name', cell: (info) => info.getValue() }),
	ch.accessor('email', { header: 'Email', cell: (info) => info.getValue() }),
	ch.accessor('status', {
		header: 'Status',
		cell: (info) => {
			const status = info.getValue()
			return (
				<div className="flex items-center gap-2">
					{status === 'Active' && <CheckCircleIcon className="size-4 text-green-500" />}
					{status === 'Inactive' && <XCircleIcon className="size-4 text-red-500" />}
					{status === 'Pending' && <ClockIcon className="size-4 text-yellow-500" />}
					<span
						className={
							status === 'Active'
								? 'text-green-700 dark:text-green-400'
								: status === 'Inactive'
									? 'text-red-700 dark:text-red-400'
									: 'text-yellow-700 dark:text-yellow-400'
						}
					>
						{status}
					</span>
				</div>
			)
		},
	}),
]

// ============================================================================
// Example 4: Empty State
// ============================================================================

function EmptyStateExample() {
	const ds = useDataTableState()
	const table = useDataTableAuto({ data: [], columns: basicColumns, ds })

	return (
		<Card>
			<Card.Header>
				<Card.Title>Empty State</Card.Title>
				<Card.Description>Table with no data shows empty state</Card.Description>
			</Card.Header>
			<DataTable table={table}>
				<DataTable.Table />
			</DataTable>
		</Card>
	)
}

// ============================================================================
// Example 5: Loading State
// ============================================================================

function LoadingStateExample() {
	const ds = useDataTableState()
	const table = useDataTableAuto({ data: MOCK_USERS, columns: basicColumns, ds, isLoading: true })

	return (
		<Card>
			<Card.Header>
				<Card.Title>Loading State</Card.Title>
				<Card.Description>Table shows skeleton while loading</Card.Description>
			</Card.Header>
			<DataTable table={table}>
				<DataTable.Table />
				<Card.Footer>
					<DataTable.Pagination />
				</Card.Footer>
			</DataTable>
		</Card>
	)
}
