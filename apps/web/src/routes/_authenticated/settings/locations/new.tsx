import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { locationResource } from '@/features/location/api'
import {
	LocationFormFields,
	useLocationForm,
} from '@/features/location/components/location-form'
import { useUnsavedChangesGuard } from '@/lib/form'

import { FormPage } from '@/components/shared/form-page'
import { toast } from '@/components/ui/toast'

export const Route = createFileRoute('/_authenticated/settings/locations/new')({
	component: NewLocationPage,
})

function NewLocationPage() {
	const navigate = useNavigate()
	const createMut = useMutation(locationResource.create.mutationOptions())
	const onDone = () => navigate({ to: '/settings/locations' })

	const form = useLocationForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				code: values.code,
				name: values.name,
				type: values.type,
				address: values.address || null,
				phone: values.phone || null,
				isActive: values.isActive,
			})
			toast.add({ title: 'Location created successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="New Location"
				description="Add a new store or warehouse location."
				form={form}
				className="max-w-5xl"
				submitLabel="Create Location"
				onCancel={onDone}
			>
				<LocationFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
