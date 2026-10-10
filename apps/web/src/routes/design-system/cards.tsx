import { createFileRoute } from '@tanstack/react-router'

import { AlertTriangleIcon, TruckIcon } from 'lucide-react'

import { DetailList, EmptyState, MetricCard, PageHeader, PageSection } from '@/components/shared'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/design-system/cards')({
	component: CardsPage,
})

function CardsPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Cards"
				description="Inline surfaces: one hairline border, no shadow, never a card inside a card. Group inside a card with divide-y or spacing."
			/>

			<PageSection
				title="Metric Card — metric"
				description="Dashboard counts. tone tints the value when the number carries meaning; isLoading shows a skeleton; onClick turns the whole card into a keyboard-operable button."
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<MetricCard title="Transfer Berjalan" value={3} description="Dalam perjalanan" />
					<MetricCard
						title="Stok Menipis"
						value={7}
						tone="warning"
						icon={<AlertTriangleIcon />}
						description="Di bawah minimum"
						onClick={() => alert('Would navigate to /inventory/stock')}
					/>
					<MetricCard
						title="Penerimaan Draft"
						value={12}
						trend={{ value: '+3', positive: false }}
						description="Menunggu konfirmasi"
					/>
					<MetricCard title="Opname Aktif" value="" isLoading />
				</div>
			</PageSection>

			<Separator />

			<PageSection
				title="Metric Card — panel"
				description="Omit value and pass children for a titled panel. noPadding for a flush list; rows use divide-y, not nested cards."
			>
				<div className="grid items-start gap-4 lg:grid-cols-2">
					<MetricCard
						title="Transfer Berjalan"
						description="Perpindahan stok antar lokasi yang sedang berjalan."
						icon={<TruckIcon />}
						actions={
							<Button variant="ghost" size="sm">
								Lihat semua
							</Button>
						}
						noPadding
					>
						<ul className="divide-y text-xs">
							{[
								{ code: 'TRF-STORE-01-0042', route: 'Gudang → Toko 1', qty: '24' },
								{ code: 'TRF-STORE-02-0017', route: 'Gudang → Toko 2', qty: '8' },
							].map((row) => (
								<li key={row.code} className="flex items-center justify-between gap-3 px-4 py-2.5">
									<div className="min-w-0">
										<p className="truncate font-mono text-muted-foreground">{row.code}</p>
										<p className="truncate">{row.route}</p>
									</div>
									<span className="font-mono tabular-nums">{row.qty}</span>
								</li>
							))}
						</ul>
					</MetricCard>
					<MetricCard title="Stok Menipis" description="Perlu perhatian segera.">
						<EmptyState title="Semua stok aman" description="Tidak ada bahan di bawah minimum." />
					</MetricCard>
				</div>
			</PageSection>

			<Separator />

			<PageSection
				title="Card (primitive)"
				description='Header / Title / Description / Action / Content / Footer slots sharing one --card-spacing. size="sm" tightens it.'
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Coffee Beans (Arabica)</CardTitle>
							<CardDescription className="font-mono">MAT-001</CardDescription>
							<CardAction>
								<Button variant="outline" size="sm">
									Edit
								</Button>
							</CardAction>
						</CardHeader>
						<CardContent>
							<DetailList
								items={[
									{ label: 'Supplier', value: 'PT Sumber Jaya' },
									{ label: 'Base UoM', value: 'kg' },
								]}
							/>
						</CardContent>
					</Card>
					<Card size="sm">
						<CardHeader>
							<CardTitle>Compact card</CardTitle>
							<CardDescription>size=&quot;sm&quot; — 12px spacing.</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground">7 materials below minimum.</p>
						</CardContent>
						<CardFooter className="gap-2 border-t">
							<Button size="sm">Reorder</Button>
						</CardFooter>
					</Card>
				</div>
			</PageSection>
		</div>
	)
}
