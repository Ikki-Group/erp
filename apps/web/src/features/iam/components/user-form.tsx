import { Globe2Icon, MapPinIcon, PlusIcon, ShieldCheckIcon, TrashIcon } from 'lucide-react'

import { withForm } from '@/lib/form/app-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'

import { LocationLookupField } from '@/features/location/components/location-lookup-field'

import { createUserAssignment, emptyUserFormValues } from '../user-form-values'
import type { AssignmentMode } from '../user-form-values'
import { RoleLookupField } from './role-lookup-field'

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

export const UserFormFields = withForm({
	defaultValues: emptyUserFormValues(),
	props: { mode: 'create' as 'create' | 'edit' },
	render: function UserFormFields({ form, mode }) {
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
							<field.TextField
								label="Password"
								type="password"
								placeholder="Minimum 8 characters"
							/>
						)}
					</form.AppField>
				)}

				<form.AppField name="assignmentMode">
					{(modeField) => (
						<form.AppField name="assignments">
							{(assignmentsField) => {
								const selectedMode = modeField.state.value
								const assignments = assignmentsField.state.value
								const isGlobal = selectedMode === 'global'
								const changeMode = (nextMode: AssignmentMode) => {
									if (nextMode === selectedMode) return
									modeField.handleChange(nextMode)
									form.setFieldValue('assignments', [])
								}

								const addAssignment = () => assignmentsField.pushValue(createUserAssignment())

								return (
									<section className="overflow-hidden rounded-xl border bg-card shadow-sm">
										<div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
											<div className="flex gap-3">
												<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
													<ShieldCheckIcon className="size-4" />
												</div>
												<div>
													<h3 className="font-medium tracking-tight">Access and roles</h3>
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

										<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
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
																<RadioGroupItem
																	value={value}
																	aria-label={label}
																	className="mt-0.5"
																/>
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

												<div className="mt-6 flex items-end justify-between gap-3">
													<div>
														<h4 className="font-medium tracking-tight">
															{isGlobal ? 'Global roles' : 'Location access'}
														</h4>
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
													<div className="mt-3 rounded-lg border border-dashed bg-muted/30 px-4 py-7 text-center">
														<p className="text-sm font-medium">No access assigned</p>
														<p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
															Add a {isGlobal ? 'role' : 'location'} to let this user access
															protected resources.
														</p>
													</div>
												) : (
													<div className="mt-3 grid gap-2">
														{assignments.map((assignment, index) => (
															<div
																key={assignment.clientKey}
																className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
															>
																{!isGlobal && (
																	<form.AppField name={`assignments[${index}].locationId`}>
																		{() => (
																			<LocationLookupField
																				label="Location"
																				excludeIds={assignments.flatMap((other) =>
																					other.clientKey !== assignment.clientKey &&
																					other.locationId !== null
																						? [other.locationId]
																						: [],
																				)}
																			/>
																		)}
																	</form.AppField>
																)}

																<form.AppField name={`assignments[${index}].roleId`}>
																	{() => (
																		<RoleLookupField
																			label="Role"
																			excludeIds={
																				isGlobal
																					? assignments.flatMap((other) =>
																							other.clientKey !== assignment.clientKey &&
																							other.roleId !== null
																								? [other.roleId]
																								: [],
																						)
																					: undefined
																			}
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

											<aside className="h-fit rounded-lg bg-muted/40 p-4 lg:mt-6">
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
				<form.Subscribe
					selector={(state) => ({ error: state.errorMap.onSubmit, submitting: state.isSubmitting })}
				>
					{({ error, submitting }) =>
						typeof error === 'string' ? (
							<Button
								type="button"
								variant="outline"
								className="justify-self-start"
								disabled={submitting}
								onClick={() => {
									form.setErrorMap({ onSubmit: undefined })
									void form.handleSubmit()
								}}
							>
								Retry save
							</Button>
						) : null
					}
				</form.Subscribe>
			</div>
		)
	},
})
