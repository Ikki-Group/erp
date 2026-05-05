import { DatePicker } from '@/components/ui/date-picker'

interface DateRange {
	dateFrom: Date
	dateTo: Date
}

export function ReportDateFilter({ dateFrom, dateTo, onChange }: DateRange & { onChange: (range: DateRange) => void }) {
	return (
		<div className="flex items-center gap-3">
			<DatePicker
				date={dateFrom}
				onDateChange={(date) => date && onChange({ dateFrom: date, dateTo })}
				placeholder="Dari tanggal"
			/>
			<span className="text-muted-foreground">s.d.</span>
			<DatePicker
				date={dateTo}
				onDateChange={(date) => date && onChange({ dateFrom, dateTo: date })}
				placeholder="Sampai tanggal"
			/>
		</div>
	)
}
