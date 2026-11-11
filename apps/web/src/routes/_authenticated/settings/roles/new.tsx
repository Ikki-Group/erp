import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { RoleFormFields, useRoleForm } from '@/features/iam/components/role-form.tsx'

export const Route = createFileRoute('/_authenticated/settings/roles/new')({
	component: NewRolePage,
})

function NewRolePage() {
	const navigate = useNavigate()
	const onDone = () => navigate({ to: '/settings/access-control', search: { tab: 'roles' } })
	const form = useRoleForm({ onSaved: onDone })

	return (
		<EntityEditorPage
			title="Add Role"
			description="Create a new role with specific permissions."
			form={form}
			submitLabel="Create"
			onCancel={onDone}
		>
			<RoleFormFields form={form} />
		</EntityEditorPage>
	)
}
