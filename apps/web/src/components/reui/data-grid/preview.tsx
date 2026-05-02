import {
	EyeIcon,
	PencilIcon,
	Trash2Icon,
	UserIcon,
	ShoppingCartIcon,
	SettingsIcon,
	LogOutIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
	CellLabelDesc,
	CellText,
	CellDate,
	CellCurrency,
	CellAvatar,
	CellBoolean,
	CellTrend,
	CellProgress,
	CellAction,
	CellActionLink,
	CellActions,
	CellMenu,
	type CellMenuItem,
} from './data-grid-cell'

export function DataGridCellPreview() {
	return (
		<div className="space-y-8 p-4 bg-muted/30 rounded-xl border">
			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Label & Description</h3>
				<div className="grid grid-cols-2 gap-4">
					<div className="p-3 bg-background rounded-lg border">
						<CellLabelDesc label="Apple iPhone 15 Pro" desc="SKU: APP-IPH15P-256-GRY" />
					</div>
					<div className="p-3 bg-background rounded-lg border">
						<CellLabelDesc label="Rizqy Nugroho" desc="rizqy@ikki.group" />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Common Data Types</h3>
				<div className="grid grid-cols-3 gap-4">
					<div className="p-3 bg-background rounded-lg border space-y-1">
						<p className="text-[10px] text-muted-foreground uppercase font-bold">Text (Fallback)</p>
						<CellText value="" />
					</div>
					<div className="p-3 bg-background rounded-lg border space-y-1">
						<p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
						<CellDate value={new Date()} />
					</div>
					<div className="p-3 bg-background rounded-lg border space-y-1">
						<p className="text-[10px] text-muted-foreground uppercase font-bold">Currency</p>
						<CellCurrency value={12500000} />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Avatars & Booleans</h3>
				<div className="flex items-center gap-8 bg-background p-4 rounded-lg border">
					<CellAvatar
						label="Jaka Sembung"
						desc="Software Engineer"
						fallback="JS"
						src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jaka"
					/>
					<div className="flex items-center gap-2">
						<span className="text-sm">Verified:</span>
						<CellBoolean value={true} />
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm">Banned:</span>
						<CellBoolean value={false} />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Performance & Trends</h3>
				<div className="grid grid-cols-2 gap-4">
					<Card>
						<CardHeader className="py-3 px-4">
							<CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-4 flex items-center justify-between">
							<CellTrend value="12.5%" trend="up" />
							<CellTrend value="3.2%" trend="down" />
							<CellTrend value="8.4%" trend="up" reverse />
						</CardContent>
					</Card>
					<div className="p-4 bg-background rounded-lg border flex items-center justify-center">
						<CellProgress value={75} label="Storage" />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Action Cells</h3>
				<div className="flex gap-4 p-4 bg-background rounded-lg border">
					<CellActions>
						<CellAction
							icon={<UserIcon className="size-3.5" />}
							label="Profile"
							onClick={() => {}}
						/>
						<CellAction
							icon={<ShoppingCartIcon className="size-3.5" />}
							label="Cart"
							variant="default"
							onClick={() => {}}
						/>
						<CellAction
							icon={<SettingsIcon className="size-3.5" />}
							size="icon-sm"
							onClick={() => {}}
						/>
						<CellAction
							icon={<LogOutIcon className="size-3.5" />}
							variant="destructive"
							size="icon-sm"
							onClick={() => {}}
						/>
					</CellActions>
					<div className="h-8 w-px bg-border" />
					<CellActionLink to="/" label="Go Home" variant="link" />
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Menu / Dropdown</h3>
				<div className="flex gap-4 p-4 bg-background rounded-lg border">
					<CellMenu
						items={[
							{
								type: 'link',
								label: 'Lihat Detail',
								icon: <EyeIcon className="size-3.5" />,
								to: '/',
							},
							{
								type: 'button',
								label: 'Edit',
								icon: <PencilIcon className="size-3.5" />,
								onClick: () => {},
							},
							{ type: 'separator' },
							{
								type: 'button',
								label: 'Hapus',
								icon: <Trash2Icon className="size-3.5" />,
								variant: 'destructive',
								onClick: () => {},
							},
						]}
					/>
				</div>
			</section>
		</div>
	)
}
