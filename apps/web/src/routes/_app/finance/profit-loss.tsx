import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/finance/profit-loss')({
	component: FinanceProfitLoss,
})

function FinanceProfitLoss() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Laporan Laba Rugi</h1>
			<p className="text-muted-foreground">Halaman laporan laba rugi akan ditampilkan di sini.</p>
		</div>
	)
}
