interface DateRange {
	dateFrom: Date
	dateTo: Date
}

function toInputDate(d: Date): string {
	return d.toISOString().slice(0, 10)
}

export function ReportDateFilter({
	dateFrom,
	dateTo,
	onChange,
}: DateRange & { onChange: (range: DateRange) => void }) {
	return (
		<div className="flex items-center gap-3">
			<input
				type="date"
				value={toInputDate(dateFrom)}
				onChange={(e) => onChange({ dateFrom: new Date(e.target.value), dateTo })}
				className="rounded-md border px-3 py-1.5 text-sm"
			/>
			<span className="text-muted-foreground text-sm">s.d.</span>
			<input
				type="date"
				value={toInputDate(dateTo)}
				onChange={(e) => onChange({ dateFrom, dateTo: new Date(e.target.value) })}
				className="rounded-md border px-3 py-1.5 text-sm"
			/>
		</div>
	)
}
