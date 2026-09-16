import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import type { UserDetailDto } from '../dto/index.ts'

export interface UserFormValues {
	username: string
	email: string
	name: string
	password: string
	isActive: boolean
	roleId: number | null
	locationId: number | null
}

export interface UserFormOptions {
	label: string
	value: number
}

function buildSchema(mode: 'create' | 'edit') {
	return z.object({
		username: z.string().trim().min(3, 'Username must be at least 3 characters').max(100),
		email: z
			.string()
			.trim()
			.refine((v) => z.email().safeParse(v).success, { error: 'Invalid email address' }),
		name: z.string().trim().min(1, 'Name is required').max(255),
		password:
			mode === 'create'
				? z.string().min(8, 'Password must be at least 8 characters').max(100)
				: z
						.string()
						.max(100)
						.refine((v) => v === '' || v.length >= 8, {
							error: 'Password must be at least 8 characters',
						})
						.default(''),
		isActive: z.boolean(),
		roleId: z
			.number()
			.int()
			.positive()
			.nullable()
			.refine((v) => v !== null, { error: 'Role is required' }),
		locationId: z.number().int().positive().nullable(),
	})
}

export const EMPTY_USER_FORM_VALUES: UserFormValues = {
	username: '',
	email: '',
	name: '',
	password: '',
	isActive: true,
	roleId: null,
	locationId: null,
}

export function toUserFormValues(user: UserDetailDto): UserFormValues {
	const firstAssignment = user.assignments[0]
	return {
		username: user.username,
		email: user.email,
		name: user.name,
		password: '',
		isActive: user.isActive,
		roleId: firstAssignment?.roleId ?? null,
		locationId: firstAssignment?.locationId ?? null,
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

			<form.AppField name="password">
				{(field) => (
					<field.TextField
						label={mode === 'create' ? 'Password' : 'New Password (leave blank to keep)'}
						type="password"
						placeholder={mode === 'create' ? 'Min 8 characters' : 'Leave blank to keep current'}
					/>
				)}
			</form.AppField>

			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="roleId">
					{(field) => (
						<field.IdSelectField label="Role" options={roleOptions} placeholder="Select role..." />
					)}
				</form.AppField>
				<form.AppField name="locationId">
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

			<form.AppField name="isActive">
				{(field) => (
					<field.SwitchField label="Active" description="Inactive users cannot log in." />
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}
