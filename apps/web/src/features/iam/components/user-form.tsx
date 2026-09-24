import { Globe2Icon, MapPinIcon, PlusIcon, ShieldCheckIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { useEntityForm } from '@/lib/form/index.ts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'

import type { UserDetailDto } from '../dto/index.ts'

export interface UserAssignmentFormValue {
	roleId: number
	locationId: number | null
}

export type AssignmentMode = 'global' | 'per_location'

export interface UserFormValues {
	username: string
	email: string
	name: string
	password: string
	isActive: boolean
	assignmentMode: AssignmentMode
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
			assignmentMode: z.enum(['global', 'per_location']),
			assignments: z.array(assignmentSchema),
		})
		.superRefine((values, context) => {
			const seenLocations = new Set<number>()
			const seenRoles = new Set<number>()

			values.assignments.forEach((assignment, index) => {
				if (values.assignmentMode === 'global' && assignment.locationId !== null) {
					context.addIssue({
						code: 'custom',
						path: ['assignments', index, 'locationId'],
						message: 'Global access cannot include a location.',
					})
				}

				if (values.assignmentMode === 'per_location' && assignment.locationId === null) {
					context.addIssue({
						code: 'custom',
						path: ['assignments', index, 'locationId'],
						message: 'Select a location for this assignment.',
					})
				}

				if (values.assignmentMode === 'global') {
					if (seenRoles.has(assignment.roleId)) {
						context.addIssue({
							code: 'custom',
							path: ['assignments', index, 'roleId'],
							message: 'This role is already assigned globally.',
						})
					}
					seenRoles.add(assignment.roleId)
				} else if (assignment.locationId !== null) {
					if (seenLocations.has(assignment.locationId)) {
						context.addIssue({
							code: 'custom',
							path: ['assignments', index, 'locationId'],
							message: 'Each location can only be assigned once.',
						})
					}
					seenLocations.add(assignment.locationId)
				}
			})
		})
}

export const EMPTY_USER_FORM_VALUES: UserFormValues = {
	username: '',
	email: '',
	name: '',
	password: '',
	isActive: true,
	assignmentMode: 'global',
	assignments: [],
}

