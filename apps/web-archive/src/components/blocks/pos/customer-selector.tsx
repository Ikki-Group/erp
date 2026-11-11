import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { customerApi } from '@/features/crm'
import type { CustomerDto } from '@/features/crm'

interface CustomerSelectorProps {
	selectedCustomer: CustomerDto | null
	onSelect: (customer: CustomerDto) => void
	onClear: () => void
}

export function CustomerSelector({ selectedCustomer, onSelect, onClear }: CustomerSelectorProps) {
	const { data: customersData, isLoading } = useQuery(customerApi.list.query({}))
	const customers = customersData?.data ?? []

	return (
		<div className="flex items-center gap-2">
			{selectedCustomer ? (
				<>
					<span className="text-sm text-muted-foreground">Pelanggan:</span>
					<span className="font-semibold">{selectedCustomer.name}</span>
					<Button variant="ghost" size="sm" onClick={onClear}>
						×
					</Button>
				</>
			) : (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="outline" size="sm">
							Pilih Pelanggan
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-[200px]">
						{isLoading ? (
							<DropdownMenuItem disabled>Memuat...</DropdownMenuItem>
						) : customers.length === 0 ? (
							<DropdownMenuItem disabled>Tidak ada pelanggan</DropdownMenuItem>
						) : (
							customers.map((customer) => (
								<DropdownMenuItem key={customer.id} onClick={() => onSelect(customer)}>
									{customer.name}
								</DropdownMenuItem>
							))
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	)
}
