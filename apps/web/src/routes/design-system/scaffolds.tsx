import type { ReactNode } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { PlusIcon } from 'lucide-react'

import {
	DetailList,
	DetailPage,
	DetailSection,
	NotFound,
	PageHeader,
	PageSection,
	PageShell,
	StatusBadge,
} from '@/components/shared'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/design-system/scaffolds')({
	component: ScaffoldsPage,
})

/** Bounded frame so a full-page scaffold can be previewed inside the catalog. */
function Frame({ children }: { children: ReactNode }) {
	return <div className="rounded-lg border bg-background p-4 sm:p-6">{children}</div>
}

function ScaffoldsPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Page Scaffolds"
				description="Every route composes one of these. List pages: PageShell / EntityListPage (Tables page). Create/edit: FormPage (Forms page) or WizardPage. Read views: DetailPage."
			/>

			<PageSection
				title="Page Shell"
				description="Title, description, and right-aligned actions over the page body. One page title per route."
			>
				<Frame>
					<PageShell
						title="Materials"
						description="Raw materials and packaging tracked in stock."
						actions={
							<Button size="sm">
								<PlusIcon data-icon="inline-start" />
								New material
							</Button>
						}
					>
						<p className="text-xs text-muted-foreground">Page body (usually a DataTable).</p>
					</PageShell>
				</Frame>
			</PageSection>

			<Separator />

			<PageSection
				title="Detail Page"
				description="Read view: title + status + actions, then DetailSections divided by spacing, not nested cards."
			>
				<Frame>
					<DetailPage
						title="Coffee Beans (Arabica)"
						description="MAT-001"
						status={<StatusBadge variant="success">Active</StatusBadge>}
						actions={
							<Button variant="outline" size="sm">
								Edit
							</Button>
						}
					>
						<DetailSection title="General">
							<DetailList
								items={[
									{ label: 'Category', value: 'Raw Material' },
									{ label: 'Base UoM', value: 'kg' },
									{ label: 'Min stock', value: '10 kg' },
								]}
								columns={3}
							/>
						</DetailSection>
					</DetailPage>
				</Frame>
			</PageSection>

			<Separator />

			<PageSection title="Not Found" description="Unknown route or missing record.">
				<Frame>
					<NotFound showHomeLink={false} />
				</Frame>
			</PageSection>
		</div>
	)
}
