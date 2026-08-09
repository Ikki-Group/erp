import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { SearchIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import { menuCategoryResource, menuItemResource } from '@/features/menu/api.ts'
import type { MenuItemDto } from '@/features/menu/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

interface MenuGridProps {
	onSelectItem: (item: MenuItemDto) => void
}

export function MenuGrid({ onSelectItem }: MenuGridProps) {
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id ?? 0

	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
	const [search, setSearch] = useState('')

	const categoriesQuery = useQuery(
		menuCategoryResource.list.queryOptions({
			locationId,
			page: 1,
			limit: 100,
			q: '',
		}),
	)

	const itemsQuery = useQuery(
		menuItemResource.list.queryOptions({
			locationId,
			page: 1,
			limit: 200,
			categoryId: selectedCategoryId ?? undefined,
			status: 'active',
			q: search,
		}),
	)

	const categories = categoriesQuery.data?.data ?? []
	const items = itemsQuery.data?.data ?? []

	return (
		<div className="flex h-full flex-col gap-3">
			<div className="relative">
				<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Cari menu..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			<div className="flex flex-wrap gap-1.5">
				<Badge
					variant={selectedCategoryId === null ? 'default' : 'outline'}
					className="cursor-pointer"
					onClick={() => setSelectedCategoryId(null)}
				>
					Semua
				</Badge>
				{categories.map((cat) => (
					<Badge
						key={cat.id}
						variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
						className="cursor-pointer"
						onClick={() => setSelectedCategoryId(cat.id)}
					>
						{cat.name}
					</Badge>
				))}
			</div>

			<ScrollArea className="flex-1">
				{itemsQuery.isLoading ? (
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton key={i} className="h-24 rounded-lg" />
						))}
					</div>
				) : items.length === 0 ? (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						Tidak ada menu ditemukan
					</div>
				) : (
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
						{items.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => onSelectItem(item)}
								className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
							>
								<span className="line-clamp-2 text-xs font-medium">{item.name}</span>
								<span className="text-xs text-muted-foreground">
									Rp {Number(item.basePrice).toLocaleString('id-ID')}
								</span>
							</button>
						))}
					</div>
				)}
			</ScrollArea>
		</div>
	)
}
