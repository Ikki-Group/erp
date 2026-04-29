import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/hr/payroll')({
	component: HrPayroll,
})

function HrPayroll() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Penggajian (Payroll)</h1>
			<p className="text-muted-foreground">Halaman penggajian akan ditampilkan di sini.</p>
		</div>
	)
}
