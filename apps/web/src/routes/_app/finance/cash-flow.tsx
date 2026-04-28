import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/finance/cash-flow')({
	component: FinanceCashFlow,
})

function FinanceCashFlow() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Arus Kas (Cash Flow)</h1>
			<p className="text-muted-foreground">Halaman arus kas akan ditampilkan di sini.</p>
		</div>
	)
}
