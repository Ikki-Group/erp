import { useMemo, useState } from 'react'

import { SearchIcon, XIcon } from 'lucide-react'
import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PERMISSION_GROUPS } from '../dto/index.ts'
import type { RoleDto } from '../dto/index.ts'

export interface RoleFormValues {
	code: string
	name: string
	description: string
	permissions: string[]
}

const RoleFormSchema = z.object({
	code: z.string().trim().min(2, 'Code must be at least 2 characters').max(50),
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
	description: z.string().trim().max(500, 'Description must be 500 characters or fewer'),
	permissions: z.array(z.string()),
})

export const EMPTY_ROLE_FORM_VALUES: RoleFormValues = {
	code: '',
	name: '',
	description: '',
	permissions: [],
}

export function toRoleFormValues(role: RoleDto): RoleFormValues {
	return {
		code: role.code,
		name: role.name,
		description: role.description,
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

function permissionLabel(permission: string): string {
	const action = permission.split('.').slice(1).join('.')
	return action.replaceAll('-', ' ').replace(/\b\w/gu, (letter) => letter.toUpperCase())
}

function PermissionsPicker({
	value,
	onChange,
	readOnly = false,
}: {
	value: string[]
	onChange: (next: string[]) => void
	readOnly?: boolean
}) {
	const [query, setQuery] = useState('')
	const normalizedQuery = query.trim().toLowerCase()
	const totalPermissions = PERMISSION_GROUPS.reduce(
		(total, group) => total + group.permissions.length,
		0,
	)
	const selectedCount = value.length

	const visibleGroups = useMemo(
		() =>
			PERMISSION_GROUPS.map((group) => ({
				...group,
				permissions: group.permissions.filter(
					(permission) =>
						!normalizedQuery ||
						permission.toLowerCase().includes(normalizedQuery) ||
						group.label.toLowerCase().includes(normalizedQuery),
				),
			})).filter((group) => group.permissions.length > 0),
		[normalizedQuery],
	)

	const togglePermission = (permission: string) => {
		if (readOnly) return
		const has = value.includes(permission)
		onChange(has ? value.filter((item) => item !== permission) : [...value, permission])
	}

	const toggleGroup = (permissions: readonly string[]) => {
		if (readOnly) return
		const allChecked = permissions.every((permission) => value.includes(permission))
		if (allChecked) {
			onChange(value.filter((permission) => !permissions.includes(permission)))
			return
		}
		onChange([...new Set([...value, ...permissions])])
	}

	const selectAll = () => {
		if (!readOnly) onChange(PERMISSION_GROUPS.flatMap((group) => group.permissions))
	}

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<Label>Permissions</Label>
					<p className="text-xs text-muted-foreground">Choose the actions this role can perform.</p>
				</div>
				<Badge variant={selectedCount > 0 ? 'secondary' : 'outline'}>
					{selectedCount}/{totalPermissions} selected
				</Badge>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-56 flex-1">
					<SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search permissions..."
						className="h-8 pl-7 pr-7 text-xs"
						aria-label="Search permissions"
					/>
					{query && (
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							className="absolute right-1 top-1/2 -translate-y-1/2"
							onClick={() => setQuery('')}
							aria-label="Clear permission search"
						>
							<XIcon className="size-3" />
						</Button>
					)}
				</div>
				{!readOnly && (
					<>
						<Button type="button" variant="outline" size="xs" onClick={selectAll}>
							Select all
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="xs"
							onClick={() => onChange([])}
							disabled={selectedCount === 0}
						>
							Clear
						</Button>
					</>
				)}
			</div>

			<div className="max-h-96 space-y-2 overflow-y-auto rounded-md border p-2">
				{visibleGroups.length === 0 ? (
					<p className="p-4 text-center text-sm text-muted-foreground">
						No permissions match your search.
					</p>
				) : (
					visibleGroups.map((group) => {
						const selectedInGroup = group.permissions.filter((permission) =>
							value.includes(permission),
						).length
						const allChecked = selectedInGroup === group.permissions.length
						const someChecked = selectedInGroup > 0 && !allChecked

						return (
							<div key={group.module} className="rounded-md border bg-muted/10 p-3">
								<div className="flex items-center justify-between gap-2">
									<label className="flex items-center gap-2">
										<Checkbox
											checked={allChecked}
											indeterminate={someChecked}
											disabled={readOnly}
											onCheckedChange={() => toggleGroup(group.permissions)}
										/>
										<span className="text-sm font-medium">{group.label}</span>
									</label>
									<span className="text-xs text-muted-foreground">
										{selectedInGroup}/{group.permissions.length}
									</span>
								</div>
								<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
									{group.permissions.map((permission) => (
										<label
											key={permission}
											className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60"
										>
											<Checkbox
												checked={value.includes(permission)}
												disabled={readOnly}
												onCheckedChange={() => togglePermission(permission)}
												className="size-3.5"
											/>
											<span className="truncate" title={permission}>
												{permissionLabel(permission)}
											</span>
										</label>
									))}
								</div>
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}

export function RoleFormFields({ form, readOnly = false }: { form: RoleForm; readOnly?: boolean }) {
	return (
		<div className="grid gap-5">
			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => (
						<field.TextField label="Code" placeholder="e.g. manager" disabled={readOnly} />
					)}
				</form.AppField>
				<form.AppField name="name">
					{(field) => (
						<field.TextField label="Name" placeholder="e.g. Store Manager" disabled={readOnly} />
					)}
				</form.AppField>
			</div>

			<form.AppField name="description">
				{(field) => (
					<field.TextareaField
						label="Description"
						placeholder="Explain what this role is responsible for..."
						maxLength={500}
						rows={3}
						disabled={readOnly}
					/>
				)}
			</form.AppField>

			<form.AppField name="permissions">
				{(field) => (
					<PermissionsPicker
						value={field.state.value}
						onChange={(value) => field.handleChange(value)}
						readOnly={readOnly}
					/>
				)}
			</form.AppField>

			<form.FormError />
		</div>
	)
}
