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
			title="Lokasi Baru"
			description="Tambahkan lokasi toko atau gudang baru."
			form={form}
			className="max-w-5xl"
			submitLabel="Buat Lokasi"
			onCancel={onDone}
		>
			<LocationFormFields form={form} />
		</EntityEditorPage>
	)
}
