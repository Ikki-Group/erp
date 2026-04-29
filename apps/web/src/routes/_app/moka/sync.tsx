import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/moka/sync')({
	component: MokaSync,
})

function MokaSync() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Sinkronisasi Produk</h1>
			<p className="text-muted-foreground">Halaman sinkronisasi produk Moka akan ditampilkan di sini.</p>
		</div>
	)
}
