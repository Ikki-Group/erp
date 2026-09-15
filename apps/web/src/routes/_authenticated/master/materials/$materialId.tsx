import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { materialResource } from '@/features/material/api.ts'
import { MaterialFormFields, useMaterialForm } from '@/features/material/components/material-form.tsx'
import type { MaterialDto } from '@/features/material/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/materials/$materialId')({
	component: EditMaterialPage,
})

function toFormValues(material: MaterialDto) {
	return {
		code: material.code,
		name: material.name,
		type: material.type,
		categoryId: material.categoryId,
		baseUomId: material.baseUomId,
		defaultPurchaseUomId: material.defaultPurchaseUomId,
		defaultStockUomId: material.defaultStockUomId,
		defaultRecipeUomId: material.defaultRecipeUomId,
		minStock: material.minStock ?? '',
		isActive: material.isActive,
	}
}

function EditMaterialPage() {
	const { materialId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(materialId)

	const detailQuery = useQuery(materialResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const material = detailQuery.data?.data
	if (!material) {
		return null
	}

	return (
		<EditMaterialForm
			material={material}
			onDone={() => navigate({ to: '/master/materials' })}
		/>
	)
}

interface EditMaterialFormProps {
	material: MaterialDto
	onDone: () => void
}

/**
 * Split into its own component so `useMaterialForm`'s `defaultValues` are
 * captured once the detail query has resolved — otherwise the form would
 * re-initialize from a stale/empty value on every parent re-render.
 */
function EditMaterialForm({ material, onDone }: EditMaterialFormProps) {
	const updateMut = useMutation(materialResource.update.mutationOptions())
	const form = useMaterialForm({
		defaultValues: toFormValues(material),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({
				id: material.id,
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
			toast.add({ title: 'Material updated successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Material"
				description={`Update details for ${material.name}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<MaterialFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
