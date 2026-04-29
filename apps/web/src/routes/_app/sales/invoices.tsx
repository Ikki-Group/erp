import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/sales/invoices')({
	component: SalesInvoices,
})

function SalesInvoices() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Invoice & Surat Jalan</h1>
			<p className="text-muted-foreground">Halaman invoice dan surat jalan akan ditampilkan di sini.</p>
		</div>
	)
}
