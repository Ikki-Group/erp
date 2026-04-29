import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/hr/attendance')({
	component: HrAttendance,
})

function HrAttendance() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Absensi & Jadwal</h1>
			<p className="text-muted-foreground">Halaman absensi dan jadwal akan ditampilkan di sini.</p>
		</div>
	)
}
