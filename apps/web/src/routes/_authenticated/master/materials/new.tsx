import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { materialResource } from '@/features/material/api.ts'
import { MaterialFormFields, useMaterialForm } from '@/features/material/components/material-form.tsx'

export const Route = createFileRoute('/_authenticated/master/materials/new')({
	component: NewMaterialPage,
})

function NewMaterialPage() {
	const navigate = useNavigate()
	const createMut = useMutation(materialResource.create.mutationOptions())

	const form = useMaterialForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				code: values.code,
				name: values.name,
				type: values.type,
				categoryId: values.categoryId,
				baseUomId: values.baseUomId!,
				defaultPurchaseUomId: values.defaultPurchaseUomId,
				defaultStockUomId: values.defaultStockUomId,
				defaultRecipeUomId: values.defaultRecipeUomId,
				minStock: values.minStock || null,
				isActive: values.isActive,
			})
			toast.add({ title: 'Material created successfully.', type: 'success' })
			navigate({ to: '/master/materials' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Material"
				description="Create a new material."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/master/materials' })}
			>
				<MaterialFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
