import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { roleResource, userResource } from '@/features/iam/api.ts'
import {
	UserFormFields,
	toUserFormValues,
	useUserForm,
} from '@/features/iam/components/user-form.tsx'
import type { UserDetailDto } from '@/features/iam/dto/index.ts'
import { locationResource } from '@/features/location/api.ts'

export const Route = createFileRoute('/_authenticated/settings/users/$userId')({
	component: EditUserPage,
})

function EditUserPage() {
	const { userId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(userId)

	const detailQuery = useQuery(userResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const user = detailQuery.data?.data
	if (!user) {
		return null
	}

	return <EditUserForm user={user} onDone={() => navigate({ to: '/settings/users' })} />
}

interface EditUserFormProps {
	user: UserDetailDto
	onDone: () => void
}

function EditUserForm({ user, onDone }: EditUserFormProps) {
	const rolesQuery = useQuery(roleResource.list.queryOptions({ page: 1, limit: 100 }))
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
	const updateMut = useMutation(userResource.update.mutationOptions())

	const roleOptions = useMemo(
		() => (rolesQuery.data?.data ?? []).map((r) => ({ label: r.name, value: r.id })),
		[rolesQuery.data],
	)
	const locationOptions = useMemo(
		() => (locationsQuery.data?.data ?? []).map((l) => ({ label: l.name, value: l.id })),
		[locationsQuery.data],
	)

	const form = useUserForm({
		mode: 'edit',
		defaultValues: toUserFormValues(user),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({
				id: user.id,
				username: values.username,
				email: values.email,
				name: values.name,
				isActive: values.isActive,
				...(values.password ? { password: values.password } : {}),
			})
			toast.add({ title: 'User updated successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit User"
				description={`Update details for ${user.name}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<UserFormFields
					form={form}
					mode="edit"
					roleOptions={roleOptions}
					locationOptions={locationOptions}
				/>
			</FormPage>
		</form.AppForm>
	)
}
