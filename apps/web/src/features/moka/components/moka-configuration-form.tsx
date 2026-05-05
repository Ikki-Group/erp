import { useMutation } from '@tanstack/react-query'

import { z } from 'zod'
import { SaveIcon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useAppForm } from '@/components/form'

import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import { FormField } from '@/components/ui/form'

import { mokaApi } from '../api'
import { MokaConfigurationCreateDto, MokaConfigurationUpdateDto } from '../dto'

const formSchema = MokaConfigurationCreateDto

export type MokaConfigurationFormValues = z.infer<typeof formSchema>

interface MokaConfigurationFormProps {
	locationId: number
	existingConfig?: MokaConfigurationFormValues
	onSuccess?: () => void
}

export function MokaConfigurationForm({ locationId, existingConfig, onSuccess }: MokaConfigurationFormProps) {
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
		defaultValues: existingConfig || {
			locationId,
			email: '',
			password: '',
			businessId: null,
			outletId: null,
			isActive: true,
			salesCronEnabled: false,
			salesCronExpression: null,
		},
	})

	const handleSubmit = (values: MokaConfigurationFormValues) => {
		if (isUpdate && existingConfig?.id) {
			updateMutation.mutate({ params: { id: existingConfig.id }, body: values })
		} else {
			createMutation.mutate(values)
		}
	}

	const isLoading = createMutation.isPending || updateMutation.isPending

	return (
		<form.Provider>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
				className="space-y-6"
			>
				<form.Field name="email">
					{(field) => (
						<FormField
							label="Email Moka"
							description="Email akun Moka Anda"
							required
						>
							<field.Input type="email" placeholder="email@contoh.com" />
						</FormField>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<FormField
							label="Password"
							description="Password akun Moka Anda"
							required
						>
							<field.Input type="password" placeholder="••••••••" />
						</FormField>
					)}
				</form.Field>

				<FieldSeparator label="Opsi Tambahan" />

				<form.Field name="businessId">
					{(field) => (
						<FormField
							label="Business ID"
							description="ID bisnis Moka (opsional)"
						>
							<field.Input placeholder="Masukkan Business ID" />
						</FormField>
					)}
				</form.Field>

				<form.Field name="outletId">
					{(field) => (
						<FormField
							label="Outlet ID"
							description="ID outlet Moka (opsional)"
						>
							<field.Input placeholder="Masukkan Outlet ID" />
						</FormField>
					)}
				</form.Field>

				<FieldSeparator label="Pengaturan Sinkronisasi" />

				<form.Field name="isActive">
					{(field) => (
						<FormField
							label="Aktifkan Integrasi"
							description="Aktifkan atau nonaktifkan integrasi Moka"
						>
							<field.Checkbox />
						</FormField>
					)}
				</form.Field>

				<form.Field name="salesCronEnabled">
					{(field) => (
						<FormField
							label="Sinkronisasi Otomatis Penjualan"
							description="Sinkronkan data penjualan secara otomatis via cronjob"
						>
							<field.Checkbox />
						</FormField>
					)}
				</form.Field>

				<form.Field name="salesCronExpression">
					{(field) => (
						<FormField
							label="Cron Expression"
							description="Jadwal sinkronisasi otomatis (contoh: 0 */6 * * *)"
						>
							<field.Input placeholder="0 */6 * * *" />
						</FormField>
					)}
				</form.Field>

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
		</form.Provider>
	)
}
