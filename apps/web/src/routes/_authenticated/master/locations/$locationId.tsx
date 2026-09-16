import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { locationResource } from '@/features/location/api.ts'
import { LocationFormFields, useLocationForm } from '@/features/location/components/location-form.tsx'
import type { LocationDto } from '@/features/location/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/locations/$locationId')({
	component: EditLocationPage,
})

function toFormValues(location: LocationDto) {
	return {
		code: location.code,
		name: location.name,
		type: location.type,
		address: location.address ?? '',
		phone: location.phone ?? '',
		isActive: location.isActive,
	}
}

function EditLocationPage() {
	const { locationId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(locationId)

	const detailQuery = useQuery(locationResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const location = detailQuery.data?.data
	if (!location) {
		return null
	}

	return (
		<EditLocationForm location={location} onDone={() => navigate({ to: '/master/locations' })} />
	)
}

interface EditLocationFormProps {
	location: LocationDto
	onDone: () => void
}

function EditLocationForm({ location, onDone }: EditLocationFormProps) {
	const updateMut = useMutation(locationResource.update.mutationOptions())
	const form = useLocationForm({
		defaultValues: toFormValues(location),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({
				id: location.id,
				code: values.code,
				name: values.name,
				type: values.type,
				address: values.address || null,
				phone: values.phone || null,
				isActive: values.isActive,
			})
			toast.add({ title: 'Location updated successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Location"
				description={`Update details for ${location.name}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<LocationFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
