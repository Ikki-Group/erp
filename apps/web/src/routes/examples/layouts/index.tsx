import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/examples/layouts/')({ component: LayoutsPage })

function LayoutsPage() {
	return (
		<div className="flex flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">Layout Examples</h1>
			<p className="text-muted-foreground">See page-layouts example for Page component usage.</p>
		</div>
	)
}
