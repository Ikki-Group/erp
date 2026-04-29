import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings/audit-trail')({
	component: SettingsAuditTrail,
})

function SettingsAuditTrail() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Audit Trail</h1>
			<p className="text-muted-foreground">Halaman audit trail akan ditampilkan di sini.</p>
		</div>
	)
}
