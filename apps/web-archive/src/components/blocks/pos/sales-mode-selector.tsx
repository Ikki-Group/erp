import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { salesTypeApi } from '@/features/sales-type'
import type { SalesTypeDto } from '@/features/sales-type'

interface SalesModeSelectorProps {
	selectedMode: SalesTypeDto | null
	onSelect: (mode: SalesTypeDto) => void
}

export function SalesModeSelector({ selectedMode, onSelect }: SalesModeSelectorProps) {
	const { data: salesTypesData, isLoading } = useQuery(salesTypeApi.list.query({}))
	const salesTypes = salesTypesData?.data ?? []

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="outline" className="w-[200px] justify-start">
					{selectedMode ? selectedMode.name : 'Pilih Mode Penjualan'}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[200px]">
				{isLoading ? (
					<DropdownMenuItem disabled>Memuat...</DropdownMenuItem>
				) : salesTypes.length === 0 ? (
					<DropdownMenuItem disabled>Tidak ada mode tersedia</DropdownMenuItem>
				) : (
					salesTypes.map((salesType) => (
						<DropdownMenuItem key={salesType.id} onClick={() => onSelect(salesType)}>
							{salesType.name}
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
