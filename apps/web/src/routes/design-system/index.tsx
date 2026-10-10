import { createFileRoute } from '@tanstack/react-router'

import { PageHeader, PageSection } from '@/components/shared'

import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/design-system/')({
	component: OverviewPage,
})

/** Token names exactly as declared in styles.css (`:root` + `.dark`). Swatches read `var(--name)`, so they always match the live theme. */
const TOKEN_GROUPS: readonly { label: string; note?: string; tokens: readonly string[] }[] = [
	{
		label: 'Surfaces & text',
		tokens: [
			'background',
			'foreground',
			'card',
			'popover',
			'muted',
			'muted-foreground',
			'placeholder',
			'secondary',
			'border',
			'input',
		],
	},
	{
		label: 'Accent',
		note: 'Forest green is the one accent: primary actions, active state, focus.',
		tokens: ['primary', 'primary-foreground', 'accent', 'accent-foreground', 'ring'],
	},
	{
		label: 'Status',
		note: 'Base token as text on a /10 wash; -foreground only on a solid fill.',
		tokens: ['success', 'warning', 'info', 'destructive'],
	},
	{
		label: 'Sidebar & invert',
		tokens: ['sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-accent', 'invert'],
	},
	{
		label: 'Warm & chart',
		note: 'accent-warm is incidental warmth, never an action or status color.',
		tokens: ['accent-warm', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
	},
]

function OverviewPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Design System"
				description="The catalog of tokens and components the app actually uses. apps/web/DESIGN.md is the visual authority; this page renders it live. Switch Light / Dark / System from the theme menu."
			/>

			<PageSection
				title="Color tokens"
				description="Each swatch paints var(--token) from styles.css, so it reflects the active theme."
			>
				<div className="space-y-6">
					{TOKEN_GROUPS.map((group) => (
						<div key={group.label} className="space-y-2">
							<div className="space-y-0.5">
								<h3 className="text-xs font-medium">{group.label}</h3>
								{group.note && <p className="text-xs text-muted-foreground">{group.note}</p>}
							</div>
							<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
								{group.tokens.map((token) => (
									<li key={token} className="space-y-1.5">
										<div
											className="h-12 rounded-md border"
											style={{ backgroundColor: `var(--${token})` }}
										/>
										<p className="font-mono text-xs text-muted-foreground">--{token}</p>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</PageSection>

			<Separator />

			<PageSection
				title="Radius & elevation"
				description="Four radius steps plus full for pills. Inline surfaces get one hairline border; shadow only on floating surfaces, paired with ring-1 ring-foreground/10."
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{(['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl'] as const).map((r) => (
						<div key={r} className={`flex h-16 items-end border bg-card p-2 ${r}`}>
							<span className="font-mono text-xs text-muted-foreground">{r}</span>
						</div>
					))}
					<div className="flex h-16 items-end rounded-lg bg-popover p-2 shadow-md ring-1 ring-foreground/10">
						<span className="font-mono text-xs text-muted-foreground">floating (popover)</span>
					</div>
				</div>
			</PageSection>

			<Separator />

			<PageSection
				title="Typography"
				description="Geist Variable throughout. Weight caps at font-semibold; titles are semibold + tracking-tight at their tier's size."
			>
				<div className="max-w-xl space-y-5">
					<div className="space-y-0.5">
						<p className="font-heading text-lg font-semibold tracking-tight">Page title</p>
						<p className="font-mono text-xs text-muted-foreground">
							text-lg font-semibold tracking-tight · PageHeader, FormPage, WizardPage
						</p>
					</div>
					<div className="space-y-0.5">
						<p className="font-heading text-sm font-semibold tracking-tight">
							Section / panel title
						</p>
						<p className="font-mono text-xs text-muted-foreground">
							text-sm font-semibold tracking-tight · PageSection, CardTitle, MetricCard panel
						</p>
					</div>
					<div className="space-y-0.5">
						<p className="text-sm">Body text for paragraphs and table cells.</p>
						<p className="font-mono text-xs text-muted-foreground">text-sm / text-xs relaxed</p>
					</div>
					<div className="space-y-0.5">
						<p className="text-sm font-medium">Field label</p>
						<p className="font-mono text-xs text-muted-foreground">font-medium · never semibold</p>
					</div>
					<div className="space-y-0.5">
						<p className="font-mono text-sm text-muted-foreground">MAT-001 · TRF-STORE-01-0042</p>
						<p className="font-mono text-xs text-muted-foreground">
							identifiers: font-mono, muted when secondary
						</p>
					</div>
					<div className="max-w-xs space-y-1">
						<Input
							placeholder="Placeholder uses --placeholder (≥4.5:1)"
							aria-label="Placeholder sample"
						/>
					</div>
				</div>
			</PageSection>
		</div>
	)
}
