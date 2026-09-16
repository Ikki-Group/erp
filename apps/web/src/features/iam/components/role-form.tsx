import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import { PERMISSION_GROUPS } from '../dto/index.ts'
import type { RoleDto } from '../dto/index.ts'

export interface RoleFormValues {
	code: string
	name: string
	permissions: string[]
}

const RoleFormSchema = z.object({
	code: z.string().trim().min(2, 'Code must be at least 2 characters').max(50),
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
	permissions: z.array(z.string()),
})

export const EMPTY_ROLE_FORM_VALUES: RoleFormValues = {
	code: '',
	name: '',
	permissions: [],
}

export function toRoleFormValues(role: RoleDto): RoleFormValues {
	return {
		code: role.code,
		name: role.name,
		permissions: role.permissions,
	}
}

export interface UseRoleFormOptions {
	defaultValues?: RoleFormValues
	onSubmit: (values: RoleFormValues) => Promise<void>
}

export function useRoleForm({ defaultValues, onSubmit }: UseRoleFormOptions) {
	return useEntityForm({
		defaultValues: defaultValues ?? EMPTY_ROLE_FORM_VALUES,
		schema: RoleFormSchema,
		onSubmit,
	})
}

export type RoleForm = ReturnType<typeof useRoleForm>

/** Permission checkbox tree — grouped by module, with a group-level "select all". */
function PermissionsPicker({
	value,
	onChange,
}: {
	value: string[]
	onChange: (next: string[]) => void
}) {
	const togglePermission = (permission: string) => {
		const has = value.includes(permission)
		onChange(has ? value.filter((p) => p !== permission) : [...value, permission])
	}

	const toggleGroup = (permissions: readonly string[]) => {
		const allChecked = permissions.every((p) => value.includes(p))
		if (allChecked) {
			onChange(value.filter((p) => !permissions.includes(p)))
			return
		}
		onChange([...new Set([...value, ...permissions])])
	}

	return (
		<div className="space-y-1.5">
			<Label>Permissions</Label>
			<div className="max-h-64 overflow-y-auto rounded-md border p-3">
				<div className="grid gap-4">
					{PERMISSION_GROUPS.map((group) => {
						const allChecked = group.permissions.every((p) => value.includes(p))
						const someChecked = !allChecked && group.permissions.some((p) => value.includes(p))

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
												checked={value.includes(perm)}
												onCheckedChange={() => togglePermission(perm)}
												className="size-3.5"
											/>
											<span className="text-muted-foreground">
												{perm.split('.').slice(1).join('.')}
											</span>
										</label>
									))}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

export function RoleFormFields({ form }: { form: RoleForm }) {
	return (
		<div className="grid gap-5">
			<div className="grid grid-cols-2 gap-4">
				<form.AppField name="code">
					{(field) => <field.TextField label="Code" placeholder="e.g. manager" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => <field.TextField label="Name" placeholder="e.g. Store Manager" />}
				</form.AppField>
			</div>

			<form.AppField name="permissions">
				{(field) => (
					<PermissionsPicker value={field.state.value} onChange={(v) => field.handleChange(v)} />
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}
