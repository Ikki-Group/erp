import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { UserFormFields } from '@/features/iam/components/user-form'
import { useUserEditor } from '@/features/iam/use-user-editor'

export const Route = createFileRoute('/_authenticated/settings/users/new')({
	component: NewUserPage,
})

function NewUserPage() {
	const navigate = useNavigate()

	const onDone = () => navigate({ to: '/settings/access-control', search: { tab: 'users' } })
	const { form, mode } = useUserEditor({ onSaved: onDone })

	return (
		<EntityEditorPage
			title="Add User"
			description="Create a new user account."
			form={form}
			submitLabel={mode === 'create' ? 'Create' : 'Save remaining changes'}
			onCancel={onDone}
		>
			<UserFormFields form={form} mode={mode} />
		</EntityEditorPage>
	)
}
