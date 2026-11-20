import { useMemo, useState } from 'react'

import { ChevronRightIcon, SearchIcon, XIcon } from 'lucide-react'
import { z } from 'zod'

import { formatFieldError } from '@/lib/form/field-error'
import { useEntityEditor } from '@/lib/form/use-entity-editor'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { roleResource } from '../api.ts'
import { PERMISSION_GROUPS, RoleCreateDto } from '../dto/index.ts'
import type { RoleDto } from '../dto/index.ts'

export interface RoleFormValues {
	code: string
	name: string
	description: string
	permissions: string[]
}

const RoleFormSchema = z.object({
	code: z.string().trim().min(2, 'Kode minimal 2 karakter').max(50),
	name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(255),
	description: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter'),
	permissions: RoleCreateDto.shape.permissions,
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

export function toRoleInput(values: RoleFormValues): RoleCreateDto {
	return RoleCreateDto.parse(values)
}

export async function saveRole(input: RoleCreateDto, role?: RoleDto) {
	if (role?.isSystem) {
		throw new Error('Peran sistem tidak dapat diubah.')
	}
	return role
		? roleResource.update.fetch({ ...input, id: role.id })
		: roleResource.create.fetch(input)
}

export function useRoleForm({
	role,
	onSaved,
}: {
	role?: RoleDto
	onSaved: () => void | Promise<void>
}) {
	return useEntityEditor({
		defaultValues: role ? toRoleFormValues(role) : EMPTY_ROLE_FORM_VALUES,
		schema: RoleFormSchema,
		mutation: {
			mutationFn: (input: RoleCreateDto) => saveRole(input, role),
		},
		toPayload: toRoleInput,
		successMessage: role ? 'Peran berhasil diperbarui.' : 'Peran berhasil dibuat.',
		onSaved,
	})
}

export type RoleForm = ReturnType<typeof useRoleForm>

function permissionLabel(permission: string): string {
	const action = permission.split('.').slice(1).join('.')
	return action.replaceAll('-', ' ').replace(/\b\w/gu, (letter) => letter.toUpperCase())
}

type PermissionsPickerProps = { value: string[] } & (
	| { readOnly: true; onChange?: never }
	| { readOnly?: false; onChange: (next: string[]) => void }
)

function PermissionsPicker({ value, onChange, readOnly }: PermissionsPickerProps) {
	const [query, setQuery] = useState('')
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
	const normalizedQuery = query.trim().toLowerCase()
	const searching = normalizedQuery.length > 0
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

	const toggleGroupOpen = (module: string) => {
		setExpandedGroups((previous) => {
			const next = new Set(previous)
			if (next.has(module)) next.delete(module)
			else next.add(module)
			return next
		})
	}

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<Label>Izin</Label>
					<p className="text-xs text-muted-foreground">
						Pilih tindakan yang dapat dilakukan peran ini.
					</p>
				</div>
				<Badge variant={selectedCount > 0 ? 'secondary' : 'outline'}>
					{selectedCount}/{totalPermissions} dipilih
				</Badge>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-56 flex-1">
					<SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Cari izin..."
						className="h-7 pl-8 pr-8 text-xs"
						aria-label="Cari izin"
					/>
					{query && (
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="absolute right-1 top-1/2 -translate-y-1/2"
							onClick={() => setQuery('')}
							aria-label="Bersihkan pencarian izin"
						>
							<XIcon />
						</Button>
					)}
				</div>
				{!readOnly && (
					<>
						<Button type="button" variant="outline" size="sm" onClick={selectAll}>
							Pilih semua
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onChange([])}
							disabled={selectedCount === 0}
						>
							Bersihkan
						</Button>
					</>
				)}
			</div>

			<div className="max-h-96 space-y-2 overflow-y-auto rounded-md border p-2">
				{visibleGroups.length === 0 ? (
					<p className="p-4 text-center text-sm text-muted-foreground">
						Tidak ada izin yang cocok dengan pencarian Anda.
					</p>
				) : (
					visibleGroups.map((group) => {
						const selectedInGroup = group.permissions.filter((permission) =>
							value.includes(permission),
						).length
						const allChecked = selectedInGroup === group.permissions.length
						const someChecked = selectedInGroup > 0 && !allChecked
						const open = searching || expandedGroups.has(group.module)

						return (
							<div key={group.module} className="rounded-md border bg-muted/30 p-3">
								<div className="flex items-center gap-2">
									<Checkbox
										className="min-h-6 min-w-6"
										aria-label={`Pilih semua izin ${group.label}`}
										checked={allChecked}
										indeterminate={someChecked}
										disabled={readOnly}
										onCheckedChange={() => toggleGroup(group.permissions)}
									/>
									<button
										type="button"
										aria-expanded={open}
										onClick={() => toggleGroupOpen(group.module)}
										className="flex min-h-6 flex-1 items-center gap-1.5 rounded text-left"
									>
										<ChevronRightIcon
											className={cn(
												'size-3.5 shrink-0 text-muted-foreground transition-transform',
												open && 'rotate-90',
											)}
										/>
										<span className="text-sm font-medium">{group.label}</span>
									</button>
									<span className="text-xs tabular-nums text-muted-foreground">
										{selectedInGroup}/{group.permissions.length}
									</span>
								</div>
								{open && (
									<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
										{group.permissions.map((permission) => (
											<label
												key={permission}
												className="flex min-h-6 items-center gap-2 rounded px-1.5 text-xs hover:bg-muted/50"
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
								)}
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}

export function RoleFormFields({ form }: { form: RoleForm }) {
	return (
		<div className="grid gap-5">
			<div className="grid gap-4 sm:grid-cols-2">
				<form.AppField name="code">
					{(field) => <field.TextField label="Kode" placeholder="mis. manager" />}
				</form.AppField>
				<form.AppField name="name">
					{(field) => <field.TextField label="Nama" placeholder="mis. Manajer Toko" />}
				</form.AppField>
			</div>

			<form.AppField name="description">
				{(field) => (
					<field.TextareaField
						label="Deskripsi"
						placeholder="Jelaskan tanggung jawab peran ini..."
						maxLength={500}
						rows={3}
					/>
				)}
			</form.AppField>

			<form.AppField name="permissions">
				{(field) => {
					const error = field.state.meta.isTouched
						? formatFieldError(field.state.meta.errors)
						: undefined
					return (
						<div className="space-y-1.5">
							<PermissionsPicker
								value={field.state.value}
								onChange={(value) => field.handleChange(value)}
							/>
							{error && (
								<p role="alert" className="text-xs text-destructive">
									{error}
								</p>
							)}
						</div>
					)
				}}
			</form.AppField>
		</div>
	)
}

/** Presentation only: viewing a system role never creates an editing session or mutation. */
export function RoleDetails({ role }: { role: RoleDto }) {
	return (
		<div className="grid gap-5">
			<dl className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-1">
					<dt className="text-xs text-muted-foreground">Kode</dt>
					<dd className="break-words font-mono text-sm">{role.code}</dd>
				</div>
				<div className="space-y-1">
					<dt className="text-xs text-muted-foreground">Nama</dt>
					<dd className="break-words text-sm">{role.name}</dd>
				</div>
				<div className="space-y-1 sm:col-span-2">
					<dt className="text-xs text-muted-foreground">Deskripsi</dt>
					<dd className="whitespace-pre-wrap break-words text-sm">{role.description || '—'}</dd>
				</div>
			</dl>
			<PermissionsPicker value={role.permissions} readOnly />
		</div>
	)
}
