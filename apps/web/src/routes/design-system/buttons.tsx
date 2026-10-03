import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { DownloadIcon, EditIcon, EyeIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { ActionMenu, LoadingButton, PageHeader, PageSection } from '@/components/shared'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

export const Route = createFileRoute('/design-system/buttons')({
	component: ButtonsPage,
})

const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const

function ButtonsPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Buttons & Actions"
				description="Interactive controls — buttons, badges, loading states, and action menus."
			/>

			{/* ─── BUTTONS ─── */}
			<PageSection
				title="Buttons"
				description="Variant × size. Icon-only buttons use the icon-* size scale (icon-xs/sm/default/lg)."
			>
				<div className="space-y-6">
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left">
							<thead>
								<tr>
									<th className="p-2 text-xs font-medium text-muted-foreground">Variant</th>
									<th className="p-2 text-xs font-medium text-muted-foreground">Default</th>
									<th className="p-2 text-xs font-medium text-muted-foreground">Small</th>
									<th className="p-2 text-xs font-medium text-muted-foreground">Large</th>
									<th className="p-2 text-xs font-medium text-muted-foreground">Disabled</th>
								</tr>
							</thead>
							<tbody>
								{BUTTON_VARIANTS.map((variant) => (
									<tr key={variant} className="border-t">
										<td className="p-2 text-xs text-muted-foreground capitalize">{variant}</td>
										<td className="p-2">
											<Button variant={variant}>Button</Button>
										</td>
										<td className="p-2">
											<Button variant={variant} size="sm">
												Button
											</Button>
										</td>
										<td className="p-2">
											<Button variant={variant} size="lg">
												Button
											</Button>
										</td>
										<td className="p-2">
											<Button variant={variant} disabled>
												Button
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">Icon-only</p>
						<div className="flex items-center gap-3">
							<Button size="icon-xs" variant="outline">
								<PlusIcon />
							</Button>
							<Button size="icon-sm" variant="outline">
								<PlusIcon />
							</Button>
							<Button size="icon" variant="outline">
								<PlusIcon />
							</Button>
							<Button size="icon-lg" variant="outline">
								<PlusIcon />
							</Button>
						</div>
					</div>

					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">With icon + label</p>
						<div className="flex flex-wrap gap-3">
							<Button size="sm">
								<PlusIcon className="size-3.5" />
								Add Material
							</Button>
							<Button size="sm" variant="outline">
								<DownloadIcon className="size-3.5" />
								Export
							</Button>
							<Button size="sm" variant="destructive">
								<TrashIcon className="size-3.5" />
								Delete
							</Button>
						</div>
					</div>
				</div>
			</PageSection>

			<Separator />

			{/* ─── BADGE ─── */}
			<PageSection
				title="Badge"
				description="Non-status labels — a type/category tag, a count. Use StatusBadge (see Data Display) for workflow states like Active/Pending/Cancelled."
			>
				<div className="flex flex-wrap items-center gap-3">
					<Badge>Default</Badge>
					<Badge variant="secondary">Secondary</Badge>
					<Badge variant="outline">Outline</Badge>
					<Badge variant="destructive">Destructive</Badge>
					<Badge variant="ghost">Ghost</Badge>
				</div>
			</PageSection>

			<Separator />

			{/* ─── LOADING BUTTON ─── */}
			<PageSection
				title="Loading Button"
				description="Button with a built-in loading/spinner state."
			>
				<div className="flex gap-3">
					<LoadingButton loading={false}>Save</LoadingButton>
					<LoadingButton loading={true}>Saving...</LoadingButton>
					<LoadingButton loading={true} variant="outline">
						Loading
					</LoadingButton>
				</div>
			</PageSection>

			<Separator />

			{/* ─── ACTION MENU ─── */}
			<PageSection
				title="Action Menu"
				description="Row-level actions dropdown — the standard pattern for a table row's trailing '...' menu."
			>
				<div className="flex items-center gap-4">
					<span className="text-sm">Coffee Beans (Arabica)</span>
					<ActionMenu
						items={[
							{ label: 'View', icon: <EyeIcon />, onClick: () => {} },
							{ label: 'Edit', icon: <EditIcon />, onClick: () => {} },
							{ label: 'Delete', icon: <TrashIcon />, onClick: () => {}, variant: 'destructive' },
						]}
					/>
				</div>
			</PageSection>

			<Separator />

			{/* ─── DROPDOWN MENU ─── */}
			<PageSection
				title="Dropdown Menu"
				description="The underlying primitive behind Action Menu, and the pattern used directly for the app header's user and location menus."
			>
				<DropdownMenu>
					<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
						Options
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuLabel>Material actions</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<EyeIcon className="size-3.5" />
							View
						</DropdownMenuItem>
						<DropdownMenuItem>
							<EditIcon className="size-3.5" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive">
							<TrashIcon className="size-3.5" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</PageSection>

			<Separator />

			{/* ─── PERMISSION GATE ─── */}
			<PageSection
				title="Permission Gate"
				description="Gates an action behind a permission check — renders nothing (not disabled) when denied. Used throughout list/detail pages instead of hand-rolled useHasPermission checks."
			>
				<PermissionGateDemo />
			</PageSection>
		</div>
	)
}

// -- Permission Gate demo (simulated — useAuth/useLocationContext only exist inside _authenticated) --
function PermissionGateDemo() {
	const [granted, setGranted] = useState(true)

	return (
		<div className="max-w-lg space-y-4">
			<label className="flex items-center gap-2 text-sm">
				<Switch checked={granted} onCheckedChange={setGranted} />
				Simulate &quot;material.create&quot; permission: {granted ? 'granted' : 'denied'}
			</label>
			<div className="flex items-center gap-3 rounded-lg border p-3">
				<span className="text-xs text-muted-foreground">Materials list toolbar →</span>
				{granted ? (
					<Button size="sm">
						<PlusIcon className="size-3.5" />
						Add Material
					</Button>
				) : (
					<span className="text-xs text-muted-foreground italic">
						(button hidden — PermissionGate renders nothing by default)
					</span>
				)}
			</div>
			<pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed">
				<code>{`<PermissionGate permission="material.create">
  <Button size="sm">Add Material</Button>
</PermissionGate>`}</code>
			</pre>
			<p className="text-xs text-muted-foreground">
				Not demoed with the real component here — usePermissionCheck reads useAuth()/
				useLocationContext(), which only exist inside the _authenticated route tree. The toggle
				above simulates the same gating behavior.
			</p>
		</div>
	)
}
