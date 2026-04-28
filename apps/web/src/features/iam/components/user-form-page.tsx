import { useStore } from '@tanstack/react-form'
import { formOptions } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'

import { PlusIcon, ShieldAlertIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'
import { zBool, zEmail, zPassword, zStr, zUsername } from '@/lib/validation'

import { CardSection } from '@/components/blocks/card/card-section'
import { FormConfig, useAppForm, useFormConfig, useTypedAppFormContext } from '@/components/form'
import { Page } from '@/components/layout/page'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { roleApi } from '@/features/iam/api/role.api'
import { locationApi } from '@/features/location/api/location.api'

import { userApi } from '../api'
import type { UserDetailDto } from '../dto'

const FormDto = z.object({
	fullname: zStr.min(1, 'Nama lengkap wajib diisi'),
	username: zUsername,
	password: zPassword.optional(),
	email: zEmail,
	isRoot: zBool,
	isActive: zBool,
	pinCode: z.string(),
	defaultLocationId: z.number().nullable(),
	assignments: z.array(z.object({ roleId: z.number(), locationId: z.number(), isDefault: zBool })),
})

type FormDto = z.infer<typeof FormDto>
const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: UserDetailDto): FormDto {
	return {
		email: v?.email ?? '',
		fullname: v?.fullname ?? '',
		username: v?.username ?? '',
		password: v ? undefined : '',
		isRoot: v?.isRoot ?? false,
		isActive: v?.isActive ?? true,
		pinCode: '',
		defaultLocationId: null,
		assignments:
			v?.assignments?.map((a) => ({
				roleId: a.role.id,
				locationId: a.location.id,
				isDefault: a.isDefault,
			})) ?? [],
	}
}

interface UserFormPageProps {
	mode: 'create' | 'update'
	id?: number
	backTo?: LinkOptions
}

export function UserFormPage({ mode, id, backTo }: UserFormPageProps) {
	const navigate = useNavigate()
	const selectedUser = useQuery({ ...userApi.detail.query({ id: id! }), enabled: !!id })

	const create = useMutation({ mutationFn: userApi.create.mutationFn })
	const update = useMutation({ mutationFn: userApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedUser.data?.data),
		onSubmit: async ({ value }) => {
			const assignments = value.assignments.map((a) => ({ ...a, userId: id ?? 0 }))
			const payload = { ...value, assignments }

			const promise = selectedUser.data?.data
				? update.mutateAsync({ body: { id: selectedUser.data.data.id, ...payload } })
				: create.mutateAsync({ body: { ...payload, password: value.password! } })

			await toast.promise(promise, toastLabelMessage(mode, 'pengguna')).unwrap()

			if (backTo) {
				navigate({ ...backTo, replace: true })
			}
		},
	})

	return (
		<form.AppForm>
			<FormConfig mode={mode} id={id} backTo={backTo}>
				<Page size="sm">
					<Page.BlockHeader
						title={mode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}
						back={backTo}
					/>
					<form.Form>
						<Page.Content>
							<AccountInfoCard />
							<AccessControlCard />
							<AssignmentsCard />
							<form.SimpleActions />
						</Page.Content>
					</form.Form>
				</Page>
			</FormConfig>
		</form.AppForm>
	)
}

function AccountInfoCard() {
	const form = useTypedAppFormContext({ ...fopts })
	const isCreate = useFormConfig().mode === 'create'

	return (
		<CardSection title="Informasi Akun" description="Detail identitas akun pengguna.">
			<form.AppField name="fullname">
				{(field) => <field.Input label="Nama Lengkap" required placeholder="John Doe" />}
			</form.AppField>
			<form.AppField name="email">
				{(field) => (
					<field.Input label="Email" required type="email" placeholder="user@example.com" />
				)}
			</form.AppField>
			<form.AppField name="username">
				{(field) => <field.Input label="Username" required placeholder="username" />}
			</form.AppField>
			{isCreate && (
				<form.AppField name="password">
					{(field) => (
						<field.Input
							label="Password"
							required
							type="password"
							autoComplete="new-password"
							placeholder="••••••••"
						/>
					)}
				</form.AppField>
			)}
		</CardSection>
	)
}

