import { useMutation } from '@tanstack/react-query'

import { SaveIcon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAppForm } from '@/components/form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/input-password'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { mokaApi } from '../api'
import { MokaConfigurationCreateDto, MokaConfigurationOutputDto } from '../dto'

const formSchema = MokaConfigurationCreateDto

export type MokaConfigurationFormValues = z.infer<typeof formSchema>

interface MokaConfigurationFormProps {
	locationId: number
	existingConfig?: MokaConfigurationOutputDto
	onSuccess?: () => void
}

export function MokaConfigurationForm({
	locationId,
	existingConfig,
	onSuccess,
}: MokaConfigurationFormProps) {
	const isUpdate = !!existingConfig

	const createMutation = useMutation({
		mutationFn: mokaApi.createConfiguration.mutationFn,
		onSuccess: () => {
			toast.success('Konfigurasi Moka berhasil disimpan')
			onSuccess?.()
		},
		onError: (error) => {
			toast.error('Gagal menyimpan konfigurasi Moka', { description: error.message })
		},
	})

	const updateMutation = useMutation({
		mutationFn: mokaApi.updateConfiguration.mutationFn,
		onSuccess: () => {
			toast.success('Konfigurasi Moka berhasil diperbarui')
			onSuccess?.()
		},
		onError: (error) => {
			toast.error('Gagal memperbarui konfigurasi Moka', { description: error.message })
		},
	})

	const form = useAppForm({
		validators: {
			onSubmit: formSchema,
		},
		defaultValues:
			existingConfig ??
			({
				locationId,
				email: '',
				password: '',
				businessId: null,
				outletId: null,
				isActive: true,
				salesCronEnabled: false,
				salesCronExpression: null,
			} as MokaConfigurationFormValues),
	})

	const handleSubmit = (values: MokaConfigurationFormValues) => {
		if (isUpdate && existingConfig?.id) {
			updateMutation.mutate({
				params: { id: existingConfig.id },
				body: { ...values, id: existingConfig.id },
			})
		} else {
			createMutation.mutate({ body: values })
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
				className="space-y-6"
			>
				<form.Field name="email">
					{(field) => (
						<div>
							<Label>Email Moka</Label>
							<Input
								type="email"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="email@contoh.com"
							/>
							<p className="text-sm text-muted-foreground">Email akun Moka Anda</p>
						</div>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<div>
							<Label>Password</Label>
							<InputPassword
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="••••••••"
							/>
							<p className="text-sm text-muted-foreground">Password akun Moka Anda</p>
						</div>
					)}
				</form.Field>

				<Separator className="my-6" />

				<div className="space-y-4">
					<p className="text-sm font-medium text-muted-foreground">Opsi Tambahan</p>
					<form.Field name="businessId">
						{(field) => (
							<div>
								<Label>Business ID</Label>
								<Input
									value={field.state.value ?? ''}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Masukkan Business ID"
								/>
								<p className="text-sm text-muted-foreground">ID bisnis Moka (opsional)</p>
							</div>
						)}
					</form.Field>

					<form.Field name="outletId">
						{(field) => (
							<div>
								<Label>Outlet ID</Label>
								<Input
									value={field.state.value ?? ''}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Masukkan Outlet ID"
								/>
								<p className="text-sm text-muted-foreground">ID outlet Moka (opsional)</p>
							</div>
						)}
					</form.Field>
				</div>

				<Separator className="my-6" />

				<div className="space-y-4">
					<p className="text-sm font-medium text-muted-foreground">Pengaturan Sinkronisasi</p>
					<form.Field name="isActive">
						{(field) => (
							<div className="flex items-center space-x-2">
								<Checkbox
									id="isActive"
									checked={field.state.value}
									onCheckedChange={(checked) => field.handleChange(!!checked)}
								/>
								<div className="space-y-1 leading-none">
									<Label htmlFor="isActive">Aktifkan Integrasi</Label>
									<p className="text-sm text-muted-foreground">
										Aktifkan atau nonaktifkan integrasi Moka
									</p>
								</div>
							</div>
						)}
					</form.Field>

					<form.Field name="salesCronEnabled">
						{(field) => (
							<div className="flex items-center space-x-2">
								<Checkbox
									id="salesCronEnabled"
									checked={field.state.value}
									onCheckedChange={(checked) => field.handleChange(!!checked)}
								/>
								<div className="space-y-1 leading-none">
									<Label htmlFor="salesCronEnabled">Sinkronisasi Otomatis Penjualan</Label>
									<p className="text-sm text-muted-foreground">
										Sinkronkan data penjualan secara otomatis via cronjob
									</p>
								</div>
							</div>
						)}
					</form.Field>

					<form.Field name="salesCronExpression">
						{(field) => (
							<div>
								<Label>Cron Expression</Label>
								<Input
									value={field.state.value ?? ''}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="0 */6 * * *"
								/>
								<p className="text-sm text-muted-foreground">
									Jadwal sinkronisasi otomatis (contoh: 0 */6 * * *)
								</p>
							</div>
						)}
					</form.Field>
				</div>

				<div className="flex justify-end gap-3 pt-4">
					<Button type="submit" disabled={isLoading}>
						{isLoading ? (
							<>
								<RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
								Menyimpan...
							</>
						) : (
							<>
								<SaveIcon className="mr-2 h-4 w-4" />
								{isUpdate ? 'Perbarui' : 'Simpan'} Konfigurasi
							</>
						)}
					</Button>
				</div>
			</form>
		</form.AppForm>
	)
}
