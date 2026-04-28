import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/analytics/sales')({
	component: AnalyticsSales,
})

function AnalyticsSales() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Laporan Penjualan</h1>
			<p className="text-muted-foreground">Halaman laporan penjualan akan ditampilkan di sini.</p>
		</div>
	)
}
