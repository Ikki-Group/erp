import { PlusIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
					: z
							.string()
							.max(100)
							.refine((value) => value === '' || value.length >= 8, {
								error: 'Password must be at least 8 characters',
							})
							.default(''),
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
			<Card>
				<CardHeader>
					<CardTitle>Account</CardTitle>
					<CardDescription>Basic identity and contact information.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
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
					<form.AppField name="name">
						{(field) => <field.TextField label="Full Name" placeholder="Full name" />}
					</form.AppField>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>
						{mode === 'create'
							? 'Set a password for this account.'
							: 'Leave the password blank to keep the current one.'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form.AppField name="password">
						{(field) => (
							<field.TextField
								label={mode === 'create' ? 'Password' : 'New password'}
								type="password"
								placeholder={
									mode === 'create' ? 'Minimum 8 characters' : 'Leave blank to keep current'
								}
							/>
						)}
					</form.AppField>
				</CardContent>
			</Card>

			<form.AppField name="assignments">
				{(assignmentsField) => (
					<Card>
						<CardHeader className="flex-row items-start justify-between gap-4">
							<div>
								<CardTitle>Access assignments</CardTitle>
								<CardDescription>
									Assign one or more roles globally or per location.
								</CardDescription>
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
						</CardHeader>
						<CardContent>
							{assignmentsField.state.value.length === 0 ? (
								<p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
									No assignments. This user will not be able to access protected resources.
								</p>
							) : (
								<div className="space-y-2">
									{assignmentsField.state.value.map((_, index) => (
										<div key={index} className="flex items-start gap-2 rounded-md border p-3">
											<div className="grid flex-1 gap-3 sm:grid-cols-2">
												<form.AppField name={`assignments[${index}].roleId`}>
													{(field) => (
														<field.IdSelectField
															label="Role"
															options={roleOptions}
															placeholder="Select a role..."
														/>
													)}
												</form.AppField>
												<form.AppField name={`assignments[${index}].locationId`}>
													{(field) => (
														<field.IdSelectField
															label="Location"
															options={locationOptions}
															nullableLabel="Global (all locations)"
															placeholder="Select a location..."
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
						</CardContent>
					</Card>
				)}
			</form.AppField>

			<Card>
				<CardHeader>
					<CardTitle>Account status</CardTitle>
					<CardDescription>Inactive users cannot sign in.</CardDescription>
				</CardHeader>
				<CardContent>
					<form.AppField name="isActive">
						{(field) => <field.SwitchField label="Active" />}
					</form.AppField>
				</CardContent>
			</Card>

			<form.FormError />
		</div>
	)
}
