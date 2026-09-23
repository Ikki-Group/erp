import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { assignmentResource, roleResource, userResource } from '@/features/iam/api.ts'
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

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => (
				<EditUserForm user={response.data} onDone={() => navigate({ to: '/settings/users' })} />
			)}
		</DetailBoundary>
	)
}

interface EditUserFormProps {
	user: UserDetailDto
	onDone: () => void
}

function EditUserForm({ user, onDone }: EditUserFormProps) {
	const rolesQuery = useQuery(roleResource.list.queryOptions({ page: 1, limit: 100 }))
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
	const updateMut = useMutation(userResource.update.mutationOptions())
	const assignMut = useMutation(assignmentResource.assign.mutationOptions())
	const removeAssignmentMut = useMutation(assignmentResource.remove.mutationOptions())

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

			const keyOf = (roleId: number, locationId: number | null) =>
				`${roleId}:${locationId ?? 'global'}`
			const existing = new Map(
				user.assignments.map((assignment) => [
					keyOf(assignment.roleId, assignment.locationId),
					assignment,
				]),
			)
			const desired = new Set(
				values.assignments.map((assignment) => keyOf(assignment.roleId, assignment.locationId)),
			)

			for (const assignment of user.assignments) {
				if (!desired.has(keyOf(assignment.roleId, assignment.locationId))) {
					await removeAssignmentMut.mutateAsync({
						userId: user.id,
						roleId: assignment.roleId,
						locationId: assignment.locationId,
					})
				}
			}

			for (const assignment of values.assignments) {
				if (!existing.has(keyOf(assignment.roleId, assignment.locationId))) {
					await assignMut.mutateAsync({ userId: user.id, ...assignment })
				}
			}
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
