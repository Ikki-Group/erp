import { createFileRoute } from '@tanstack/react-router'

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

	return <LocationDetailPage id={Number(id)} />
}
