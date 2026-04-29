import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DownloadIcon, PackageIcon, ShoppingCartIcon, TagIcon } from 'lucide-react'

import { useLocationId } from '@/hooks/use-location-id'
import { useToast } from '@/hooks/use-toast'

import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { mokaApi } from '@/features/moka/api/moka.api'

export const Route = createFileRoute('/_app/moka/sync')({
	component: MokaSync,
})

function MokaSync() {
	const locationId = useLocationId()
	const { toast } = useToast()

	const categoryMutation = useMutation({
		mutationFn: () =>
			mokaApi.triggerScrap({
				body: { locationId, type: 'category', triggerMode: 'manual' },
			}),
		onSuccess: () => {
			toast({ title: 'Sinkronisasi kategori berhasil' })
		},
		onError: (err) => {
			toast({
				title: 'Gagal sinkronisasi kategori',
				description: err instanceof Error ? err.message : 'Unknown error',
				variant: 'destructive',
			})
		},
	})

	const productMutation = useMutation({
		mutationFn: () =>
			mokaApi.triggerScrap({
				body: { locationId, type: 'product', triggerMode: 'manual' },
			}),
		onSuccess: () => {
			toast({ title: 'Sinkronisasi produk berhasil' })
		},
		onError: (err) => {
			toast({
				title: 'Gagal sinkronisasi produk',
				description: err instanceof Error ? err.message : 'Unknown error',
				variant: 'destructive',
			})
		},
	})

	const salesMutation = useMutation({
		mutationFn: () =>
			mokaApi.triggerScrap({
				body: {
					locationId,
					type: 'sales',
					triggerMode: 'manual',
					dateFrom: new Date(),
					dateTo: new Date(),
				},
			}),
		onSuccess: () => {
			toast({ title: 'Sinkronisasi sales berhasil' })
		},
		onError: (err) => {
			toast({
				title: 'Gagal sinkronisasi sales',
				description: err instanceof Error ? err.message : 'Unknown error',
				variant: 'destructive',
			})
		},
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Sinkronisasi Moka"
				description="Trigger manual sinkronisasi data dari Moka POS ke ERP"
			/>

			<Page.Content className="mt-2">
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TagIcon className="h-5 w-5" />
								Kategori
							</CardTitle>
							<CardDescription>Sinkronisasi kategori produk dari Moka</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={() => categoryMutation.mutate()}
								disabled={categoryMutation.isPending}
								className="w-full"
							>
								{categoryMutation.isPending ? 'Sinkronisasi...' : 'Sync Kategori'}
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PackageIcon className="h-5 w-5" />
								Produk
							</CardTitle>
							<CardDescription>Sinkronisasi produk dan varian dari Moka</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={() => productMutation.mutate()}
								disabled={productMutation.isPending}
								className="w-full"
							>
								{productMutation.isPending ? 'Sinkronisasi...' : 'Sync Produk'}
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShoppingCartIcon className="h-5 w-5" />
								Sales
							</CardTitle>
							<CardDescription>Sinkronisasi transaksi sales dari Moka</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={() => salesMutation.mutate()}
								disabled={salesMutation.isPending}
								className="w-full"
							>
								{salesMutation.isPending ? 'Sinkronisasi...' : 'Sync Sales (Hari Ini)'}
							</Button>
						</CardContent>
					</Card>
				</div>

				<Card className="mt-4">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DownloadIcon className="h-5 w-5" />
							Sinkronisasi Otomatis
						</CardTitle>
						<CardDescription>
							Sales sync berjalan otomatis via cronjob jika diaktifkan di konfigurasi
						</CardDescription>
					</CardHeader>
				</Card>
			</Page.Content>
		</Page>
	)
}
