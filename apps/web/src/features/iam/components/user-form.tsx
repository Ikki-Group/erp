import { PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import type { UserDetailDto } from '../dto/index.ts'

export interface UserAssignmentFormValue {
	roleId: number
	locationId: number | null
}

export interface UserFormValues {
	username: string
	email: string
	name: string
	password: string
	isActive: boolean
	assignments: UserAssignmentFormValue[]
}

export interface UserFormOptions {
	label: string
	value: number
}

const assignmentSchema = z.object({
	roleId: z.number().int().positive(),
	locationId: z.number().int().positive().nullable(),
})

function buildSchema(mode: 'create' | 'edit') {
	return z
		.object({
			username: z.string().trim().min(3, 'Username must be at least 3 characters').max(100),
			email: z
				.string()
				.trim()
				.refine((value) => z.email().safeParse(value).success, { error: 'Invalid email address' }),
			name: z.string().trim().min(1, 'Name is required').max(255),
			password:
				mode === 'create'
					? z.string().min(8, 'Password must be at least 8 characters').max(100)
					: z.string().max(100).default(''),
			isActive: z.boolean(),
			assignments: z.array(assignmentSchema),
		})
		.superRefine((values, context) => {
			const seen = new Set<string>()
			values.assignments.forEach((assignment, index) => {
				const key = `${assignment.roleId}:${assignment.locationId ?? 'global'}`
				if (seen.has(key)) {
					context.addIssue({
						code: 'custom',
						path: ['assignments', index],
						message: 'This role and location assignment is duplicated.',
					})
				}
				seen.add(key)
			})
		})
}

export const EMPTY_USER_FORM_VALUES: UserFormValues = {
	username: '',
	email: '',
	name: '',
	password: '',
	isActive: true,
	assignments: [],
}

export function toUserFormValues(user: UserDetailDto): UserFormValues {
	return {
		username: user.username,
		email: user.email,
		name: user.name,
		password: '',
		isActive: user.isActive,
		assignments: user.assignments.map(({ roleId, locationId }) => ({ roleId, locationId })),
	}
}

export interface UseUserFormOptions {
	mode: 'create' | 'edit'
	defaultValues?: UserFormValues
	onSubmit: (values: UserFormValues) => Promise<void>
}

export function useUserForm({ mode, defaultValues, onSubmit }: UseUserFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_USER_FORM_VALUES,
		schema: buildSchema(mode),
		onSubmit,
	})
}

export type UserForm = ReturnType<typeof useUserForm>

export interface UserFormFieldsProps {
	form: UserForm
	mode: 'create' | 'edit'
	roleOptions: UserFormOptions[]
	locationOptions: UserFormOptions[]
}

export function UserFormFields({ form, mode, roleOptions, locationOptions }: UserFormFieldsProps) {
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="username">
					{(field) => (
						<field.TextField
							label="Username"
							placeholder="e.g. john_doe"
							disabled={mode === 'edit'}
						/>
					)}
				</form.AppField>
				<form.AppField name="email">
					{(field) => <field.TextField label="Email" placeholder="user@example.com" />}
				</form.AppField>
			</div>

			<form.AppField name="name">
				{(field) => <field.TextField label="Full Name" placeholder="Full name" />}
			</form.AppField>

			{mode === 'create' && (
				<form.AppField name="password">
					{(field) => (
						<field.TextField label="Password" type="password" placeholder="Minimum 8 characters" />
					)}
				</form.AppField>
			)}

			<form.AppField name="assignments">
				{(assignmentsField) => (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div>
								<Label>Access assignments</Label>
								<p className="text-xs text-muted-foreground">
									Assign one or more roles globally or per location.
								</p>
							</div>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => assignmentsField.pushValue({ roleId: 0, locationId: null })}
							>
								<PlusIcon className="size-4" />
								Add assignment
							</Button>
						</div>

						{assignmentsField.state.value.length === 0 ? (
							<p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
								No assignments. This user will not be able to access protected resources.
							</p>
						) : (
							<div className="space-y-2">
								{assignmentsField.state.value.map((_, index) => (
									<div key={index} className="flex items-start gap-2 rounded-md border p-3">
										<div className="grid flex-1 grid-cols-2 gap-3">
											<form.AppField name={`assignments[${index}].roleId`}>
												{(field) => (
													<field.IdSelectField
														label="Role"
														options={roleOptions}
														placeholder="Select role..."
													/>
												)}
											</form.AppField>
											<form.AppField name={`assignments[${index}].locationId`}>
												{(field) => (
													<field.IdSelectField
														label="Location"
														options={locationOptions}
														nullableLabel="Global (all locations)"
														placeholder="Select location..."
													/>
												)}
											</form.AppField>
										</div>
										<Button
											type="button"
											size="icon"
											variant="ghost"
											className="mt-6 shrink-0"
											onClick={() => assignmentsField.removeValue(index)}
											aria-label={`Remove assignment ${index + 1}`}
										>
											<TrashIcon className="size-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</form.AppField>

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField label="Active" description="Inactive users cannot log in." />
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}
