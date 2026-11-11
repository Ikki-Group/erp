import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { tableResource } from '@/features/pos/api.ts'
import {
	TableFormFields,
	toTableFormValues,
	useTableForm,
} from '@/features/pos/components/table-form.tsx'
import type { TableDto } from '@/features/pos/dto/index.ts'

export const Route = createFileRoute('/_authenticated/pos/tables/$tableId')({
	component: EditTablePage,
})

function EditTablePage() {
	const { tableId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(tableId)

	const detailQuery = useQuery(tableResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const table = detailQuery.data?.data
	if (!table) {
		return null
	}

	return <EditTableForm table={table} onDone={() => navigate({ to: '/pos/tables' })} />
}

interface EditTableFormProps {
	table: TableDto
	onDone: () => void
}

function EditTableForm({ table, onDone }: EditTableFormProps) {
	const updateMut = useMutation(tableResource.update.mutationOptions())
	const form = useTableForm({
		defaultValues: toTableFormValues(table),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({
				id: table.id,
				locationId: table.locationId,
				number: values.number,
				capacity: Number(values.capacity),
				isActive: values.isActive,
			})
			toast.add({ title: 'Table updated successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Table"
				description={`Update details for table ${table.number}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<TableFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
