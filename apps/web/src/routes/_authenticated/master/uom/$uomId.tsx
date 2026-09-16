import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { uomResource } from '@/features/uom/api.ts'
import { UomFormFields, toUomFormValues, useUomForm } from '@/features/uom/components/uom-form.tsx'
import type { UomDto } from '@/features/uom/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/uom/$uomId')({
	component: EditUomPage,
})

function EditUomPage() {
	const { uomId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(uomId)

	const detailQuery = useQuery(uomResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const unit = detailQuery.data?.data
	if (!unit) {
		return null
	}

	return <EditUomForm unit={unit} onDone={() => navigate({ to: '/master/uom' })} />
}

interface EditUomFormProps {
	unit: UomDto
	onDone: () => void
}

function EditUomForm({ unit, onDone }: EditUomFormProps) {
	const updateMut = useMutation(uomResource.update.mutationOptions())
	const form = useUomForm({
		defaultValues: toUomFormValues(unit),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({ id: unit.id, ...values })
			toast.add({ title: 'Unit updated successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Unit"
				description={`Update details for ${unit.name}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<UomFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
