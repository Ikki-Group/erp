import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

const auditActionOptions = [
	{ value: 'create', label: 'Create' },
	{ value: 'update', label: 'Update' },
	{ value: 'delete', label: 'Delete' },
	{ value: 'login', label: 'Login' },
	{ value: 'logout', label: 'Logout' },
	{ value: 'export', label: 'Export' },
	{ value: 'import', label: 'Import' },
	{ value: 'other', label: 'Other' },
]

interface AuditLogFiltersProps {
	filter: any
	onFilterChange: (filter: any) => void
}

export function AuditLogFilters({ filter, onFilterChange }: AuditLogFiltersProps) {
	const handleSearchChange = (value: string) => {
		const newFilter = { ...filter, q: value || undefined }
		onFilterChange(newFilter)
	}

	const handleActionChange = (value: string) => {
		const newFilter = { ...filter, action: value === 'all' ? undefined : value }
		onFilterChange(newFilter)
	}

	const handleEntityTypeChange = (value: string) => {
		const newFilter = { ...filter, entityType: value || undefined }
		onFilterChange(newFilter)
	}

	const handleFromDateChange = (date: Date | undefined) => {
		const newFilter = { ...filter, fromDate: date }
		onFilterChange(newFilter)
	}

	const handleToDateChange = (date: Date | undefined) => {
		const newFilter = { ...filter, toDate: date }
		onFilterChange(newFilter)
	}

	return (
		<div className="flex flex-wrap gap-2">
			<Input
				placeholder="Cari deskripsi..."
				value={filter.q || ''}
				onChange={(e) => handleSearchChange(e.target.value)}
				className="w-[200px]"
			/>
			<Select value={filter.action || 'all'} onValueChange={handleActionChange}>
				<SelectTrigger className="w-[150px]">
					<SelectValue placeholder="Semua Aksi" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Semua Aksi</SelectItem>
					{auditActionOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Input
				placeholder="Entity Type"
				value={filter.entityType || ''}
				onChange={(e) => handleEntityTypeChange(e.target.value)}
				className="w-[150px]"
			/>
			<Popover>
				<PopoverTrigger>
					<Button
						variant="outline"
						className={cn(
							'w-[200px] justify-start text-left font-normal',
							!filter.fromDate && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{filter.fromDate ? filter.fromDate.toLocaleDateString('id-ID') : 'Dari Tanggal'}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={filter.fromDate}
						onSelect={handleFromDateChange}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
			<Popover>
				<PopoverTrigger>
					<Button
						variant="outline"
						className={cn(
							'w-[200px] justify-start text-left font-normal',
							!filter.toDate && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{filter.toDate ? filter.toDate.toLocaleDateString('id-ID') : 'Sampai Tanggal'}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={filter.toDate}
						onSelect={handleToDateChange}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}
