import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { roleResource } from '@/features/iam/api.ts'
import { RoleFormFields, toRoleFormValues, useRoleForm } from '@/features/iam/components/role-form.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/roles/$roleId')({
	component: EditRolePage,
})

function EditRolePage() {
	const { roleId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(roleId)

	const detailQuery = useQuery(roleResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const role = detailQuery.data?.data
	if (!role) {
		return null
	}

	return <EditRoleForm role={role} onDone={() => navigate({ to: '/settings/roles' })} />
}

interface EditRoleFormProps {
	role: RoleDto
	onDone: () => void
}

function EditRoleForm({ role, onDone }: EditRoleFormProps) {
	const updateMut = useMutation(roleResource.update.mutationOptions())
	const form = useRoleForm({
		defaultValues: toRoleFormValues(role),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({ id: role.id, ...values })
			toast.add({ title: 'Role updated successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Role"
				description={`Update permissions for ${role.name}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<RoleFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
