import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'

import { Page } from '@/components/layout/page'
import { locationApi } from '@/features/location'
import { LocationDetailPage } from '@/features/location/components/location-detail-page'

export const Route = createFileRoute('/_app/location/$id/')({
	loader: async ({ context, params }) => {
		await context.qc.ensureQueryData(locationApi.detail.query({ id: Number(params.id) }))
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { id } = Route.useParams()

	return (
		<Suspense
			fallback={
				<Page>
					<Page.BlockHeader title="Loading..." />
					<Page.Content>
						<div className="flex items-center justify-center h-64">
							<div className="animate-pulse flex flex-col items-center gap-4">
								<div className="size-12 rounded-full bg-muted" />
								<div className="h-4 w-48 bg-muted rounded" />
							</div>
						</div>
					</Page.Content>
				</Page>
			}
		>
			<LocationDetailPage id={Number(id)} />
		</Suspense>
	)
}
