import { forwardRef, useImperativeHandle, useState } from 'react'

import { FormInput } from '@/components/form/form-input'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import { PERMISSION_GROUPS, RoleCreateDto } from '../dto/index.ts'
import type { RoleDto } from '../dto/index.ts'

export interface RoleFormValues {
	code: string
	name: string
	permissions: string[]
}

export interface RoleFormRef {
	getValues: () => RoleFormValues
	validate: () => Record<string, string> | null
}

interface RoleFormProps {
	defaultValues?: RoleDto
}

export const RoleForm = forwardRef<RoleFormRef, RoleFormProps>(({ defaultValues }, ref) => {
	const [values, setValues] = useState<RoleFormValues>({
		code: defaultValues?.code ?? '',
		name: defaultValues?.name ?? '',
		permissions: defaultValues?.permissions ?? [],
	})
	const [errors, setErrors] = useState<Record<string, string>>({})

	const updateField = (field: 'code' | 'name', value: string) => {
		setValues((prev) => ({ ...prev, [field]: value }))
		setErrors((prev) => {
			const next = { ...prev }
			delete next[field]
			return next
		})
	}

	const togglePermission = (permission: string) => {
		setValues((prev) => {
			const has = prev.permissions.includes(permission)
			return {
				...prev,
				permissions: has
					? prev.permissions.filter((p) => p !== permission)
					: [...prev.permissions, permission],
			}
		})
	}

	const toggleGroup = (permissions: readonly string[]) => {
		setValues((prev) => {
			const allChecked = permissions.every((p) => prev.permissions.includes(p))
			if (allChecked) {
				return { ...prev, permissions: prev.permissions.filter((p) => !permissions.includes(p)) }
			}
			const merged = new Set([...prev.permissions, ...permissions])
			return { ...prev, permissions: [...merged] }
		})
	}

	useImperativeHandle(ref, () => ({
		getValues: () => values,
		validate: () => {
			const result = RoleCreateDto.safeParse(values)
			if (result.success) {
				setErrors({})
				return null
			}
			const fieldErrors: Record<string, string> = {}
			for (const issue of result.error.issues) {
				const path = issue.path[0]
				if (path && !fieldErrors[String(path)]) {
					fieldErrors[String(path)] = issue.message
				}
			}
			setErrors(fieldErrors)
			return fieldErrors
		},
	}))

	return (
		<div className="grid gap-5">
			<div className="grid grid-cols-2 gap-4">
				<FormInput
					label="Code"
					value={values.code}
					onChange={(e) => updateField('code', e.target.value)}
					error={errors.code}
					placeholder="e.g. manager"
				/>
				<FormInput
					label="Name"
					value={values.name}
					onChange={(e) => updateField('name', e.target.value)}
					error={errors.name}
					placeholder="e.g. Store Manager"
				/>
			</div>

			<div className="space-y-1.5">
				<Label>Permissions</Label>
				<div className="max-h-64 overflow-y-auto rounded-md border p-3">
					<div className="grid gap-4">
						{PERMISSION_GROUPS.map((group) => {
							const allChecked = group.permissions.every((p) => values.permissions.includes(p))
							const someChecked =
								!allChecked && group.permissions.some((p) => values.permissions.includes(p))

							return (
								<div key={group.module} className="space-y-2">
									<div className="flex items-center gap-2">
										<Checkbox
											checked={allChecked}
											indeterminate={someChecked}
											onCheckedChange={() => toggleGroup(group.permissions)}
										/>
										<span className="text-sm font-medium">{group.label}</span>
									</div>
									<div className="ml-6 flex flex-wrap gap-x-4 gap-y-1.5">
										{group.permissions.map((perm) => (
											<label key={perm} className="flex items-center gap-1.5 text-xs">
												<Checkbox
													checked={values.permissions.includes(perm)}
													onCheckedChange={() => togglePermission(perm)}
													className="size-3.5"
												/>
												<span className="text-muted-foreground">{perm.split(':')[1]}</span>
											</label>
										))}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)
})

RoleForm.displayName = 'RoleForm'
