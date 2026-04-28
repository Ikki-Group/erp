import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/hr/employees')({
	component: HrEmployees,
})

function HrEmployees() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Daftar Staff</h1>
			<p className="text-muted-foreground">Halaman daftar staff akan ditampilkan di sini.</p>
		</div>
	)
}
