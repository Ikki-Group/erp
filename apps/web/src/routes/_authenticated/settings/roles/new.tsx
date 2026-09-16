import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { roleResource } from '@/features/iam/api.ts'
import { RoleFormFields, useRoleForm } from '@/features/iam/components/role-form.tsx'

export const Route = createFileRoute('/_authenticated/settings/roles/new')({
	component: NewRolePage,
})

function NewRolePage() {
	const navigate = useNavigate()
	const createMut = useMutation(roleResource.create.mutationOptions())

	const form = useRoleForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync(values)
			toast.add({ title: 'Role created successfully.', type: 'success' })
			navigate({ to: '/settings/roles' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Role"
				description="Create a new role with specific permissions."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/settings/roles' })}
			>
				<RoleFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
