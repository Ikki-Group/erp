import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EditIcon, Globe2Icon, MapPinIcon } from 'lucide-react'
import { z } from 'zod'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { FormPage } from '@/components/shared/form-page.tsx'
import { StatusBadge } from '@/components/shared/status-badge.tsx'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
	return (
		<div className="mx-auto max-w-3xl space-y-5 pb-20">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={onBack}>
						Back to users
					</Button>
					<h1 className="text-lg font-semibold tracking-tight">User Details</h1>
					<p className="text-xs text-muted-foreground">
						View profile and access assignments for {user.name}.
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={onEdit}>
					<EditIcon className="size-4" />
					Edit user
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Basic account information and sign-in status.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<DetailItem label="Full name" value={user.name} />
					<DetailItem label="Username" value={user.username} mono />
					<DetailItem label="Email" value={user.email} />
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Status</p>
						<StatusBadge variant={user.isActive ? 'success' : 'default'}>
							{user.isActive ? 'Active' : 'Inactive'}
						</StatusBadge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Role assignments</CardTitle>
					<CardDescription>
						{user.assignments.length === 0
							? 'This user has no access assignments.'
							: `${user.assignments.length} role assignment${user.assignments.length === 1 ? '' : 's'}.`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{user.assignments.length === 0 ? (
						<div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
							No roles assigned
						</div>
					) : (
						<div className="grid gap-3 sm:grid-cols-2">
							{user.assignments.map((assignment) => (
								<div key={assignment.id} className="rounded-md border p-3">
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
				</CardContent>
			</Card>
		</div>
	)
}

function DetailItem({
	label,
	value,
	mono = false,
}: {
	label: string
	value: string
	mono?: boolean
}) {
	return (
		<div className="space-y-1">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</p>
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
				...(values.password ? { password: values.password } : {}),
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
			<FormPage
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
			</FormPage>
		</form.AppForm>
	)
}
