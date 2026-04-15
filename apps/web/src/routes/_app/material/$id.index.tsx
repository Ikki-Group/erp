import { createFileRoute } from '@tanstack/react-router'

import { materialApi } from '@/features/material'
import { MaterialDetailPage } from '@/features/material/components/material-detail-page'

export const Route = createFileRoute('/_app/material/$id/')({
	loader: async ({ context, params }) => {
		await context.qc.ensureQueryData(materialApi.detail.query({ id: Number(params.id) }))
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { id } = Route.useParams()

	return <MaterialDetailPage id={Number(id)} />
}
