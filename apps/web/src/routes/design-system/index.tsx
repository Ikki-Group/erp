import { createFileRoute } from '@tanstack/react-router'

import { PageHeader, PageSection } from '@/components/shared'

import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/design-system/')({
	component: OverviewPage,
})

function OverviewPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Design System"
				description="Complete catalog of design tokens and reusable components used across the application. Pick a category from the left to see it live — in both themes."
			/>

			{/* ─── THEME TOKENS ─── */}
			<PageSection
				title="Theme Tokens"
				description="Semantic color pairs used across light and dark themes. Toggle the theme (top left) to verify contrast and state consistency."
			>
				<div className="space-y-6">
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<TokenSwatch name="Background" className="bg-background text-foreground" />
						<TokenSwatch name="Card" className="bg-card text-card-foreground" />
						<TokenSwatch name="Secondary" className="bg-secondary text-secondary-foreground" />
						<TokenSwatch name="Muted" className="bg-muted text-muted-foreground" />
						<TokenSwatch name="Primary" className="bg-primary text-primary-foreground" />
						<TokenSwatch name="Accent" className="bg-accent text-accent-foreground" />
						<TokenSwatch
							name="Accent Warm"
							className="bg-accent-warm text-accent-warm-foreground"
						/>
						<TokenSwatch name="Border" className="bg-border text-foreground" />
					</div>

					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">
							Status colors — base reads as text on light surfaces; -foreground is for solid fills.
						</p>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<TokenSwatch name="Success" className="bg-success/10 text-success" />
							<TokenSwatch name="Warning" className="bg-warning/10 text-warning" />
							<TokenSwatch name="Info" className="bg-info/10 text-info" />
							<TokenSwatch name="Destructive" className="bg-destructive/10 text-destructive" />
						</div>
					</div>

					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">
							Sidebar — deep charcoal-green in light mode; switches to warm-neutral (matching the
							page background) in dark mode so the two surfaces don&apos;t clash. Toggle the theme
							above to compare.
						</p>
						<div className="grid gap-3 rounded-lg bg-sidebar p-3 sm:grid-cols-2 lg:grid-cols-4">
							<TokenSwatch
								name="Sidebar"
								className="bg-sidebar text-sidebar-foreground ring-1 ring-sidebar-border"
							/>
							<TokenSwatch
								name="Sidebar Accent"
								className="bg-sidebar-accent text-sidebar-accent-foreground"
							/>
							<TokenSwatch
								name="Sidebar Primary"
								className="bg-sidebar-primary text-sidebar-primary-foreground"
							/>
							<TokenSwatch name="Invert" className="bg-invert text-invert-foreground" />
						</div>
					</div>

					<div>
						<p className="mb-2 text-xs font-medium text-muted-foreground">Chart palette</p>
						<div className="grid grid-cols-5 gap-3">
							<TokenSwatch name="Chart 1" className="bg-chart-1 text-white" />
							<TokenSwatch name="Chart 2" className="bg-chart-2 text-white" />
							<TokenSwatch name="Chart 3" className="bg-chart-3 text-white" />
							<TokenSwatch name="Chart 4" className="bg-chart-4 text-white" />
							<TokenSwatch name="Chart 5" className="bg-chart-5 text-foreground" />
						</div>
					</div>
				</div>
			</PageSection>

			<Separator />

			{/* ─── TYPOGRAPHY ─── */}
			<PageSection
				title="Typography"
				description="Five deliberate text tiers covering headings, titles, body, captions, and field labels — applied consistently everywhere. See docs/web/07-design-system.md."
			>
				<div className="max-w-xl space-y-5">
					<div className="space-y-0.5">
						<p className="font-heading text-lg font-semibold tracking-tight">
							Page title — text-lg font-semibold tracking-tight
						</p>
						<p className="text-xs text-muted-foreground">
							PageHeader, FormPage, WizardPage, NotFound — one per page
						</p>
					</div>
					<div className="space-y-0.5">
						<p className="font-heading text-sm font-semibold tracking-tight">
							Section / panel title — text-sm font-semibold tracking-tight
						</p>
						<p className="text-xs text-muted-foreground">
							PageSection, CardTitle, DialogTitle, FrameTitle, AlertTitle, DataCard, EmptyState,
							PageError
						</p>
					</div>
					<div className="space-y-0.5">
						<p className="text-sm">Body text — text-sm font-normal</p>
						<p className="text-xs text-muted-foreground">Paragraphs, table cells</p>
					</div>
					<div className="space-y-0.5">
						<p className="text-xs text-muted-foreground">
							Caption / meta — text-xs text-muted-foreground
						</p>
						<p className="text-xs text-muted-foreground">
							Descriptions under a title, field hints, timestamps
						</p>
					</div>
					<div className="space-y-0.5">
						<p className="text-sm font-medium">Field label — text-sm font-medium</p>
						<p className="text-xs text-muted-foreground">
							Field/FieldLegend — intentionally lighter than a title; never bumped to semibold
						</p>
					</div>
				</div>
			</PageSection>
		</div>
	)
}

function TokenSwatch({ name, className }: { name: string; className: string }) {
	return (
		<div className={`flex min-h-20 items-end rounded-lg border border-border p-3 ${className}`}>
			<span className="text-sm font-medium">{name}</span>
		</div>
	)
}
