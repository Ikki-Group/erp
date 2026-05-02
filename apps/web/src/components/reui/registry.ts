import React from 'react'

import type { ComponentRegistry } from '../registry'
import { DataGridCellPreview } from './data-grid/preview'

/**
 * REUI Atom Registry
 * ==================
 * Low-level, atomic UI components built on Base UI and TanStack Router.
 * These follow strict Product Design standards for Ikki ERP.
 */
export const reuiRegistry: ComponentRegistry = {
	layer: 'reui',
	title: 'REUI Atoms',
	description: 'Universal atomic components and data grid utilities built on Base UI.',
	readonly: true, // Mark as readonly since it is the core system
	components: [
		{
			name: 'Cell*',
			file: './data-grid/data-grid-cell',
			description:
				'Consistent cell components for data tables with predefined formatting and layout.',
			usage: 'Import individual cells: CellText, CellDate, CellCurrency, CellAction, etc.',
			importPath: '@/components/reui/data-grid/data-grid-cell',
			tags: ['table', 'cell', 'render', 'formatting', 'actions'],
			exports: [
				'CellText',
				'CellDate',
				'CellNumber',
				'CellCurrency',
				'CellLabelDesc',
				'CellLink',
				'CellAvatar',
				'CellBoolean',
				'CellAction',
				'CellActionLink',
				'CellActions',
				'CellMenu',
				'CellMenuItem',
				'CellBadgeGroup',
				'CellProgress',
				'CellTrend',
			],
			preview: () => React.createElement(DataGridCellPreview),
		},
	],
}
