import { UserIcon, ShoppingCartIcon, SettingsIcon, LogOutIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { DataGridCell } from './data-grid-cell'

export function DataGridCellPreview() {
	return (
		<div className="space-y-8 p-4 bg-muted/30 rounded-xl border">
			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Label & Description</h3>
				<div className="grid grid-cols-2 gap-4">
					<div className="p-3 bg-background rounded-lg border">
						<DataGridCell.LabelAndDesc label="Apple iPhone 15 Pro" desc="SKU: APP-IPH15P-256-GRY" />
					</div>
					<div className="p-3 bg-background rounded-lg border">
						<DataGridCell.LabelAndDesc label="Rizqy Nugroho" desc="rizqy@ikki.group" />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Common Data Types</h3>
				<div className="grid grid-cols-3 gap-4">
					<div className="p-3 bg-background rounded-lg border space-y-1">
						<p className="text-[10px] text-muted-foreground uppercase font-bold">Text (Fallback)</p>
						<DataGridCell.Text value="" />
					</div>
					<div className="p-3 bg-background rounded-lg border space-y-1">
						<p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
						<DataGridCell.Date value={new Date()} />
					</div>
					<div className="p-3 bg-background rounded-lg border space-y-1">
						<p className="text-[10px] text-muted-foreground uppercase font-bold">Currency</p>
						<DataGridCell.Currency value={12500000} />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Status & Badges</h3>
				<div className="flex flex-wrap gap-4">
					<DataGridCell.Status label="Active" variant="success" />
					<DataGridCell.Status label="Pending" variant="warning" />
					<DataGridCell.Status label="Error" variant="destructive" />
					<DataGridCell.Status label="Archived" variant="secondary" />
					<DataGridCell.BadgeGroup
						values={['Premium', 'Trial', 'New', 'Featured', 'Limited']}
						max={3}
					/>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Avatars & Booleans</h3>
				<div className="flex items-center gap-8 bg-background p-4 rounded-lg border">
					<DataGridCell.Avatar
						label="Jaka Sembung"
						desc="Software Engineer"
						fallback="JS"
						src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jaka"
					/>
					<div className="flex items-center gap-2">
						<span className="text-sm">Verified:</span>
						<DataGridCell.Boolean value={true} />
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm">Banned:</span>
						<DataGridCell.Boolean value={false} />
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
							<DataGridCell.Trend value="12.5%" trend="up" />
							<DataGridCell.Trend value="3.2%" trend="down" />
							<DataGridCell.Trend value="8.4%" trend="up" reverse />
						</CardContent>
					</Card>
					<div className="p-4 bg-background rounded-lg border flex items-center justify-center">
						<DataGridCell.Progress value={75} label="Storage" />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h3 className="text-lg font-bold border-b pb-2">Action Cells</h3>
				<div className="flex gap-4 p-4 bg-background rounded-lg border">
					<DataGridCell.Actions>
						<DataGridCell.Action
							type="button"
							icon={<UserIcon className="size-3.5" />}
							label="Profile"
							onClick={() => {}}
						/>
						<DataGridCell.Action
							type="button"
							icon={<ShoppingCartIcon className="size-3.5" />}
							label="Cart"
							variant="default"
							onClick={() => {}}
						/>
						<DataGridCell.Action
							type="button"
							icon={<SettingsIcon className="size-3.5" />}
							size="icon-sm"
							onClick={() => {}}
						/>
						<DataGridCell.Action
							type="button"
							icon={<LogOutIcon className="size-3.5" />}
							variant="destructive"
							size="icon-sm"
							onClick={() => {}}
						/>
					</DataGridCell.Actions>
					<div className="h-8 w-px bg-border" />
					<DataGridCell.Action type="link" to="/" label="Go Home" variant="link" />
				</div>
			</section>
		</div>
	)
}
