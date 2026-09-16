import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { assignmentResource, roleResource, userResource } from '@/features/iam/api.ts'
import { UserFormFields, useUserForm } from '@/features/iam/components/user-form.tsx'
import { locationResource } from '@/features/location/api.ts'

export const Route = createFileRoute('/_authenticated/settings/users/new')({
	component: NewUserPage,
})

function NewUserPage() {
	const navigate = useNavigate()
	const rolesQuery = useQuery(roleResource.list.queryOptions({ page: 1, limit: 100 }))
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))

	const createMut = useMutation(userResource.create.mutationOptions())
	const assignMut = useMutation(assignmentResource.assign.mutationOptions())

	const roleOptions = useMemo(
		() => (rolesQuery.data?.data ?? []).map((r) => ({ label: r.name, value: r.id })),
		[rolesQuery.data],
	)
	const locationOptions = useMemo(
		() => (locationsQuery.data?.data ?? []).map((l) => ({ label: l.name, value: l.id })),
		[locationsQuery.data],
	)

	const form = useUserForm({
		mode: 'create',
		onSubmit: async (values) => {
			const result = await createMut.mutateAsync({
				username: values.username,
				email: values.email,
				name: values.name,
				password: values.password,
				isActive: values.isActive,
			})

			if (values.roleId) {
				await assignMut.mutateAsync({
					userId: result.data.id,
					roleId: values.roleId,
					locationId: values.locationId,
				})
			}

			toast.add({ title: 'User created successfully.', type: 'success' })
			navigate({ to: '/settings/users' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add User"
				description="Create a new user account."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/settings/users' })}
			>
				<UserFormFields
					form={form}
					mode="create"
					roleOptions={roleOptions}
					locationOptions={locationOptions}
				/>
			</FormPage>
		</form.AppForm>
	)
}
