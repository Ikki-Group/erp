import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { suspenseOptions } from '@/lib/api/index.ts'
import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageError } from '@/components/shared/page-error.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { locationResource } from '@/features/location/api.ts'
import {
	LocationFormFields,
	useLocationForm,
} from '@/features/location/components/location-form.tsx'
import type { LocationDto } from '@/features/location/dto/index.ts'

function detailQueryOptions(id: number) {
	return locationResource.detail.queryOptions({ id })
}

export const Route = createFileRoute('/_authenticated/master/locations/$locationId')({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(detailQueryOptions(Number(params.locationId))),
	pendingComponent: () => <PageSkeleton />,
	errorComponent: ({ reset }) => (
		<PageError
			title="Failed to load location"
			message="Could not load this location. Check your connection and try again."
			onRetry={reset}
		/>
	),
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
	const detailQuery = useSuspenseQuery(suspenseOptions(detailQueryOptions(Number(locationId))))
	const location = detailQuery.data.data

	const updateMut = useMutation(locationResource.update.mutationOptions())
	const onDone = () => navigate({ to: '/master/locations' })

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
