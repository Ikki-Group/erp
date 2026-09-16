import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EmptyState } from '@/components/shared/empty-state.tsx'
import { FormPage } from '@/components/shared/form-page.tsx'
import { PageHeader } from '@/components/shared/page-header.tsx'

import { toast } from '@/components/ui/toast'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { menuItemResource } from '@/features/menu/api.ts'
import { MenuItemFormFields, useMenuItemForm } from '@/features/menu/components/menu-item-form.tsx'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/master/menu/items/new')({
	component: NewMenuItemPage,
})

function NewMenuItemPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate()
	const createMut = useMutation(menuItemResource.create.mutationOptions())

	const form = useMenuItemForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				locationId: activeLocation!.id,
				sku: values.sku,
				name: values.name,
				categoryId: values.categoryId,
				basePrice: values.basePrice,
				status: values.status,
			})
			toast.add({ title: 'Menu item berhasil dibuat.', type: 'success' })
			navigate({ to: '/master/menu' })
		},
	})

	useUnsavedChangesGuard(form)

	if (!activeLocation) {
		return (
			<div className="space-y-6">
				<PageHeader title="Tambah Menu Item" description="Buat item menu baru untuk lokasi ini." />
				<EmptyState
					title="Belum ada lokasi dipilih"
					description="Pilih lokasi terlebih dahulu untuk mengelola menu."
				/>
			</div>
		)
	}

	return (
		<form.AppForm>
			<FormPage
				title="Tambah Menu Item"
				description="Buat item menu baru untuk lokasi ini."
				form={form}
				submitLabel="Simpan"
				onCancel={() => navigate({ to: '/master/menu' })}
			>
				<MenuItemFormFields form={form} locationId={activeLocation.id} />
			</FormPage>
		</form.AppForm>
	)
}
