import { z } from 'zod'

import { FormDialogFooter, FormRoot, useEntityEditor } from '@/lib/form/index.ts'

import { formDialog } from '@/components/shared/form-dialog.tsx'

import { assignmentResource } from '../api.ts'
import { AssignmentCreateDto } from '../dto/index.ts'
import { RoleLookupField } from './role-lookup-field.tsx'
import { UserLookupField } from './user-lookup-field.tsx'

const AssignUserSchema = z.object({
	userId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((id) => id !== null, { message: 'Pilih pengguna yang akan ditugaskan.' }),
	roleId: z
		.number()
		.int()
		.positive()
		.nullable()
		.refine((id) => id !== null, { message: 'Pilih peran untuk pengguna ini.' }),
})

interface AssignUserFormBodyProps {
	locationId: number
	close: (result?: boolean) => void
}

type AssignUserValues = { userId: number | null; roleId: number | null }

function AssignUserFormBody({ locationId, close }: AssignUserFormBodyProps) {
	const form = useEntityEditor({
		defaultValues: { userId: null, roleId: null } as AssignUserValues,
		schema: AssignUserSchema,
		mutation: assignmentResource.assign.mutationOptions(),
		toPayload: (values) =>
			AssignmentCreateDto.parse({ userId: values.userId, roleId: values.roleId, locationId }),
		successMessage: 'Pengguna ditugaskan ke lokasi ini.',
		onSaved: () => close(true),
	})

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4">
				<form.AppField name="userId">{() => <UserLookupField label="Pengguna" />}</form.AppField>
				<form.AppField name="roleId">{() => <RoleLookupField label="Peran" />}</form.AppField>
				<form.FormError />
				<FormDialogFooter onCancel={() => close(false)} submitLabel="Tugaskan" />
			</FormRoot>
		</form.AppForm>
	)
}

/** Scoped to one location: adds an existing user with a role without leaving the location page. */
export async function assignUserToLocation(location: {
	id: number
	name: string
}): Promise<boolean> {
	return formDialog({
		title: 'Tambah Pengguna',
		description: `Tugaskan pengguna dengan peran tertentu ke ${location.name}.`,
		// oxlint-disable-next-line react/no-unstable-nested-components
		content: ({ close }) => <AssignUserFormBody locationId={location.id} close={close} />,
	})
}
