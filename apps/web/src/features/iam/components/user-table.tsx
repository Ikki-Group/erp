import { createColumnHelper } from '@tanstack/react-table'

import { createEntityColumns } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { UserListItemDto } from '../dto/index.ts'

const col = createColumnHelper<DataGridFeatures, UserListItemDto>()
const fields = createEntityColumns<UserListItemDto>()

export const userColumns = [
	fields.code('username', { header: 'Nama pengguna', size: 160 }),
	fields.text('name', { header: 'Nama', size: 180 }),
	fields.text('email', { header: 'Email', size: 200 }),
	col.accessor('roleNames', {
		header: 'Peran',
		size: 180,
		cell: ({ getValue }) => {
			const roles = getValue()
			if (!roles.length) return <span className="text-muted-foreground">Tidak ada peran</span>
			// One line, never wrapping: the first role plus a `+N` count. The
			// tooltip carries the full set so extra roles never break the row.
			return (
				<Tooltip>
					<TooltipTrigger
						render={<div className="flex min-w-0 max-w-full items-center gap-1" tabIndex={0} />}
					>
						<Badge variant="outline" className="min-w-0 shrink font-normal">
							<span className="truncate">{roles[0]}</span>
						</Badge>
						{roles.length > 1 && (
							<Badge variant="secondary" className="font-normal">
								+{roles.length - 1}
							</Badge>
						)}
					</TooltipTrigger>
					<TooltipContent side="top" className="max-w-sm">
						{roles.join(', ')}
					</TooltipContent>
				</Tooltip>
			)
		},
	}),
	fields.booleanStatus('isActive', { header: 'Status', size: 100 }),
]
