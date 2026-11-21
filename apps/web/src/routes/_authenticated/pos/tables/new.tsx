import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { EmptyState } from '@/components/shared/empty-state.tsx'
import { FormPage } from '@/components/shared/form-page.tsx'
import { PageHeader } from '@/components/shared/page-header.tsx'

import { toast } from '@/components/ui/toast'

import { tableResource } from '@/features/pos/api.ts'
import { TableFormFields, useTableForm } from '@/features/pos/components/table-form.tsx'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/pos/tables/new')({
	component: NewTablePage,
})

function NewTablePage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate()
	const createMut = useMutation(tableResource.create.mutationOptions())

	const form = useTableForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				locationId: activeLocation!.id,
				number: values.number,
				capacity: Number(values.capacity),
				isActive: values.isActive,
			})
			toast.add({ title: 'Meja berhasil dibuat.', type: 'success' })
			navigate({ to: '/pos/tables' })
		},
	})

	useUnsavedChangesGuard(form)

	if (!activeLocation) {
		return (
			<div className="space-y-6">
				<PageHeader title="Tambah Meja" description="Buat meja baru untuk lokasi ini." />
				<EmptyState
					title="Belum ada lokasi dipilih"
					description="Pilih lokasi untuk mengelola meja."
				/>
			</div>
		)
	}

	return (
		<form.AppForm>
			<FormPage
				title="Tambah Meja"
				description="Buat meja baru untuk lokasi ini."
				form={form}
				submitLabel="Buat"
				onCancel={() => navigate({ to: '/pos/tables' })}
			>
				<TableFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
