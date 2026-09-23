import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { roleResource } from '@/features/iam/api.ts'
import {
	RoleFormFields,
	toRoleFormValues,
	useRoleForm,
} from '@/features/iam/components/role-form.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/roles/$roleId')({
	component: RoleDetailPage,
})

function RoleDetailPage() {
	const { roleId } = Route.useParams()
	const navigate = useNavigate()
	const detailQuery = useQuery(roleResource.detail.queryOptions({ id: Number(roleId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) =>
				response.data.isSystem ? (
					<SystemRoleDetail
						role={response.data}
						onDone={() => navigate({ to: '/settings/roles' })}
					/>
				) : (
					<EditRoleForm role={response.data} onDone={() => navigate({ to: '/settings/roles' })} />
				)
			}
		</DetailBoundary>
	)
}

interface RolePageProps {
	role: RoleDto
	onDone: () => void
}

function SystemRoleDetail({ role, onDone }: RolePageProps) {
	const form = useRoleForm({
		defaultValues: toRoleFormValues(role),
		onSubmit: async () => undefined,
	})

	return (
		<form.AppForm>
			<FormPage
				title="System Role Details"
				description={`${role.name} is managed by the system and cannot be modified.`}
				form={form}
				onCancel={onDone}
				cancelLabel="Back"
				readOnly
			>
				<RoleFormFields form={form} readOnly />
			</FormPage>
		</form.AppForm>
	)
}

function EditRoleForm({ role, onDone }: RolePageProps) {
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
