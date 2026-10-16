import { useCallback } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon, EditIcon, Globe2Icon, KeyRoundIcon, MapPinIcon } from 'lucide-react'
import { z } from 'zod'

import {
	AuditInfo,
	AuditTrail,
	DetailBoundary,
	DetailIcon,
	DetailList,
	DetailPage,
	DetailSection,
	EmptyState,
	usePermissionCheck,
	StatusBadge,
} from '@/components/shared'
import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { Button } from '@/components/ui/button'

import { auditResource } from '@/features/audit/api.ts'
import { userResource } from '@/features/iam/api.ts'
import { resetUserPassword } from '@/features/iam/components/reset-password-dialog.tsx'
import { UserFormFields } from '@/features/iam/components/user-form'
import type { UserDetailDto } from '@/features/iam/dto/index.ts'
import { useUserEditor } from '@/features/iam/use-user-editor'

export const Route = createFileRoute('/_authenticated/settings/users/$userId')({
	validateSearch: z.object({ mode: z.literal('edit').optional() }),
	component: UserPage,
})

function UserPage() {
	const { userId } = Route.useParams()
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const detailQuery = useQuery(
		userResource.detail.queryOptions({ id: Number(userId) }, { throwOnError: false }),
	)

	return (
		<DetailBoundary query={detailQuery}>
			{(response) =>
				search.mode === 'edit' ? (
					<EditUserForm
						key={response.data.id}
						user={response.data}
						onDone={() => navigate({ to: '/settings/access-control', search: { tab: 'users' } })}
					/>
				) : (
					<UserDetailView
						user={response.data}
						onBack={() => navigate({ to: '/settings/access-control', search: { tab: 'users' } })}
						onEdit={() => navigate({ search: { mode: 'edit' } })}
					/>
				)
			}
		</DetailBoundary>
	)
}

interface AssignmentGroupsProps {
	assignments: UserDetailDto['assignments']
}

/**
 * Groups role assignments by location for better visual hierarchy.
 * Global assignments are shown first, followed by location-specific ones.
 */
function AssignmentGroups({ assignments }: AssignmentGroupsProps) {
	const globalAssignments = assignments.filter((a) => !a.location)
	const locationAssignments = assignments.filter((a) => a.location)

	// Group location assignments by location
	const locationGroups = locationAssignments.reduce(
		(acc, assignment) => {
			const key = assignment.location!.id
			if (!acc[key]) {
				acc[key] = {
					location: assignment.location!,
					assignments: [],
				}
			}
			acc[key].assignments.push(assignment)
			return acc
		},
		{} as Record<
			number,
			{
				location: NonNullable<UserDetailDto['assignments'][0]['location']>
				assignments: typeof assignments
			}
		>,
	)

	return (
		<div className="space-y-4">
			{/* Global assignments */}
			{globalAssignments.length > 0 && (
				<div>
					<div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
						<DetailIcon icon={<Globe2Icon />} className="size-3.5" />
						<span>Global · all locations</span>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{globalAssignments.map((assignment) => (
							<AssignmentCard key={assignment.id} assignment={assignment} />
						))}
					</div>
				</div>
			)}

			{/* Location-specific assignments */}
			{Object.values(locationGroups).map(({ location, assignments: groupAssignments }) => (
				<div key={location.id}>
					<div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
						<DetailIcon icon={<MapPinIcon />} className="size-3.5" />
						<span>
							{location.name} ({location.code})
						</span>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{groupAssignments.map((assignment) => (
							<AssignmentCard key={assignment.id} assignment={assignment} />
						))}
					</div>
				</div>
			))}
		</div>
	)
}

interface AssignmentCardProps {
	assignment: UserDetailDto['assignments'][0]
}

function AssignmentCard({ assignment }: AssignmentCardProps) {
	return (
		<div className="rounded-lg border p-3">
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1">
					<p className="font-medium">{assignment.role.name}</p>
					<p className="font-mono text-xs text-muted-foreground">{assignment.role.code}</p>
				</div>
			</div>
		</div>
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
		await resetUserPassword(user)
	}, [user])

	return (
		<DetailPage
			title={user.name}
			description={`Username: ${user.username}`}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={onBack}>
					<ArrowLeftIcon className="size-3.5" />
					Back to users
				</Button>
			}
			status={
				<StatusBadge variant={user.isActive ? 'success' : 'default'}>
					{user.isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			}
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
		>
			<DetailSection title="Profile" description="Basic account information and sign-in status.">
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
				<AuditInfo
					createdAt={user.createdAt}
					createdBy={user.createdBy}
					updatedAt={user.updatedAt}
					updatedBy={user.updatedBy}
				/>
			</DetailSection>

			<DetailSection
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
					<AssignmentGroups assignments={user.assignments} />
				)}
			</DetailSection>

			{canReadAudit && (
				<DetailSection title="Activity" description="Recent changes to this account.">
					<AuditTrail
						entries={auditQuery.data?.data ?? []}
						isLoading={auditQuery.isLoading}
						emptyMessage="No changes recorded for this user yet."
					/>
				</DetailSection>
			)}
		</DetailPage>
	)
}

interface EditUserFormProps {
	user: UserDetailDto
	onDone: () => void
}

function EditUserForm({ user, onDone }: EditUserFormProps) {
	const { form, mode } = useUserEditor({ user, onSaved: onDone })

	return (
		<EntityEditorPage
			title="Edit User"
			description={`Update details and access assignments for ${user.name}.`}
			form={form}
			submitLabel="Save Changes"
			onCancel={onDone}
		>
			<UserFormFields form={form} mode={mode} />
		</EntityEditorPage>
	)
}
