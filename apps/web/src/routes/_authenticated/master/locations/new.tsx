import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { locationResource } from '@/features/location/api.ts'
import { LocationFormFields, useLocationForm } from '@/features/location/components/location-form.tsx'

export const Route = createFileRoute('/_authenticated/master/locations/new')({
	component: NewLocationPage,
})

function NewLocationPage() {
	const navigate = useNavigate()
	const createMut = useMutation(locationResource.create.mutationOptions())

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
			navigate({ to: '/master/locations' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Location"
				description="Create a new location for your organization."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/master/locations' })}
			>
				<LocationFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
