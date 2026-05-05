import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { RefreshCwIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Page } from '@/components/layout/page'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { mokaApi } from '../api'
import { MokaConfigurationForm } from '../components/moka-configuration-form'
import { MokaScrapHistoryDto } from '../dto'

export function MokaIntegrationPage() {
	const [locationId] = useState(1) // TODO: Get from context or route params
	const [refreshKey, setRefreshKey] = useState(0)

	const { data: config, isLoading: configLoading } = useQuery(
		mokaApi.configurationByLocation.query({ locationId }),
	)

	const { data: historyData, isLoading: historyLoading } = useQuery({
		...mokaApi.scrapHistory.query({ mokaConfigurationId: config?.data?.id }),
		enabled: !!config?.data?.id,
		queryKey: ['moka', 'scrapHistory', config?.data?.id, refreshKey],
	})

	const history = historyData?.data ?? []

	const handleConfigSuccess = () => {
		setRefreshKey((prev) => prev + 1)
	}

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Integrasi Moka"
				description="Konfigurasi integrasi dengan sistem Moka untuk sinkronisasi data penjualan, produk, dan kategori."
			/>

			<Page.Content className="flex flex-col gap-6">
				{/* Configuration Section */}
				<Card className="p-6">
					<h2 className="text-lg font-semibold mb-4">Konfigurasi</h2>
					<MokaConfigurationForm
						locationId={locationId}
						existingConfig={config?.data}
						onSuccess={handleConfigSuccess}
					/>
				</Card>

				{/* Sync History Section */}
				{config?.data && (
					<Card className="p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<ClockIcon className="h-5 w-5" />
								Riwayat Sinkronisasi
							</h2>
							<Button variant="outline" size="sm" onClick={() => setRefreshKey((prev) => prev + 1)}>
								<RefreshCwIcon className="mr-2 h-4 w-4" />
								Refresh
							</Button>
						</div>

						{historyLoading ? (
							<p className="text-sm text-muted-foreground">Memuat riwayat...</p>
						) : history.length === 0 ? (
							<p className="text-sm text-muted-foreground">Belum ada riwayat sinkronisasi.</p>
						) : (
							<div className="space-y-3">
								{history.map((item: MokaScrapHistoryDto) => (
									<div
										key={item.id}
										className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center gap-4">
											<div
												className={`p-2 rounded-full ${
													item.status === 'completed'
														? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
														: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
												}`}
											>
												{item.status === 'completed' ? (
													<CheckCircleIcon className="h-5 w-5" />
												) : (
													<XCircleIcon className="h-5 w-5" />
												)}
											</div>
											<div>
												<p className="font-medium capitalize">{item.type}</p>
												<p className="text-sm text-muted-foreground">
													{new Date(item.createdAt).toLocaleString('id-ID')}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											{item.status === 'completed' && (
												<Badge variant="secondary" className="text-xs">
													{item.recordsCount} records
												</Badge>
											)}
											<Badge
												variant={item.status === 'completed' ? 'default' : 'destructive'}
												className="capitalize"
											>
												{item.status}
											</Badge>
										</div>
									</div>
								))}
							</div>
						)}
					</Card>
				)}

				{/* Manual Sync Triggers */}
				{config?.data?.isActive && (
					<Card className="p-6">
						<h2 className="text-lg font-semibold mb-4">Sinkronisasi Manual</h2>
						<div className="grid gap-4 md:grid-cols-2">
							<Button
								variant="outline"
								className="h-auto py-4 flex flex-col items-start gap-2"
								onClick={() => {
									toast.info('Sinkronisasi produk akan segera diimplementasikan')
								}}
							>
								<RefreshCwIcon className="h-5 w-5" />
								<div className="text-left">
									<p className="font-medium">Sinkronisasi Produk</p>
									<p className="text-xs text-muted-foreground">Sinkronkan data produk dari Moka</p>
								</div>
							</Button>
							<Button
								variant="outline"
								className="h-auto py-4 flex flex-col items-start gap-2"
								onClick={() => {
									toast.info('Sinkronisasi kategori akan segera diimplementasikan')
								}}
							>
								<RefreshCwIcon className="h-5 w-5" />
								<div className="text-left">
									<p className="font-medium">Sinkronisasi Kategori</p>
									<p className="text-xs text-muted-foreground">
										Sinkronkan data kategori produk dari Moka
									</p>
								</div>
							</Button>
						</div>
					</Card>
				)}
			</Page.Content>
		</Page>
	)
}
