import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/analytics/finance')({
	component: AnalyticsFinance,
})

function AnalyticsFinance() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Laporan Keuangan</h1>
			<p className="text-muted-foreground">Halaman laporan keuangan akan ditampilkan di sini.</p>
		</div>
	)
}
