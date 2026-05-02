import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { SaveIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { mokaApi } from '@/features/moka/api/moka.api'

export const Route = createFileRoute('/_app/moka/configuration')({
	component: MokaConfigurationPage,
})

function MokaConfigurationPage() {
	// TODO: Get locationId from context or route params
	const locationId = 1

	const { data: config, isLoading } = useQuery(
		mokaApi.configurationByLocation.query({ locationId }),
	)

	const createMutation = useMutation({
		mutationFn: mokaApi.createConfiguration.mutationFn,
		onSuccess: () => {
			toast.success('Konfigurasi berhasil disimpan')
		},
		onError: () => {
			toast.error('Gagal menyimpan konfigurasi')
		},
	})

	const updateMutation = useMutation({
		mutationFn: mokaApi.updateConfiguration.mutationFn,
		onSuccess: () => {
			toast.success('Konfigurasi berhasil diperbarui')
		},
		onError: () => {
			toast.error('Gagal memperbarui konfigurasi')
		},
	})

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.currentTarget)

		const data = {
			locationId,
			email: formData.get('email') as string,
			password: formData.get('password') as string,
			businessId: config?.data?.businessId ?? null,
			outletId: config?.data?.outletId ?? null,
			salesCronExpression: config?.data?.salesCronExpression ?? null,
			isActive: formData.get('isActive') === 'on',
			salesCronEnabled: formData.get('salesCronEnabled') === 'on',
		}

		if (config?.data?.id) {
			updateMutation.mutate({
				params: { id: config.data.id },
				body: { id: config.data.id, ...data },
			})
		} else {
			createMutation.mutate({ body: data })
		}
	}

	if (isLoading) {
		return (
			<Page>
				<Page.Content>
					<div className="flex items-center justify-center py-12">
						<p className="text-muted-foreground">Memuat konfigurasi...</p>
					</div>
				</Page.Content>
			</Page>
		)
	}

	return (
		<Page>
			<Page.BlockHeader
				title="Konfigurasi Moka"
				description="Setup integrasi Moka POS untuk sinkronisasi data otomatis"
			/>

			<Page.Content className="mt-2">
				<form onSubmit={handleSubmit} className="max-w-xl space-y-6">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email Moka</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="email@contoh.com"
								defaultValue={config?.data?.email ?? ''}
								required
							/>
							<p className="text-xs text-muted-foreground">Email akun Moka POS Anda</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password Moka</Label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="••••••••"
								required={!config?.data}
							/>
							<p className="text-xs text-muted-foreground">
								{config?.data
									? 'Biarkan kosong untuk tidak mengubah password'
									: 'Password akun Moka POS Anda'}
							</p>
						</div>

						<div className="flex items-center justify-between space-x-2">
							<div className="space-y-0.5">
								<Label htmlFor="isActive">Aktifkan Integrasi</Label>
								<p className="text-xs text-muted-foreground">
									Hidupkan sinkronisasi otomatis untuk lokasi ini
								</p>
							</div>
							<Switch
								id="isActive"
								name="isActive"
								defaultChecked={config?.data?.isActive ?? true}
							/>
						</div>

						<div className="flex items-center justify-between space-x-2">
							<div className="space-y-0.5">
								<Label htmlFor="salesCronEnabled">Sinkronisasi Sales Otomatis</Label>
								<p className="text-xs text-muted-foreground">
									Jalankan sync sales harian via cronjob
								</p>
							</div>
							<Switch
								id="salesCronEnabled"
								name="salesCronEnabled"
								defaultChecked={config?.data?.salesCronEnabled ?? false}
							/>
						</div>
					</div>

					<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
						{createMutation.isPending || updateMutation.isPending ? (
							'Menyimpan...'
						) : (
							<>
								<SaveIcon className="mr-2 h-4 w-4" />
								Simpan Konfigurasi
							</>
						)}
					</Button>
				</form>
			</Page.Content>
		</Page>
	)
}
