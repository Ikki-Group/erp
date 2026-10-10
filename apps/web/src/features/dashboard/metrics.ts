import type { InventoryLocationSummaryDto } from './api.ts'

export type MetricKey = keyof Pick<
	InventoryLocationSummaryDto,
	'lowStockCount' | 'negativeStockCount' | 'transfersInTransit' | 'activeOpname' | 'draftReceivings'
>

/** The list each count drills into, pre-filtered to what the count measures. */
export type MetricTarget =
	| { to: '/inventory/stock'; search: { status: 'low' | 'negative' } }
	| { to: '/inventory/transfers'; search: { status: 'in_transit' } }
	| { to: '/inventory/opname' }
	| { to: '/inventory/receiving'; search: { status: 'draft' } }

export interface MetricDef {
	key: MetricKey
	label: string
	/** Non-zero tone; zero always renders muted. */
	tone: 'warning' | 'destructive' | 'default'
	target: MetricTarget
}

export const METRICS: MetricDef[] = [
	{
		key: 'lowStockCount',
		label: 'Stok menipis',
		tone: 'warning',
		target: { to: '/inventory/stock', search: { status: 'low' } },
	},
	{
		key: 'negativeStockCount',
		label: 'Stok minus',
		tone: 'destructive',
		target: { to: '/inventory/stock', search: { status: 'negative' } },
	},
	{
		key: 'transfersInTransit',
		label: 'Transfer berjalan',
		tone: 'default',
		target: { to: '/inventory/transfers', search: { status: 'in_transit' } },
	},
	{
		key: 'activeOpname',
		label: 'Opname aktif',
		tone: 'default',
		target: { to: '/inventory/opname' },
	},
	{
		key: 'draftReceivings',
		label: 'Penerimaan draft',
		tone: 'default',
		target: { to: '/inventory/receiving', search: { status: 'draft' } },
	},
]

/** The four counts shown in the mobile 2×2 grid; negative stock is flagged inline instead. */
export const PRIMARY_METRICS = METRICS.filter((m) => m.key !== 'negativeStockCount')
export const NEGATIVE_METRIC = METRICS.find((m) => m.key === 'negativeStockCount')!

export const TONE_CLASS: Record<MetricDef['tone'], string> = {
	warning: 'text-warning',
	destructive: 'text-destructive',
	default: 'text-foreground',
}