export function toUserFormValues(user: UserDetailDto): UserFormValues {
	return {
		username: user.username,
		email: user.email,
		name: user.name,
		password: '',
		isActive: user.isActive,
		assignmentMode: user.assignments.some((assignment) => assignment.locationId !== null)
			? 'per_location'
			: 'global',
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

const scopeOptions = [
	{
		value: 'global' as const,
		label: 'All locations',
		description: 'Use this for central or company-wide responsibilities.',
		Icon: Globe2Icon,
	},
	{
		value: 'per_location' as const,
		label: 'Selected locations',
		description: 'Choose one location for each assignment.',
		Icon: MapPinIcon,
	},
]

export function UserFormFields({ form, mode, roleOptions, locationOptions }: UserFormFieldsProps) {
	return (
		<div className="grid gap-6">
			<div className="grid gap-4 md:grid-cols-2">
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
				{(field) => <field.TextField label="Full name" placeholder="Full name" />}
			</form.AppField>

			{mode === 'create' && (
				<form.AppField name="password">
					{(field) => (
						<field.TextField label="Password" type="password" placeholder="Minimum 8 characters" />
					)}
				</form.AppField>
			)}

			<form.AppField name="assignmentMode">
				{(modeField) => (
					<form.AppField name="assignments">
						{(assignmentsField) => {
							const selectedMode = modeField.state.value as AssignmentMode
							const assignments = assignmentsField.state.value
							const isGlobal = selectedMode === 'global'
							const changeMode = (nextMode: AssignmentMode) => {
								if (nextMode === selectedMode) return
								modeField.handleChange(nextMode)
								form.setFieldValue('assignments', [])
							}

							const addAssignment = () =>
								assignmentsField.pushValue({ roleId: 0, locationId: null })

							return (
								<section className="overflow-hidden rounded-xl border bg-card shadow-sm">
									<div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
										<div className="flex gap-3">
											<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
												<ShieldCheckIcon className="size-4" />
											</div>
											<div>
												<h2 className="text-sm font-semibold">Access and roles</h2>
												<p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
													Choose how this user receives access, then add the roles they need.
												</p>
											</div>
										</div>
										<Badge variant={assignments.length > 0 ? 'secondary' : 'outline'}>
											{assignments.length === 0
												? 'No access yet'
												: `${assignments.length} ${isGlobal ? 'role' : 'location'}${assignments.length === 1 ? '' : 's'}`}
										</Badge>
									</div>

									<Separator />

									<div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
										<div className="min-w-0">
											<fieldset>
												<legend className="text-sm font-medium">Access scope</legend>
												<p className="mt-1 text-xs text-muted-foreground">
													A user can have either company-wide access or location-specific access.
												</p>
												<RadioGroup
													value={selectedMode}
													onValueChange={(value) => changeMode(value as AssignmentMode)}
													aria-label="Access scope"
													className="mt-3 grid gap-2 sm:grid-cols-2"
												>
													{scopeOptions.map(({ value, label, description, Icon }) => (
														<label
															key={value}
															className="group flex min-h-20 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
														>
															<RadioGroupItem value={value} aria-label={label} className="mt-0.5" />
															<Icon className="mt-0.5 size-4 text-muted-foreground group-has-data-checked:text-primary" />
															<span className="grid gap-1">
																<span className="text-sm font-medium">{label}</span>
																<span className="text-xs leading-relaxed text-muted-foreground">
																	{description}
																</span>
															</span>
														</label>
													))}
												</RadioGroup>
											</fieldset>

											<div className="mt-7 flex items-end justify-between gap-3">
												<div>
													<h3 className="text-sm font-medium">
														{isGlobal ? 'Global roles' : 'Location access'}
													</h3>
													<p className="mt-1 text-xs text-muted-foreground">
														{isGlobal
															? 'Each role applies everywhere.'
															: 'Each location can appear only once.'}
													</p>
												</div>
												<Button type="button" size="sm" variant="outline" onClick={addAssignment}>
													<PlusIcon className="size-3.5" />
													Add {isGlobal ? 'role' : 'location'}
												</Button>
											</div>

											{assignments.length === 0 ? (
												<div className="mt-3 rounded-lg border border-dashed bg-muted/20 px-4 py-7 text-center">
													<p className="text-sm font-medium">No access assigned</p>
													<p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
														Add a {isGlobal ? 'role' : 'location'} to let this user access protected
														resources.
													</p>
												</div>
											) : (
												<div className="mt-3 grid gap-2">
													{assignments.map((_, index) => (
														<div
															key={index}
															className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
														>
															{!isGlobal && (
																<form.AppField name={`assignments[${index}].locationId`}>
																	{(field) => (
																		<field.IdSelectField
																			label="Location"
																			options={locationOptions.filter(
																				(option) =>
																					!assignments.some(
																						(assignment, otherIndex) =>
																							otherIndex !== index &&
																							assignment.locationId === option.value,
																					),
																			)}
																			placeholder="Choose a location"
																		/>
																	)}
																</form.AppField>
															)}

															<form.AppField name={`assignments[${index}].roleId`}>
																{(field) => (
																	<field.IdSelectField
																		label="Role"
																		options={roleOptions.filter(
																			(option) =>
																				!isGlobal ||
																				!assignments.some(
																					(assignment, otherIndex) =>
																						otherIndex !== index &&
																						assignment.roleId === option.value,
																				),
																		)}
																		placeholder="Choose a role"
																	/>
																)}
															</form.AppField>

															<Button
																type="button"
																size="icon-sm"
																variant="ghost"
																className="mt-6 justify-self-end text-muted-foreground hover:text-destructive"
																onClick={() => assignmentsField.removeValue(index)}
																aria-label={`Remove ${isGlobal ? 'role' : 'location'} assignment ${index + 1}`}
															>
																<TrashIcon />
															</Button>
														</div>
													))}
												</div>
											)}
										</div>

										<aside className="h-fit rounded-lg bg-muted/40 p-4 lg:mt-8">
											<p className="text-xs font-medium text-muted-foreground">Access summary</p>
											<div className="mt-3 flex items-center gap-2">
												{isGlobal ? (
													<Globe2Icon className="size-4 text-primary" />
												) : (
													<MapPinIcon className="size-4 text-primary" />
												)}
												<span className="text-sm font-medium">
													{isGlobal ? 'Company-wide' : 'Location-specific'}
												</span>
											</div>
											<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
												{isGlobal
													? 'Every selected role applies across all locations.'
													: 'Each selected location receives the role shown in its row.'}
											</p>
											<Separator className="my-4" />
											<div className="grid gap-2 text-xs">
												<div className="flex items-center justify-between gap-2">
													<span className="text-muted-foreground">Assignments</span>
													<span className="font-medium tabular-nums">{assignments.length}</span>
												</div>
												<div className="flex items-center justify-between gap-2">
													<span className="text-muted-foreground">Scope</span>
													<span className="font-medium">
														{isGlobal ? 'Global' : 'Per location'}
													</span>
												</div>
											</div>
										</aside>
									</div>
								</section>
							)
						}}
					</form.AppField>
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
