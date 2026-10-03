import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { PageHeader, PageSection, PageTabs } from '@/components/shared'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/design-system/navigation')({
	component: NavigationPage,
})

function NavigationPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Navigation"
				description="Wayfinding components — tabs within a page, and breadcrumbs for nested detail routes."
			/>

			{/* ─── PAGE TABS ─── */}
			<PageSection title="Page Tabs" description="Horizontal tab navigation for detail pages.">
				<PageTabsDemo />
			</PageSection>

			<Separator />

			{/* ─── BREADCRUMB ─── */}
			<PageSection
				title="Breadcrumb"
				description="Hierarchical location indicator for nested detail pages (e.g. Materials → Coffee Beans → Edit)."
			>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink render={<span className="cursor-default" />}>
								Materials
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink render={<span className="cursor-default" />}>
								Coffee Beans
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Edit</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</PageSection>
		</div>
	)
}

function PageTabsDemo() {
	const [activeTab, setActiveTab] = useState('info')

	return (
		<div className="space-y-4">
			<PageTabs
				tabs={[
					{ id: 'info', label: 'Info' },
					{ id: 'stock', label: 'Stock', count: 3 },
					{ id: 'history', label: 'History', count: 24 },
					{ id: 'pricing', label: 'Pricing' },
				]}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
			<p className="text-sm text-muted-foreground">
				Active tab: <span className="font-medium text-foreground">{activeTab}</span>
			</p>
		</div>
	)
}
