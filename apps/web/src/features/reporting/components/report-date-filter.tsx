import React from 'react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { ReportRequestDto } from '@/features/reporting'

interface ReportDateFilterProps {
	value: ReportRequestDto
	onChange: (value: ReportRequestDto) => void
	showGroupBy?: boolean
}

export function ReportDateFilter({ value, onChange, showGroupBy = true }: ReportDateFilterProps) {
	return (
		<div className="flex flex-wrap items-end gap-4">
			<div className="space-y-2">
				<Label>Dari</Label>
				<input
					type="date"
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					value={
						value.dateFrom instanceof Date
							? value.dateFrom.toISOString().split('T')[0]
							: String(value.dateFrom ?? '').split('T')[0]
					}
					onChange={(e) =>
						onChange({ ...value, dateFrom: e.target.value ? new Date(e.target.value) : new Date() })
					}
				/>
			</div>
			<div className="space-y-2">
				<Label>Sampai</Label>
				<input
					type="date"
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					value={
						value.dateTo instanceof Date
							? value.dateTo.toISOString().split('T')[0]
							: String(value.dateTo ?? '').split('T')[0]
					}
					onChange={(e) =>
						onChange({ ...value, dateTo: e.target.value ? new Date(e.target.value) : new Date() })
					}
				/>
			</div>
			{showGroupBy && (
				<div className="space-y-2">
					<Label>Group By</Label>
					<Select
						value={value.groupBy ?? 'day'}
						onValueChange={(v) => onChange({ ...value, groupBy: v as ReportRequestDto['groupBy'] })}
					>
						<SelectTrigger className="w-[130px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="day">Harian</SelectItem>
							<SelectItem value="week">Mingguan</SelectItem>
							<SelectItem value="month">Bulanan</SelectItem>
							<SelectItem value="year">Tahunan</SelectItem>
						</SelectContent>
					</Select>
				</div>
			)}
		</div>
	)
}

export function useReportDateRange() {
	const now = new Date()
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

	return React.useState<ReportRequestDto>({
		dateFrom: startOfMonth,
		dateTo: now,
		groupBy: 'day',
	})
}
