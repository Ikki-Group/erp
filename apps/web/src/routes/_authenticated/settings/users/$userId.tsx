import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon, EditIcon, Globe2Icon, KeyRoundIcon, MapPinIcon } from 'lucide-react'
import { z } from 'zod'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { AuditTrail } from '@/components/shared/audit-trail.tsx'
import { CrudForm } from '@/components/shared/crud-form.tsx'
import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { DetailList } from '@/components/shared/detail-list.tsx'
import { EmptyState } from '@/components/shared/empty-state.tsx'
import { PageHeader } from '@/components/shared/page-header.tsx'
import { PageSection } from '@/components/shared/page-section.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'
import { StatusBadge } from '@/components/shared/status-badge.tsx'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { auditResource } from '@/features/audit/api.ts'
import { assignmentResource, roleResource, userResource } from '@/features/iam/api.ts'
import { resetUserPassword } from '@/features/iam/components/reset-password-dialog.tsx'
import {
	UserFormFields,
	toUserFormValues,
	useUserForm,
} from '@/features/iam/components/user-form.tsx'
import type { UserDetailDto } from '@/features/iam/dto/index.ts'
import { locationResource } from '@/features/location/api.ts'

export const Route = createFileRoute('/_authenticated/settings/users/$userId')({
	validateSearch: z.object({ mode: z.literal('edit').optional() }),
	component: UserPage,
})

function UserPage() {
	const { userId } = Route.useParams()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const detailQuery = useQuery(userResource.detail.queryOptions({ id: Number(userId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) =>
				search.mode === 'edit' ? (
					<EditUserForm user={response.data} onDone={() => navigate({ to: '/settings/users' })} />
				) : (
					<UserDetailView
						user={response.data}
						onBack={() => navigate({ to: '/settings/users' })}
						onEdit={() => navigate({ search: { mode: 'edit' } })}
					/>
				)
			}
		</DetailBoundary>
	)
}

interface UserDetailViewProps {
	user: UserDetailDto
	onBack: () => void
	onEdit: () => void
}

function UserDetailView({ user, onBack, onEdit }: UserDetailViewProps) {
	const canEdit = usePermissionCheck({ permission: 'iam.update' })
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })

	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'user', entityId: user.id }),
		enabled: canReadAudit,
	})

	const handleResetPassword = useCallback(async () => {
		const saved = await resetUserPassword(user)
		if (saved) toast.add({ title: 'Password reset successfully.', type: 'success' })
	}, [user])

	return (
		<div className="mx-auto max-w-3xl space-y-6 pb-20">
			<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={onBack}>
				<ArrowLeftIcon className="size-3.5" />
				Back to users
			</Button>

			<PageHeader
				title="User Details"
				description={`View profile and access assignments for ${user.name}.`}
				actions={
					canEdit && (
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={handleResetPassword}>
								<KeyRoundIcon className="size-4" />
								Reset Password
							</Button>
							<Button size="sm" onClick={onEdit}>
								<EditIcon className="size-4" />
								Edit User
							</Button>
						</div>
					)
				}
			/>

			<PageSection title="Profile" description="Basic account information and sign-in status.">
				<DetailList
					items={[
						{ label: 'Full name', value: user.name },
						{
							label: 'Username',
							value: <code className="font-mono text-sm">{user.username}</code>,
						},
						{ label: 'Email', value: user.email },
						{
							label: 'Status',
							value: (
								<StatusBadge variant={user.isActive ? 'success' : 'default'}>
									{user.isActive ? 'Active' : 'Inactive'}
								</StatusBadge>
							),
						},
					]}
				/>
			</PageSection>

			<PageSection
				title="Role assignments"
				description={
					user.assignments.length === 0
						? undefined
						: `${user.assignments.length} role assignment${user.assignments.length === 1 ? '' : 's'}.`
				}
			>
				{user.assignments.length === 0 ? (
					<EmptyState
						title="No roles assigned"
						description="This user cannot access any protected resources."
					/>
				) : (
					<div className="grid gap-3 sm:grid-cols-2">
						{user.assignments.map((assignment) => (
							<div key={assignment.id} className="rounded-lg border p-3">
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="font-medium">{assignment.role.name}</p>
										<p className="font-mono text-[11px] text-muted-foreground">
											{assignment.role.code}
										</p>
									</div>
									{assignment.location ? (
										<MapPinIcon className="size-4 text-muted-foreground" />
									) : (
										<Globe2Icon className="size-4 text-muted-foreground" />
									)}
								</div>
								<p className="mt-3 text-xs text-muted-foreground">
									{assignment.location
										? `${assignment.location.name} (${assignment.location.code})`
										: 'Global access · all locations'}
								</p>
							</div>
						))}
					</div>
				)}
			</PageSection>

			{canReadAudit && (
				<PageSection title="Activity" description="Recent changes to this account.">
					<AuditTrail
						entries={auditQuery.data?.data ?? []}
						isLoading={auditQuery.isLoading}
						emptyMessage="No changes recorded for this user yet."
					/>
				</PageSection>
			)}
		</div>
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
		() => (rolesQuery.data?.data ?? []).map((role) => ({ label: role.name, value: role.id })),
		[rolesQuery.data],
	)
	const locationOptions = useMemo(
		() =>
			(locationsQuery.data?.data ?? []).map((location) => ({
				label: location.name,
				value: location.id,
			})),
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
			})

			const keyOf = (roleId: number, locationId: number | null) =>
				`${roleId}:${locationId ?? 'global'}`
			const existing = new Set(
				user.assignments.map((assignment) => keyOf(assignment.roleId, assignment.locationId)),
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
			<CrudForm
				title="Edit User"
				description={`Update details and access assignments for ${user.name}.`}
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
			</CrudForm>
		</form.AppForm>
	)
}
