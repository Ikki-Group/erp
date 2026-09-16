import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { menuItemResource } from '@/features/menu/api.ts'
import {
	MenuItemFormFields,
	toMenuItemFormValues,
	useMenuItemForm,
} from '@/features/menu/components/menu-item-form.tsx'
import type { MenuItemDto } from '@/features/menu/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/menu/items/$itemId')({
	component: EditMenuItemPage,
})

function EditMenuItemPage() {
	const { itemId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(itemId)

	const detailQuery = useQuery(menuItemResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const item = detailQuery.data?.data
	if (!item) {
		return null
	}

	return <EditMenuItemForm item={item} onDone={() => navigate({ to: '/master/menu' })} />
}

interface EditMenuItemFormProps {
	item: MenuItemDto
	onDone: () => void
}

function EditMenuItemForm({ item, onDone }: EditMenuItemFormProps) {
	const updateMut = useMutation(menuItemResource.update.mutationOptions())
	const form = useMenuItemForm({
		defaultValues: toMenuItemFormValues(item),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({
				id: item.id,
				sku: values.sku,
				name: values.name,
				categoryId: values.categoryId,
				basePrice: values.basePrice,
				status: values.status,
			})
			toast.add({ title: 'Menu item berhasil diperbarui.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Menu Item"
				description={`Edit "${item.name}".`}
				form={form}
				submitLabel="Simpan"
				onCancel={onDone}
			>
				<MenuItemFormFields form={form} locationId={item.locationId} />
			</FormPage>
		</form.AppForm>
	)
}
