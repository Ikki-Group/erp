import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { KeyRoundIcon, SaveIcon } from 'lucide-react'

import { useLocationId } from '@/hooks/use-location-id'
import { useToast } from '@/hooks/use-toast'

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
	const locationId = useLocationId()
	const { toast } = useToast()

	const { data: config, isLoading } = useQuery({
		queryKey: ['moka-config', locationId],
		queryFn: () => mokaApi.configurationByLocation({ params: { locationId } }),
		enabled: !!locationId,
	})

	const createMutation = useMutation({
		mutationFn: mokaApi.createConfiguration,
		onSuccess: () => {
			toast({ title: 'Konfigurasi berhasil disimpan' })
		},
		onError: (err) => {
			toast({
				title: 'Gagal menyimpan konfigurasi',
				description: err instanceof Error ? err.message : 'Unknown error',
				variant: 'destructive',
			})
		},
	})

	const updateMutation = useMutation({
		mutationFn: mokaApi.updateConfiguration,
		onSuccess: () => {
			toast({ title: 'Konfigurasi berhasil diperbarui' })
		},
		onError: (err) => {
			toast({
				title: 'Gagal memperbarui konfigurasi',
				description: err instanceof Error ? err.message : 'Unknown error',
				variant: 'destructive',
			})
		},
	})

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.currentTarget)

		const data = {
			locationId,
			email: formData.get('email') as string,
			password: formData.get('password') as string,
			isActive: formData.get('isActive') === 'on',
			salesCronEnabled: formData.get('salesCronEnabled') === 'on',
		}

		if (config?.data) {
			updateMutation.mutate({
				params: { id: config.data.id },
				body: data,
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
				icon={KeyRoundIcon}
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
								defaultValue={config?.data?.password ? '••••••••' : ''}
								required={!config?.data?.password}
							/>
							<p className="text-xs text-muted-foreground">
								{config?.data?.password
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
