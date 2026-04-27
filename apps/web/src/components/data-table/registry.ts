import type { ComponentRegistry } from '../registry'

/**
 * Data Table Engine Registry
 * ===========================
 * Complete data table system built on TanStack Table.
 * Handles columns, pagination, sorting, filtering, and toolbar rendering.
 *
 * AI: Use the Data Table Engine for any tabular data display.
 *     Pair with `DataTableCard` from blocks/card for the standard card-wrapped table pattern.
 */
export const dataTableRegistry: ComponentRegistry = {
	layer: 'data-table',
	title: 'Data Table Engine',
	description:
		'Server-side paginated data table system built on TanStack Table. Provides hooks, context, pagination, toolbar, and column helpers.',
	readonly: false,
	components: [
		{
			name: 'DataTable',
			file: './data-table',
			description:
				'Core data table component that renders a TanStack Table instance with the standard table layout.',
			usage:
				'Prefer using `DataTableCard` from blocks for the standard card-wrapped pattern. Use this directly only for custom layouts.',
			importPath: '@/components/data-table',
			tags: ['table', 'core', 'render'],
			exports: ['DataTable'],
		},
		{
			name: 'useDataTable',
			file: './use-data-table',
			description:
				'Hook that creates a configured TanStack Table instance from columns, data, and pagination state.',
			usage:
				'Call in feature components: `const table = useDataTable({ columns, data, pageCount, rowCount, ds })`.',
			importPath: '@/components/data-table/use-data-table',
			tags: ['hook', 'table', 'instance', 'pagination'],
			exports: ['useDataTable'],
		},
		{
			name: 'useDataTableState',
			file: './use-data-table-state',
			description:
				'Hook managing URL-synced table state: search, pagination, sorting, and filters.',
			usage:
				'Use as the first step in any table page: `const ds = useDataTableState<FilterDto>()`. Pass `ds` to `useDataTable` and `DataGridFilter`.',
			importPath: '@/components/data-table/use-data-table-state',
			tags: ['hook', 'state', 'url', 'search', 'pagination', 'filters'],
			exports: ['useDataTableState'],
		},
		{
			name: 'DataTableColumnHeader',
			file: './data-table-column-header',
			description: 'Sortable column header component with sort direction indicators.',
			usage: 'Use inside column definitions for sortable headers.',
			importPath: '@/components/data-table/data-table-column-header',
			tags: ['column', 'header', 'sort'],
			exports: ['DataTableColumnHeader'],
		},
		{
			name: 'DataTablePagination',
			file: './data-table-pagination',
			description:
				'Pagination controls with page size selector, page navigation, and record count display.',
			usage: 'Already integrated in DataTableCard. Use directly only for custom table layouts.',
			importPath: '@/components/data-table/data-table-pagination',
			tags: ['pagination', 'page-size', 'navigation'],
			exports: ['DataTablePagination'],
		},
		{
			name: 'DataTableToolbar',
			file: './data-table-toolbar',
			description: 'Toolbar container with search input and column visibility toggles.',
			usage:
				'Use for tables needing built-in search and column visibility. For advanced filtering, use DataGridFilter from reui instead.',
			importPath: '@/components/data-table/data-table-toolbar',
			tags: ['toolbar', 'search', 'column-toggle'],
			exports: ['DataTableToolbar'],
		},
		{
			name: 'FilterBar',
			file: './filter-bar',
			description: 'Advanced filter bar with dynamic filter chips and clear functionality.',
			usage:
				'Use for complex filtering scenarios. For standard table filtering, prefer DataGridFilter from reui.',
			importPath: '@/components/data-table/filter-bar',
			tags: ['filter', 'chips', 'advanced'],
			exports: ['FilterBar'],
		},
	],
}
