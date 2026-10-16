import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary'
import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { locationResource } from '@/features/location/api'
import { LocationFormFields, useLocationForm } from '@/features/location/components/location-form'
import type { LocationDto } from '@/features/location/dto'

export const Route = createFileRoute('/_authenticated/settings/locations/$locationId/edit')({
	component: EditLocationPage,
})

function EditLocationPage() {
	const { locationId } = Route.useParams()
	const navigate = useNavigate()
	const detailQuery = useQuery(
		locationResource.detail.queryOptions({ id: Number(locationId) }, { throwOnError: false }),
	)

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => (
				<EditLocationForm
					key={response.data.id}
					location={response.data}
					onDone={() => navigate({ to: '/settings/locations' })}
				/>
			)}
		</DetailBoundary>
	)
}

function EditLocationForm({ location, onDone }: { location: LocationDto; onDone: () => void }) {
	const form = useLocationForm({ location, onSaved: onDone })

	return (
		<EntityEditorPage
			title="Edit Location"
			description={`Update details for ${location.name}.`}
			form={form}
			className="max-w-5xl"
			submitLabel="Save Changes"
			onCancel={onDone}
		>
			<LocationFormFields form={form} />
		</EntityEditorPage>
	)
}
