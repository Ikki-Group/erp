import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import type { ComponentRegistryEntry } from '../registry'
import { Breadcrumbs } from './breadcrumbs'
import { FormLayout } from './form-layout'
import { Page } from './page'
import { EmptyState, LoadingState, ErrorState, NotFoundState } from './state-layouts'

/**
 * Preview renderers for layout components.
 * Keyed by component `name` from the registry.
 */
export const layoutPreviews: Record<string, ComponentRegistryEntry['preview']> = {
	Page: () => (
		<Page size="md" padding="none">
			<Page.BlockHeader
				title="Page Layout"
				description="Container for consistent page layouts"
				action={
					<Button size="sm">
						<PlusIcon className="size-4" />
						Action
					</Button>
				}
			/>
			<Page.Content>
				<Card>
					<CardContent className="p-6">
						<p className="text-sm text-muted-foreground">Page content goes here</p>
					</CardContent>
				</Card>
			</Page.Content>
		</Page>
	),

	FormLayout: () => (
		<FormLayout gap="md">
			<FormLayout.CardSection title="Form Section" description="Form fields container">
				<div className="space-y-4">
					<div className="h-10 rounded-md border bg-muted/50" />
					<div className="h-10 rounded-md border bg-muted/50" />
				</div>
			</FormLayout.CardSection>
			<FormLayout.Actions>
				<Button variant="outline" size="sm">
					Cancel
				</Button>
				<Button size="sm">Submit</Button>
			</FormLayout.Actions>
		</FormLayout>
	),

	FormDialog: () => (
		<div className="max-w-md">
			<Card>
				<CardContent className="p-6">
					<div className="space-y-4">
						<h3 className="font-semibold">Dialog Preview</h3>
						<p className="text-sm text-muted-foreground">
							FormDialog provides consistent dialog layout for forms
						</p>
						<div className="h-10 rounded-md border bg-muted/50" />
						<div className="flex justify-end gap-2 pt-4">
							<Button variant="outline" size="sm">
								Cancel
							</Button>
							<Button size="sm">Confirm</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	),

	Breadcrumbs: () => (
		<div className="flex items-center gap-2 text-sm">
			<Breadcrumbs />
		</div>
	),

	EmptyState: () => (
		<EmptyState title="No Data" description="Start by adding your first item" size="sm" />
	),

	LoadingState: () => <LoadingState size="sm" />,

	ErrorState: () => <ErrorState size="sm" />,

	NotFoundState: () => <NotFoundState size="sm" />,
}
