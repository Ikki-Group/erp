import { useCallback, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'

import { menuItemExtras } from '@/features/menu/api.ts'
import type { MenuItemDto, ModifierGroupWithOptionsDto, ModifierOptionDto } from '@/features/menu/dto/index.ts'

export interface ModifierSelection {
	optionIds: number[]
	optionNames: string[]
	priceTotal: number
}

interface ModifierDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	menuItem: MenuItemDto | null
	onConfirm: (item: MenuItemDto, selection: ModifierSelection) => void
}

export function ModifierDialog({ open, onOpenChange, menuItem, onConfirm }: ModifierDialogProps) {
	const [selections, setSelections] = useState<Record<number, number[]>>({})

	const detailQuery = useQuery({
		...menuItemExtras.detail.queryOptions({ id: menuItem?.id ?? 0 }),
		enabled: open && !!menuItem,
	})

	const modifierGroups: ModifierGroupWithOptionsDto[] = detailQuery.data?.data?.modifierGroups ?? []

	const handleToggleOption = useCallback(
		(group: ModifierGroupWithOptionsDto, option: ModifierOptionDto) => {
			setSelections((prev) => {
				const current = prev[group.id] ?? []
				if (group.selectionType === 'single') {
					return { ...prev, [group.id]: [option.id] }
				}
				const exists = current.includes(option.id)
				const next = exists
					? current.filter((id) => id !== option.id)
					: [...current, option.id]
				if (group.maxSelect && next.length > group.maxSelect) return prev
				return { ...prev, [group.id]: next }
			})
		},
		[],
	)

	const handleConfirm = useCallback(() => {
		if (!menuItem) return

		const allOptions = modifierGroups.flatMap((g) => g.options)
		const selectedIds = Object.values(selections).flat()
		const selectedOptions = allOptions.filter((o) => selectedIds.includes(o.id))
		const priceTotal = selectedOptions.reduce(
			(sum, o) => sum + Number(o.priceAdjustment),
			0,
		)

		onConfirm(menuItem, {
			optionIds: selectedIds,
			optionNames: selectedOptions.map((o) => o.name),
			priceTotal,
		})

		setSelections({})
		onOpenChange(false)
	}, [menuItem, modifierGroups, selections, onConfirm, onOpenChange])

	const handleClose = useCallback(() => {
		setSelections({})
		onOpenChange(false)
	}, [onOpenChange])

	const isValid = modifierGroups.every((group) => {
		if (!group.isRequired) return true
		const selected = selections[group.id] ?? []
		return selected.length >= group.minSelect
	})

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{menuItem?.name ?? 'Modifier'}</DialogTitle>
				</DialogHeader>

				{detailQuery.isLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : modifierGroups.length === 0 ? (
					<p className="text-xs text-muted-foreground">
						Tidak ada modifier untuk item ini.
					</p>
				) : (
					<div className="max-h-[60vh] space-y-4 overflow-y-auto">
						{modifierGroups.map((group) => (
							<div key={group.id} className="space-y-2">
								<div className="flex items-center gap-2">
									<Label className="text-xs font-semibold">
										{group.name}
									</Label>
									{group.isRequired === 1 && (
										<span className="text-[10px] text-destructive">
											Wajib
										</span>
									)}
									{group.selectionType === 'multiple' && group.maxSelect && (
										<span className="text-[10px] text-muted-foreground">
											(maks. {group.maxSelect})
										</span>
									)}
								</div>

								{group.selectionType === 'single' ? (
									<RadioGroup
										value={String(selections[group.id]?.[0] ?? '')}
										onValueChange={(val) => {
											const opt = group.options.find(
												(o) => o.id === Number(val),
											)
											if (opt) handleToggleOption(group, opt)
										}}
										className="space-y-1"
									>
										{group.options
											.filter((o) => o.isActive === 1)
											.map((option) => (
												<label
													key={option.id}
													className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-accent"
												>
													<div className="flex items-center gap-2">
														<input
															type="radio"
															name={`group-${group.id}`}
															value={String(option.id)}
															checked={
																selections[group.id]?.[0] ===
																option.id
															}
															onChange={() =>
																handleToggleOption(group, option)
															}
															className="accent-primary"
														/>
														<span>{option.name}</span>
													</div>
													{Number(option.priceAdjustment) !== 0 && (
														<span className="text-muted-foreground">
															+Rp{' '}
															{Number(
																option.priceAdjustment,
															).toLocaleString('id-ID')}
														</span>
													)}
												</label>
											))}
									</RadioGroup>
								) : (
									<div className="space-y-1">
										{group.options
											.filter((o) => o.isActive === 1)
											.map((option) => {
												const checked =
													selections[group.id]?.includes(option.id) ??
													false
												return (
													<label
														key={option.id}
														className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-accent"
													>
														<div className="flex items-center gap-2">
															<Checkbox
																checked={checked}
																onCheckedChange={() =>
																	handleToggleOption(
																		group,
																		option,
																	)
																}
															/>
															<span>{option.name}</span>
														</div>
														{Number(option.priceAdjustment) !== 0 && (
															<span className="text-muted-foreground">
																+Rp{' '}
																{Number(
																	option.priceAdjustment,
																).toLocaleString('id-ID')}
															</span>
														)}
													</label>
												)
											})}
									</div>
								)}
							</div>
						))}
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={handleClose}>
						Batal
					</Button>
					<Button
						size="sm"
						onClick={handleConfirm}
						disabled={!isValid || detailQuery.isLoading}
					>
						Tambahkan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
