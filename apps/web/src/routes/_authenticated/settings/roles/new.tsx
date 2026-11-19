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
			title="Tambah Peran"
			description="Buat peran baru dengan izin tertentu."
			form={form}
			submitLabel="Buat"
			onCancel={onDone}
		>
			<RoleFormFields form={form} />
		</EntityEditorPage>
	)
}
