import { createFileRoute, Link } from '@tanstack/react-router'

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
				description="Warm Precision: a quiet, information-dense toolkit for inventory and finance. Working examples use illustrative data, never live business records."
			/>
			<nav
				aria-label="Foundation sections"
				className="flex flex-wrap gap-x-5 gap-y-2 border-b pb-4 text-sm"
			>
				{[
					['Choose a component', 'component-guide'],
					['ERP patterns', 'erp-patterns'],
					['Density & interaction', 'density'],
					['Theme tokens', 'theme-tokens'],
					['Typography', 'typography'],
				].map(([label, id]) => (
					<a
						key={id}
						href={`#${id}`}
						className="inline-flex items-center py-1 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
					>
						{label}
					</a>
				))}
			</nav>

			<PageSection
				id="component-guide"
				title="Choose a component"
				description="Start with the user's task, then choose the smallest component that supports it."
			>
				<dl className="divide-y text-sm">
					{[
						{
							task: 'Find and compare records',
							to: '/design-system/tables',
							label: 'DataTable + TableToolbar',
							note: 'Search, filters, sorting, and pagination. Use a simple table for a small editable set.',
						},
						{
							task: 'Enter quantities and amounts',
							to: '/design-system/forms',
							label: 'Form fields',
							note: 'Keep quantity and unit distinct. Use CurrencyField for amounts, not an unformatted text input.',
						},
						{
							task: 'Explain state and recovery',
							to: '/design-system/feedback',
							label: 'EmptyState, PageError, InlineAlert',
							note: 'Distinguish no records from no matches. Keep entered work and offer a clear recovery action.',
						},
						{
							task: 'Review a consequential action',
							to: '/design-system/overlays',
							label: 'Confirm + FormDialog',
							note: 'Confirm irreversible actions. Use a full page for complex forms; a dialog for one focused task.',
						},
					].map((item) => (
						<div
							key={item.task}
							className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
						>
							<dt className="font-medium">{item.task}</dt>
							<dd>
								<Link
									to={item.to}
									className="inline-flex items-center text-primary underline underline-offset-4 pointer-coarse:min-h-11"
								>
									{item.label}
								</Link>
								<p className="mt-1 max-w-prose text-xs text-muted-foreground">{item.note}</p>
							</dd>
						</div>
					))}
				</dl>
			</PageSection>

			<PageSection
				id="erp-patterns"
				title="ERP patterns"
				description="Compose the same primitives around the operational task. These are implementation recipes, not simulated transactions."
			>
				<div className="divide-y rounded-lg border px-4">
					{[
						{
							title: 'Entity list',
							body: 'PageHeader → TableToolbar → DataTable. Keep search and filters available during loading or failure. Show record-empty, filtered-empty, loading, and retry states separately.',
							to: '/design-system/tables',
							hash: 'data-table',
							link: 'Try the complete list example',
						},
						{
							title: 'Receiving',
							body: 'FormPage with supplier, destination location, date, and material rows. Pair each quantity with a UOM and each cost with CurrencyField. Keep validation beside the field and retain rows after a failed save.',
							to: '/design-system/forms',
							hash: '',
							link: 'Try quantity, UOM, and validation fields',
						},
						{
							title: 'Transfer review',
							body: 'Keep source and destination locations visible with the material quantities. Explain stock consequences before approval. A failed confirmation must offer both Try Again and Cancel.',
							to: '/design-system/overlays',
							hash: 'confirm',
							link: 'Try async confirmation and recovery',
						},
						{
							title: 'Stock count',
							body: 'Use a simple editable table: material, UOM, recorded quantity, counted quantity, variance. Empty means not counted; zero is a deliberate count. Right-align quantities and keep audit context with the review.',
							to: '/design-system/tables',
							hash: 'simple-table',
							link: 'Inspect the simple table pattern',
						},
					].map((item) => (
						<details key={item.title} className="py-3">
							<summary className="cursor-pointer rounded-sm py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11">
								{item.title}
							</summary>
							<p className="mt-2 max-w-prose text-sm text-muted-foreground">{item.body}</p>
							<Link
								to={item.to}
								hash={item.hash}
								className="mt-2 inline-flex items-center text-sm text-primary underline underline-offset-4 pointer-coarse:min-h-11"
							>
								{item.link}
							</Link>
						</details>
					))}
				</div>
			</PageSection>

			<PageSection
				id="density"
				title="Density & interaction"
				description="One system, two input contexts. Compact desktop controls expand automatically for coarse pointers, including phones and touch tablets."
			>
				<div className="grid gap-6 sm:grid-cols-2">
					<div className="space-y-2">
						<h3 className="text-sm font-semibold tracking-tight">Compact desktop</h3>
						<p className="max-w-prose text-sm text-muted-foreground">
							Keep dense tables and 28px default controls for precise mouse and keyboard use. Use
							one primary action per task, with secondary actions quieter.
						</p>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-semibold tracking-tight">Comfortable touch</h3>
						<p className="max-w-prose text-sm text-muted-foreground">
							Use at least 44px control targets without overlapping hit areas. Let toolbars wrap,
							keep charts within their cards, and scroll wide tables explicitly.
						</p>
					</div>
				</div>
				<p className="max-w-prose text-xs text-muted-foreground">
					Every control needs a visible focus state and an accessible name. Every form field needs a
					unique label association and linked hints/errors. Never communicate status through color
					alone.
				</p>
			</PageSection>

			{/* ─── THEME TOKENS ─── */}
			<PageSection
				id="theme-tokens"
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
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
							{['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'].map(
								(color, index) => (
									<div key={color} className="overflow-hidden rounded-lg border bg-card">
										<div className={`h-12 ${color}`} />
										<p className="p-2 text-xs text-card-foreground">Chart {index + 1}</p>
									</div>
								),
							)}
						</div>
					</div>
				</div>
			</PageSection>

			<Separator />

			{/* ─── TYPOGRAPHY ─── */}
			<PageSection
				id="typography"
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
