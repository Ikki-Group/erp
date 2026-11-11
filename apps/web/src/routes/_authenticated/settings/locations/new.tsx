import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { LocationFormFields, useLocationForm } from '@/features/location/components/location-form'

export const Route = createFileRoute('/_authenticated/settings/locations/new')({
	component: NewLocationPage,
})

function NewLocationPage() {
	const navigate = useNavigate()
	const onDone = () => navigate({ to: '/settings/locations' })
	const form = useLocationForm({ onSaved: onDone })

	return (
		<EntityEditorPage
			title="New Location"
			description="Add a new store or warehouse location."
			form={form}
			className="max-w-5xl"
			submitLabel="Create Location"
			onCancel={onDone}
		>
			<LocationFormFields form={form} />
		</EntityEditorPage>
	)
}
