import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
	component: DashboardPage,
})

function DashboardPage() {
	return (
		<div className="space-y-4">
			<h1 className="text-lg font-semibold">Dashboard</h1>
			<p className="text-sm text-muted-foreground">
				Welcome to Ikki ERP. Select a section from the sidebar to get started.
			</p>
		</div>
	)
}
