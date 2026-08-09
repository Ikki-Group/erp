import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'

import { UserCreateDto } from '../dto/index.ts'

import type { FormSelectOption } from '@/components/form/form-select'
import type { UserDetailDto } from '../dto/index.ts'

export interface UserFormValues {
	username: string
	email: string
	name: string
	password: string
	isActive: boolean
	roleId: string
	locationId: string
}

export interface UserFormRef {
	getValues: () => UserFormValues
	validate: () => Record<string, string> | null
}

interface UserFormProps {
	mode: 'create' | 'edit'
	defaultValues?: UserDetailDto
	roleOptions: FormSelectOption[]
	locationOptions: FormSelectOption[]
}

export const UserForm = forwardRef<UserFormRef, UserFormProps>(
	({ mode, defaultValues, roleOptions, locationOptions }, ref) => {
		const firstAssignment = defaultValues?.assignments?.[0]

		const [values, setValues] = useState<UserFormValues>({
			username: defaultValues?.username ?? '',
			email: defaultValues?.email ?? '',
			name: defaultValues?.name ?? '',
			password: '',
			isActive: defaultValues?.isActive ?? true,
			roleId: firstAssignment?.roleId?.toString() ?? '',
			locationId: firstAssignment?.locationId?.toString() ?? '',
		})
		const [errors, setErrors] = useState<Record<string, string>>({})

		const update = (field: keyof UserFormValues, value: string | boolean) => {
			setValues((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => {
				const next = { ...prev }
				delete next[field]
				return next
			})
		}

		useImperativeHandle(ref, () => ({
			getValues: () => values,
			validate: () => {
				const payload = {
					username: values.username,
					email: values.email,
					name: values.name,
					isActive: values.isActive,
					...(mode === 'create'
						? { password: values.password }
						: values.password
							? { password: values.password }
							: {}),
				}

				const schema = mode === 'create' ? UserCreateDto : UserCreateDto.partial({ password: true })
				const result = schema.safeParse(payload)

				const fieldErrors: Record<string, string> = {}

				if (!result.success) {
					for (const issue of result.error.issues) {
						const path = issue.path[0]
						if (path && !fieldErrors[String(path)]) {
							fieldErrors[String(path)] = issue.message
						}
					}
				}

				if (!values.roleId) {
					fieldErrors.roleId = 'Role is required'
				}

				if (Object.keys(fieldErrors).length > 0) {
					setErrors(fieldErrors)
					return fieldErrors
				}

				setErrors({})
				return null
			},
		}))

		return (
			<div className="grid gap-4">
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						label="Username"
						value={values.username}
						onChange={(e) => update('username', e.target.value)}
						error={errors.username}
						placeholder="e.g. john_doe"
						disabled={mode === 'edit'}
					/>
					<FormInput
						label="Email"
						value={values.email}
						onChange={(e) => update('email', e.target.value)}
						error={errors.email}
						placeholder="user@example.com"
					/>
				</div>
				<FormInput
					label="Full Name"
					value={values.name}
					onChange={(e) => update('name', e.target.value)}
					error={errors.name}
					placeholder="Full name"
				/>
				<FormInput
					label={mode === 'create' ? 'Password' : 'New Password (leave blank to keep)'}
					value={values.password}
					onChange={(e) => update('password', e.target.value)}
					error={errors.password}
					placeholder={mode === 'create' ? 'Min 8 characters' : 'Leave blank to keep current'}
					type="password"
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormSelect
						label="Role"
						options={roleOptions}
						value={values.roleId}
						onValueChange={(v) => update('roleId', v ?? '')}
						error={errors.roleId}
						placeholder="Select role..."
					/>
					<FormSelect
						label="Location"
						options={[{ label: 'Global (all locations)', value: '' }, ...locationOptions]}
						value={values.locationId}
						onValueChange={(v) => update('locationId', v ?? '')}
						error={errors.locationId}
						placeholder="Select location..."
					/>
				</div>
				<FormSwitch
					label="Active"
					description="Inactive users cannot log in"
					checked={values.isActive}
					onCheckedChange={(v) => update('isActive', v)}
				/>
			</div>
		)
	},
)

UserForm.displayName = 'UserForm'
