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
			toast.add({ title: 'Table created successfully.', type: 'success' })
			navigate({ to: '/pos/tables' })
		},
	})

	useUnsavedChangesGuard(form)

	if (!activeLocation) {
		return (
			<div className="space-y-6">
				<PageHeader title="Add Table" description="Create a new table for this location." />
				<EmptyState
					title="No location selected"
					description="Please select a location to manage tables."
				/>
			</div>
		)
	}

	return (
		<form.AppForm>
			<FormPage
				title="Add Table"
				description="Create a new table for this location."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/pos/tables' })}
			>
				<TableFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
