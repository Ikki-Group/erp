import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { BoxesIcon, ShoppingCartIcon, TrendingUpIcon } from 'lucide-react'

import { PageHeader, PageSection } from '@/components/shared'

import { Button } from '@/components/ui/button'
import {
	Card,
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
	const [hoveredCard, setHoveredCard] = useState<string | null>(null)

	return (
		<div className="space-y-10">
			<PageHeader
				title="Cards"
				description="Flexible container components for grouping related content. Build with Header/Title/Description/Content/Footer slots."
			/>

			{/* ─── BASIC CARD ─── */}
			<PageSection title="Basic Card" description="Default card with header, content, and footer.">
				<Card className="max-w-sm">
					<CardHeader>
						<CardTitle>Coffee Beans (Arabica)</CardTitle>
						<CardDescription>MAT-001 · Raw Material</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">24.5 kg on hand across 3 locations.</p>
					</CardContent>
					<CardFooter className="gap-2">
						<Button size="sm" variant="outline">
							View
						</Button>
						<Button size="sm">Edit</Button>
					</CardFooter>
				</Card>
			</PageSection>

			<Separator />

			{/* ─── CARD VARIANTS ─── */}
			<PageSection
				title="Card Layout Patterns"
				description="Different content structures for various use cases."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					{/* Icon + Title + Action */}
					<Card className="max-w-sm">
						<CardHeader className="flex flex-row items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
									<BoxesIcon className="size-4" />
								</div>
								<div>
									<CardTitle className="text-sm">Materials</CardTitle>
									<CardDescription className="text-xs">Total in inventory</CardDescription>
								</div>
							</div>
							<Button variant="ghost" size="icon-xs">
								→
							</Button>
						</CardHeader>
					</Card>

					{/* Metric Display */}
					<Card className="max-w-sm">
						<CardHeader>
							<CardTitle className="text-3xl font-bold">1,284</CardTitle>
							<CardDescription>Total orders this month (+12.5%)</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground">Compared to last month</p>
						</CardContent>
					</Card>

					{/* Compact Card */}
					<Card className="max-w-sm" size="sm">
						<CardHeader>
							<CardTitle className="text-sm">Low Stock Alert</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground">7 materials below minimum threshold.</p>
						</CardContent>
					</Card>

					{/* Rich Content Card */}
					<Card className="max-w-sm">
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>Last 3 updates</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="text-xs space-y-1">
								<p className="font-medium text-foreground">Updated min stock</p>
								<p className="text-muted-foreground">5 minutes ago by Budi Santoso</p>
							</div>
							<div className="text-xs space-y-1">
								<p className="font-medium text-foreground">Changed supplier</p>
								<p className="text-muted-foreground">2 hours ago by Siti Rahma</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</PageSection>

			<Separator />

			{/* ─── INTERACTIVE CARDS ─── */}
			<PageSection
				title="Interactive Cards"
				description="Cards with hover states and click interactions."
			>
				<div className="grid gap-4 lg:grid-cols-3">
					{['material', 'order', 'transfer'].map((type) => (
						<Card
							key={type}
							className="cursor-pointer transition-colors"
							onMouseEnter={() => setHoveredCard(type)}
							onMouseLeave={() => setHoveredCard(null)}
						>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="capitalize">{type}s</CardTitle>
										<CardDescription>Click to view details</CardDescription>
									</div>
									<div
										className={cn(
											'flex size-8 items-center justify-center rounded-md transition-colors',
											hoveredCard === type ? 'bg-primary/10' : 'bg-muted',
										)}
									>
										{type === 'material' && <BoxesIcon className="size-4" />}
										{type === 'order' && <ShoppingCartIcon className="size-4" />}
										{type === 'transfer' && <TrendingUpIcon className="size-4" />}
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">42</p>
								<p className="text-xs text-muted-foreground">Active items</p>
							</CardContent>
						</Card>
					))}
				</div>
			</PageSection>

			<Separator />

			{/* ─── CONTENT-RICH CARDS ─── */}
			<PageSection
				title="Content-Rich Cards"
				description="Cards handling complex layouts and multiple content types."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<Card className="max-w-md">
						<CardHeader>
							<CardTitle>Material Details</CardTitle>
							<CardDescription>Comprehensive information</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Supplier</p>
									<p className="text-sm font-medium">PT Sumber Jaya</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Last Price</p>
									<p className="text-sm font-medium">Rp 85,000 / kg</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Stock</p>
									<p className="text-sm font-medium">24.5 kg</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Avg Cost</p>
									<p className="text-sm font-medium">Rp 82,340 / kg</p>
								</div>
							</div>
						</CardContent>
						<CardFooter>
							<Button variant="outline" size="sm" className="w-full">
								Edit Details
							</Button>
						</CardFooter>
					</Card>

					<Card className="max-w-md">
						<CardHeader>
							<CardTitle>Stock by Location</CardTitle>
							<CardDescription>Distribution across warehouses</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							{[
								{ name: 'Jakarta HQ', qty: 15.2 },
								{ name: 'Surabaya Branch', qty: 6.8 },
								{ name: 'Medan Depot', qty: 2.5 },
							].map((loc) => (
								<div key={loc.name} className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">{loc.name}</span>
									<span className="font-medium">{loc.qty} kg</span>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</PageSection>

			<Separator />

			{/* ─── EMPTY & LOADING STATES ─── */}
			<PageSection
				title="Empty & Loading States"
				description="Handling data-less and loading scenarios."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<Card className="max-w-sm">
						<CardHeader>
							<CardTitle>Empty State</CardTitle>
							<CardDescription>No data to display</CardDescription>
						</CardHeader>
						<CardContent className="flex h-32 items-center justify-center text-center">
							<div className="space-y-2">
								<BoxesIcon className="mx-auto size-6 opacity-20" />
								<p className="text-xs text-muted-foreground">No materials found.</p>
							</div>
						</CardContent>
					</Card>

					<Card className="max-w-sm">
						<CardHeader>
							<CardTitle>Loading State</CardTitle>
							<CardDescription>Fetching data...</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="h-4 rounded bg-muted animate-pulse" />
							<div className="h-4 rounded bg-muted animate-pulse w-4/5" />
							<div className="mt-4 h-8 rounded bg-muted animate-pulse" />
						</CardContent>
					</Card>
				</div>
			</PageSection>
		</div>
	)
}

function cn(...classes: (string | undefined | null)[]) {
	return classes.filter(Boolean).join(' ')
}
