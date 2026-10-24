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
					<p className="max-w-2xl text-sm text-muted-foreground">
						Use one primary action per task. Keep supporting actions outline or ghost, and reserve
						destructive for irreversible changes. Name icon-only actions with an accessible label.
						Desktop controls stay compact; coarse pointers get at least 44px targets in every size.
					</p>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left">
							<caption className="sr-only">Button variants, sizes, and disabled states</caption>
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
							<Button size="icon-xs" variant="outline" aria-label="Add material (extra small)">
								<PlusIcon />
							</Button>
							<Button size="icon-sm" variant="outline" aria-label="Add material (small)">
								<PlusIcon />
							</Button>
							<Button size="icon" variant="outline" aria-label="Add material (default)">
								<PlusIcon />
							</Button>
							<Button size="icon-lg" variant="outline" aria-label="Add material (large)">
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
				description="Keep the action label stable, prevent duplicate submissions, and announce the outcome. This example copies code to your clipboard; it does not save business data."
			>
				<LoadingButtonDemo />
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

const BUTTON_EXAMPLE = '<Button variant="outline" size="sm">Export</Button>'

function LoadingButtonDemo() {
	const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')

	async function copyExample() {
		setStatus('copying')
		try {
			await navigator.clipboard.writeText(BUTTON_EXAMPLE)
			setStatus('copied')
		} catch {
			setStatus('error')
		}
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-3">
				<LoadingButton loading={status === 'copying'} onClick={copyExample}>
					Copy button example
				</LoadingButton>
				<LoadingButton loading variant="outline">
					Loading state reference
				</LoadingButton>
			</div>
			<p role="status" className="text-xs text-muted-foreground">
				{status === 'copied'
					? 'Button example copied. Paste it into your editor.'
					: status === 'error'
						? 'Clipboard access was blocked. Select and copy the example below.'
						: status === 'copying'
							? 'Copying the button example to your clipboard.'
							: 'Copy a ready-to-use button example.'}
			</p>
			<pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
				<code>{BUTTON_EXAMPLE}</code>
			</pre>
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
