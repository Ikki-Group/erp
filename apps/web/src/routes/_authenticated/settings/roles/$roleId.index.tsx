import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react'

import {
	ActionMenu,
	DetailBoundary,
	DetailPage,
	StatusBadge,
	usePermissionCheck,
} from '@/components/shared'
import { confirm } from '@/components/shared/confirm'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { roleResource } from '@/features/iam/api.ts'
import {
	RoleFormFields,
	toRoleFormValues,
	useRoleForm,
} from '@/features/iam/components/role-form.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/roles/$roleId/')({
	component: RoleDetailPage,
})

function RoleDetailPage() {
	const { roleId } = Route.useParams()
	const detailQuery = useQuery(roleResource.detail.queryOptions({ id: Number(roleId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => <RoleDetail role={response.data} />}
		</DetailBoundary>
	)
}

/**
 * Read-first: the role's whole content *is* its permission set, so the read
 * view is the same field layout rendered disabled — a separate summary would
 * just mirror it. Edit lives at `/$roleId/edit`.
 */
function RoleDetail({ role }: { role: RoleDto }) {
	const navigate = useNavigate()
	const canEdit = usePermissionCheck({ permission: 'iam.update' }) && !role.isSystem
	const canDelete = usePermissionCheck({ permission: 'iam.delete' }) && !role.isSystem
	const removeMut = useMutation(roleResource.remove.mutationOptions())

	const form = useRoleForm({
		defaultValues: toRoleFormValues(role),
		onSubmit: async () => undefined,
	})

	const backToList = () => navigate({ to: '/settings/access-control', search: { tab: 'roles' } })

	const handleDelete = async () => {
		await confirm({
			title: 'Delete role?',
			description: `This will permanently delete "${role.name}". A role cannot be deleted while it is assigned to users.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
			onConfirm: async () => {
				await removeMut.mutateAsync({ id: role.id })
				toast.add({ title: 'Role deleted.', type: 'success' })
				backToList()
			},
		})
	}

	return (
		<DetailPage
			title={role.name}
			description={
				role.isSystem
					? 'Managed by the system and cannot be modified.'
					: role.description || undefined
			}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={backToList}>
					<ArrowLeftIcon className="size-3.5" />
					Roles
				</Button>
			}
			status={
				<StatusBadge variant={role.isSystem ? 'info' : 'default'}>
					{role.isSystem ? 'System' : 'Custom'}
				</StatusBadge>
			}
			actions={
				<>
					{canEdit && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: '/settings/roles/$roleId/edit',
									params: { roleId: String(role.id) },
								})
							}
						>
							<PencilIcon className="size-4" />
							Edit
						</Button>
					)}
					{canDelete && (
						<ActionMenu
							label="More actions"
							items={[
								{
									label: 'Delete role',
									icon: <TrashIcon />,
									onClick: () => void handleDelete(),
									variant: 'destructive',
								},
							]}
						/>
					)}
				</>
			}
		>
			<form.AppForm>
				<RoleFormFields form={form} readOnly />
			</form.AppForm>
		</DetailPage>
	)
}
