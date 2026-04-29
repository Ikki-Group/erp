import { useEffect, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { Loader2Icon, PlusIcon, SearchIcon } from 'lucide-react'

import { Badge } from '@/components/reui/badge'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { materialApi } from '../api'
import type { MaterialSelectDto } from '../dto'

interface MaterialPickerDialogProps {
	onConfirm: (materials: Array<MaterialSelectDto>) => void
	selectedIds?: Array<number>
	trigger?: React.ReactNode
	title?: string
	description?: string
}

export function MaterialPickerDialog({
	onConfirm,
	selectedIds = [],
	trigger,
	title = 'Pilih Bahan Baku',
	description = 'Cari dan pilih beberapa bahan baku untuk ditambahkan ke resep.',
}: MaterialPickerDialogProps) {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [tempSelected, setTempSelected] = useState<Map<number, MaterialSelectDto>>(new Map())

	// Reset temp selected when dialog opens
	useEffect(() => {
		if (open) {
			setTempSelected(new Map())
			setQuery('')
		}
	}, [open])

	const { data: results, isLoading } = useQuery({
		...materialApi.list.query({ search: query, limit: 50 }),
		enabled: open,
	})

	const toggleSelect = (item: MaterialSelectDto) => {
		setTempSelected((prev) => {
			const next = new Map(prev)
			if (next.has(item.id)) {
				next.delete(item.id)
			} else {
				next.set(item.id, item)
			}
			return next
		})
	}

	const handleConfirm = () => {
		onConfirm(Array.from(tempSelected.values()))
		setOpen(false)
	}

	const alreadySelectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger ?? (
				<DialogTrigger>
					<Button variant="outline" size="sm">
						<PlusIcon />
						Pilih Bahan
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-150 h-150 flex flex-col">
				<DialogHeader className="border-b p-4">
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="flex items-center border-b px-3 py-2">
						<SearchIcon className="mr-2 shrink-0 opacity-50" />
						<Input
							className="flex h-10 w-full rounded-md bg-transparent text-sm outline-none border-0 focus-visible:ring-0 px-0"
							placeholder="Cari SKU atau nama bahan..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="flex-1 overflow-y-auto p-1 relative">
						{isLoading && (
							<div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 text-muted-foreground text-sm">
								<Loader2Icon className="mr-2 animate-spin" /> Memuat...
							</div>
						)}
						{!isLoading && results?.data?.length === 0 && (
							<div className="py-10 text-center text-sm text-muted-foreground">
								Tidak ada bahan baku ditemukan.
							</div>
						)}
						<div className="grid gap-1 p-1">
							{results?.data?.map((item) => {
								const isSelected = tempSelected.has(item.id)
								const isAlreadyInRecipe = alreadySelectedSet.has(item.id)

								return (
									<div
										key={item.id}
										onClick={() => !isAlreadyInRecipe && toggleSelect(item)}
										className={`
                      flex items-center justify-between p-3 rounded-md transition-colors border
                      ${isSelected ? 'bg-primary/5 border-primary/20' : 'border-transparent'}
                      ${isAlreadyInRecipe ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:bg-accent cursor-pointer'}
                    `}
									>
										<div className="flex flex-col gap-0.5">
											<div className="flex items-center gap-2">
												<span className="font-medium text-sm">{item.name}</span>
												{isAlreadyInRecipe && (
													<Badge variant="outline" size="xs">
														Terpilih
													</Badge>
												)}
											</div>
											<span className="text-xs text-muted-foreground">
												{item.sku} • {item.category?.name ?? 'No Category'}
											</span>
										</div>
										{!isAlreadyInRecipe && <Checkbox checked={isSelected} />}
									</div>
								)
							})}
						</div>
					</div>
				</div>

				<DialogFooter className="p-4 border-t bg-muted/10 items-center sm:justify-between">
					<span className="text-sm text-muted-foreground">{tempSelected.size} dipilih</span>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => setOpen(false)}>
							Batal
						</Button>
						<Button onClick={handleConfirm} disabled={tempSelected.size === 0}>
							Tambahkan Bahan
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
