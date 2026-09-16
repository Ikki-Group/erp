import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { uomResource } from '@/features/uom/api.ts'
import { UomFormFields, useUomForm } from '@/features/uom/components/uom-form.tsx'

export const Route = createFileRoute('/_authenticated/master/uom/new')({
	component: NewUomPage,
})

function NewUomPage() {
	const navigate = useNavigate()
	const createMut = useMutation(uomResource.create.mutationOptions())

	const form = useUomForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync(values)
			toast.add({ title: 'Unit created successfully.', type: 'success' })
			navigate({ to: '/master/uom' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Unit"
				description="Create a new unit of measure."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/master/uom' })}
			>
				<UomFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
