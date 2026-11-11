import { z } from 'zod'

import { FormError } from '@/lib/form/form-error.tsx'
import { FormRoot } from '@/lib/form/form-root.tsx'
import { useEntityEditor } from '@/lib/form/use-entity-editor.ts'
import { useUnsavedChangesGuard } from '@/lib/form/use-unsaved-changes-guard.ts'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { profileUpdate } from '../api.ts'
import { ProfileUpdateDto } from '../dto/index.ts'

export interface ProfileFormValues {
	name: string
	email: string
}

const ProfileFormSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(255),
	email: z.string().trim().email('Invalid email').max(255),
})

export function useProfileForm(profile: ProfileFormValues) {
	return useEntityEditor({
		defaultValues: { name: profile.name, email: profile.email },
		schema: ProfileFormSchema,
		mutation: profileUpdate.mutationOptions(),
		toPayload: (values) => ProfileUpdateDto.parse(values),
		baselineAfterSave: (payload) => ({ name: payload.name, email: payload.email }),
		successMessage: 'Profile updated.',
	})
}

export function ProfileForm({
	profile,
	username,
}: {
	profile: ProfileFormValues
	username: string
}) {
	const form = useProfileForm(profile)
	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormRoot form={form} className="grid gap-4">
				<div className="space-y-1.5">
					<p className="text-xs font-medium">Username</p>
					<p className="font-mono text-sm">{username}</p>
					<p className="text-xs text-muted-foreground">
						Ask an administrator to change your username.
					</p>
				</div>
				<form.AppField name="name">
					{(field) => <field.TextField label="Name" autoComplete="name" />}
				</form.AppField>
				<form.AppField name="email">
					{(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
				</form.AppField>
				<FormError />
				<div className="flex justify-end">
					<form.Subscribe
						selector={(state) => [state.isSubmitting, state.canSubmit, state.isDirty] as const}
					>
						{([isSubmitting, canSubmit, isDirty]) => (
							<Button type="submit" disabled={isSubmitting || !canSubmit || !isDirty}>
								{isSubmitting && <Spinner className="mr-1.5 size-3.5" />}
								Save profile
							</Button>
						)}
					</form.Subscribe>
				</div>
			</FormRoot>
		</form.AppForm>
	)
}
