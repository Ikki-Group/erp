import { useState } from 'react'

import { useEntityEditor } from '@/lib/form/use-entity-editor'

import { assignmentResource, userResource } from './api'
import type { UserDetailDto } from './dto'
import { createUserEditorSession } from './user-editor-save'
import type { UserEditorAdapter } from './user-editor-save'
import { emptyUserFormValues, toUserFormValues, userFormSchema } from './user-form-values'
import type { UserFormValues } from './user-form-values'

const userEditorAdapter: UserEditorAdapter = {
	create: async (input) => (await userResource.create.fetch(input)).data,
	detail: async (id) => (await userResource.detail.fetch({ id })).data,
	update: (input) => userResource.update.fetch(input),
	assign: (input) => assignmentResource.assign.fetch(input),
	remove: (input) => assignmentResource.remove.fetch(input),
}

export function useUserEditor({
	user,
	onSaved,
}: {
	user?: UserDetailDto
	onSaved: () => void | Promise<void>
}) {
	const [savedUserId, setSavedUserId] = useState(user?.id)
	const [defaultValues] = useState(() => (user ? toUserFormValues(user) : emptyUserFormValues()))
	const [session] = useState(() =>
		createUserEditorSession(userEditorAdapter, user?.id, setSavedUserId),
	)
	const mode = savedUserId === undefined ? 'create' : 'edit'
	const form = useEntityEditor({
		defaultValues,
		schema: userFormSchema(mode),
		mutation: { mutationFn: session.save, retry: false },
		toPayload: (values: UserFormValues) => values,
		successMessage: user ? 'User updated successfully.' : 'User created successfully.',
		onSaved,
	})

	return { form, mode } as const
}
