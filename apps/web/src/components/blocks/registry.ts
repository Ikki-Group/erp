import type { ComponentRegistry } from '../registry'

/**
 * Blocks Registry
 * ================
 * Composable UI blocks that are reusable across features.
 * These are more complex than atoms (ui/reui) but not tied to business domains.
 *
 * AI: Check this registry before building any new "shared" component.
 *     If a component fits here (not feature-specific, not an atom), add it to blocks.
 *
 * Sub-groups:
 * - data-display: Components for presenting data (badges, lists, cards)
 * - feedback: User feedback components (empty states, loading, errors, confirmations)
 * - card: Card-based layout patterns for wrapping content
 * - brand: Branding assets (logo, icons)
 * - patterns: Pre-assembled UI patterns (complex data grids, dialogs)
 */
export const blocksRegistry: ComponentRegistry = {
	layer: 'blocks',
	title: 'Blocks',
	description:
		'Composable, feature-agnostic UI blocks. Organized into sub-groups: data-display, feedback, card, brand, patterns.',
	readonly: false,
	components: [
		// ── data-display ────────────────────────────────────────────────────
		{
			name: 'StatusBadge',
			file: './data-display/status-badge',
			description:
				'Generic status badge driven by a status map config. Supports dot indicators and variant styling. Includes `createStatusBadge` factory for presets.',
			usage:
				'Define a `StatusMap` for your domain, then use `<StatusBadge status={value} statusMap={map} />`. Or create a preset with `createStatusBadge(map)` for zero-config usage.',
			importPath: '@/components/blocks/data-display/status-badge',
			tags: ['badge', 'status', 'active', 'inactive', 'factory', 'preset'],
			exports: [
				'StatusBadge',
				'createStatusBadge',
				'ActiveStatusBadge',
				'activeStatusMap',
				'toActiveStatus',
			],
		},
		{
			name: 'BadgeDot',
			file: './data-display/badge-dot',
			description: 'Simple colored dot indicator badge for inline status representation.',
			usage:
				'Use for compact status indicators in tables or lists where a full badge is too heavy.',
			importPath: '@/components/blocks/data-display/badge-dot',
			tags: ['badge', 'dot', 'indicator', 'compact', 'status'],
			exports: ['BadgeDot'],
		},
		{
			name: 'DataList',
			file: './data-display/data-list',
			description: 'Key-value list component for displaying structured data in label-value pairs.',
			usage:
				'Use in detail pages or side panels to display entity attributes. Pass an array of `{ label, value }` items.',
			importPath: '@/components/blocks/data-display/data-list',
			tags: ['key-value', 'list', 'detail', 'attributes'],
			exports: ['DataList'],
		},
		{
			name: 'DescriptionList',
			file: './data-display/description-list',
			description: 'Semantic description list (dl/dt/dd) for detailed entity information.',
			usage:
				'Use for detail pages when you need a more semantic HTML structure. Prefer DataList for simpler cases.',
			importPath: '@/components/blocks/data-display/description-list',
			tags: ['description', 'detail', 'semantic', 'dl'],
			exports: ['DescriptionList'],
		},
		{
			name: 'DetailCard',
			file: './data-display/detail-card',
			description:
				'Card wrapper that combines a card header with a DescriptionList body for entity detail views.',
			usage:
				'Use on detail pages: `<DetailCard title="Info" items={[...]} />`. Automatically renders key-value pairs inside a card.',
			importPath: '@/components/blocks/data-display/detail-card',
			tags: ['card', 'detail', 'description', 'entity'],
			exports: ['DetailCard'],
		},
		{
			name: 'ChartCard',
			file: './data-display/chart-card',
			description:
				'Card-based chart container with title, footer content, and responsive grid wrapper.',
			usage:
				'Use `<ChartGrid>` for dashboard layouts, `<ChartCard>` to wrap individual Recharts charts with title and metadata.',
			importPath: '@/components/blocks/data-display/chart-card',
			tags: ['chart', 'card', 'dashboard', 'recharts', 'grid'],
			exports: ['ChartCard', 'ChartFooterContent', 'ChartGrid'],
		},

		// ── feedback ────────────────────────────────────────────────────────
		{
			name: 'EmptyState',
			file: './feedback/empty-state',
			description:
				'Placeholder shown when a list or table has no data. Supports icon, title, description, and an action button.',
			usage:
				'Use when query returns empty results: `<EmptyState icon={BoxIcon} title="No items" action={<Button>Create</Button>} />`.',
			importPath: '@/components/blocks/feedback/empty-state',
			tags: ['empty', 'placeholder', 'no-data', 'zero-state'],
			exports: ['EmptyState'],
		},
		{
			name: 'ConfirmDialog',
			file: './feedback/confirm-dialog',
			description:
				'Imperative confirmation dialog using `react-call`. Supports destructive, warning, and default variants.',
			usage:
				'Call imperatively: `await ConfirmDialog({ title: "Delete?", variant: "destructive", onConfirm: handleDelete })`. Must have `<ConfirmDialog.Root />` in the app tree.',
			importPath: '@/components/blocks/feedback/confirm-dialog',
			tags: ['confirm', 'dialog', 'modal', 'imperative', 'delete', 'destructive'],
			exports: ['ConfirmDialog'],
		},
		{
			name: 'LoadingPage',
			file: './feedback/loading-page',
			description: 'Full-page loading spinner used as a pending/fallback component.',
			usage:
				'Use in route `pendingComponent` or `<Suspense fallback={<LoadingPage />}>`. Already integrated in AppLayout.',
			importPath: '@/components/blocks/feedback/loading-page',
			tags: ['loading', 'spinner', 'pending', 'suspense'],
			exports: ['LoadingPage'],
		},
		{
			name: 'ErrorBoundary',
			file: './feedback/ErrorBoundary',
			description: 'React error boundary with fallback UI for catching render errors.',
			usage: 'Wrap feature sections that may throw. Already integrated at root level via Sentry.',
			importPath: '@/components/blocks/feedback/ErrorBoundary',
			tags: ['error', 'boundary', 'catch', 'fallback'],
			exports: ['ErrorBoundary'],
		},
		{
			name: 'ErrorPages (NotFoundPage, ForbiddenPage, etc.)',
			file: './feedback/error-pages',
			description: 'Pre-styled error pages for 404, 403, and generic error states.',
			usage: 'Use in route error handlers: `errorComponent: () => <NotFoundPage />`.',
			importPath: '@/components/blocks/feedback/error-pages',
			tags: ['error', '404', '403', 'not-found', 'forbidden', 'page'],
			exports: ['NotFoundPage', 'ForbiddenPage', 'ErrorPage'],
		},

		// ── card ────────────────────────────────────────────────────────────
		{
			name: 'DataTableCard',
			file: './card/data-table-card',
			description:
				'Standard card-wrapped data table with header, toolbar slot, scrollable table body, and pagination footer.',
			usage:
				'The standard pattern for list pages. Pass a TanStack Table instance, toolbar, and action: `<DataTableCard title="Products" table={table} toolbar={...} action={...} />`.',
			importPath: '@/components/blocks/card/data-table-card',
			tags: ['card', 'table', 'list-page', 'standard', 'pagination'],
			exports: ['DataTableCard'],
		},
		{
			name: 'CardSection',
			file: './card/card-section',
			description: 'Simple card with a title header and content body for grouping related content.',
			usage: 'Use inside form or detail pages to visually group related fields or information.',
			importPath: '@/components/blocks/card/card-section',
			tags: ['card', 'section', 'group'],
			exports: ['CardSection'],
		},
		{
			name: 'CardStat',
			file: './card/card-stat',
			description: 'Stat card displaying a metric value with label and optional trend indicator.',
			usage:
				'Use in dashboard pages for KPI display: `<CardStat label="Revenue" value="Rp 1.2M" trend="+12%" />`.',
			importPath: '@/components/blocks/card/card-stat',
			tags: ['card', 'stat', 'metric', 'kpi', 'dashboard'],
			exports: ['CardStat'],
		},

		// ── brand ───────────────────────────────────────────────────────────
		{
			name: 'IkkiLogo',
			file: './brand/logo',
			description: 'Official Ikki brand logo component.',
			usage: 'Used in sidebar header and login pages. Import when rendering brand identity.',
			importPath: '@/components/blocks/brand/logo',
			tags: ['logo', 'brand', 'identity', 'ikki'],
			exports: ['IkkiLogo'],
		},
	],
}