function AccessControlCard() {
	const form = useTypedAppFormContext({ ...fopts })

	return (
		<CardSection title="Status & Hak Akses">
			<form.AppField name="isActive">
				{(field) => (
					<field.Switch label="Status Aktif" description="Pengguna dapat login ke sistem" />
				)}
			</form.AppField>
			<Separator />
			<form.AppField name="isRoot">
				{(field) => (
					<field.Switch label="Super Admin" description="Akses penuh ke semua fitur dan lokasi" />
				)}
			</form.AppField>
		</CardSection>
	)
}

function AssignmentsCard() {
	const form = useTypedAppFormContext({ ...fopts })
	const isRoot = useStore(form.store, (s) => s.values.isRoot)

	const roles = useQuery({ ...roleApi.list.query({ limit: 100 }) })
	const locations = useQuery({ ...locationApi.list.query({ limit: 100 }) })

	const roleOptions = roles.data?.data.map((r) => ({ label: r.name, value: r.id })) ?? []
	const locationOptions = locations.data?.data.map((l) => ({ label: l.name, value: l.id })) ?? []

	return (
		<CardSection
			title="Role & Lokasi"
			description="Konfigurasi penugasan role dan lokasi pengguna."
			action={
				!isRoot && (
					<Button
						variant="outline"
						size="sm"
						type="button"
						onClick={() => {
							form.pushFieldValue('assignments', {
								roleId: null!,
								locationId: null!,
								isDefault: false,
							})
						}}
					>
						<PlusIcon />
						Tambah Penugasan
					</Button>
				)
			}
		>
			{isRoot ? (
				<Alert variant="destructive" className="border-dashed">
					<ShieldAlertIcon className="size-4" />
					<Alert.Title>Akses Tanpa Batas</Alert.Title>
					<Alert.Description>
						Super Admin memiliki bypass akses ke seluruh role dan seluruh cabang secara penuh.
					</Alert.Description>
				</Alert>
			) : (
				<form.AppField name="assignments">
					{(field) => {
						if (field.state.value.length === 0) {
							return (
								<Empty className="border-dashed">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<ShieldAlertIcon />
										</EmptyMedia>
										<EmptyTitle>Belum ada role yang ditambahkan</EmptyTitle>
										<EmptyDescription>
											Pengguna ini berpotensi gagal login karena tidak memiliki hak akses role dan
											lokasi pada aplikasi.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)
						}

						return (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[35%]">Lokasi Gudang/Cabang</TableHead>
										<TableHead className="w-[35%]">Role Sistem</TableHead>
										<TableHead className="w-[15%] text-left">Default</TableHead>
										<TableHead className="w-[15%] text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{field.state.value.map((_, i) => (
										<TableRow key={i}>
											<TableCell>
												<form.AppField name={`assignments[${i}].locationId`}>
													{(subField) => (
														<div className="w-full">
															<subField.Select
																placeholder="Pilih Lokasi"
																options={locationOptions}
																disabled={locations.isLoading}
															/>
														</div>
													)}
												</form.AppField>
											</TableCell>
											<TableCell>
												<form.AppField name={`assignments[${i}].roleId`}>
													{(subField) => (
														<div className="w-full">
															<subField.Select
																placeholder="Pilih Role"
																options={roleOptions}
																disabled={roles.isLoading}
															/>
														</div>
													)}
												</form.AppField>
											</TableCell>
											<TableCell>
												<form.AppField name={`assignments[${i}].isDefault`}>
													{(subField) => (
														<subField.Field>
															<subField.Control>
																<Switch
																	onCheckedChange={(checked: boolean) => {
																		subField.handleChange(checked)
																	}}
																	checked={subField.state.value}
																	onBlur={subField.handleBlur}
																	name={subField.name}
																/>
															</subField.Control>
														</subField.Field>
													)}
												</form.AppField>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="destructive"
													size="icon-sm"
													type="button"
													onClick={() => field.removeValue(i)}
												>
													<Trash2Icon />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)
					}}
				</form.AppField>
			)}
		</CardSection>
	)
}
