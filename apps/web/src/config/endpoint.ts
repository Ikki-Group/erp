function p(base: string, ...sub: string[]) {
	return [base, ...sub].filter(Boolean).join('/')
}

function crud(base: string) {
	return {
		list: p(base, 'list'),
		detail: p(base, 'detail'),
		create: p(base, 'create'),
		update: p(base, 'update'),
		remove: p(base, 'remove'),
	}
}

const auth = { login: 'auth/login', me: 'auth/me' }

const audit = {
	log: {
		list: 'audit/audit-log/list',
		detail: 'audit/audit-log/detail',
		create: 'audit/audit-log/create',
	},
}

const company = {
	settings: {
		get: 'company/settings/',
		detail: 'company/settings/detail',
		create: 'company/settings/create',
		update: 'company/settings/update',
	},
}

const iam = {
	user: {
		...crud('iam/user'),
		changePassword: 'iam/user/change-password',
		adminPasswordReset: 'iam/user/admin/password-reset',
	},
	role: crud('iam/role'),
	assignment: {
		list: 'iam/assignment/list',
		assign: 'iam/assignment/assign',
		assignBulk: 'iam/assignment/assign-bulk',
		updateRoleBulk: 'iam/assignment/update-role-bulk',
		remove: 'iam/assignment/remove',
		removeBulk: 'iam/assignment/remove-bulk',
	},
}

const location = crud('location')

const material = {
	...crud('material'),
	category: crud('material/category'),
	uom: crud('material/uom'),
	location: {
		assign: 'material/location/assign',
		unassign: 'material/location/unassign',
		byMaterial: 'material/location/by-material',
		stock: 'material/location/stock',
		config: 'material/location/config',
	},
}

const product = {
	...crud('product'),
	category: crud('product/category'),
}

const recipe = crud('recipe')

const inventory = {
	summary: {
		byLocation: 'inventory/summary/by-location',
		ledger: 'inventory/summary/ledger',
		generate: 'inventory/summary/generate',
		remove: 'inventory/summary/remove',
	},
	transaction: {
		list: 'inventory/transaction/list',
		detail: 'inventory/transaction/detail',
		remove: 'inventory/transaction/remove',
		purchase: 'inventory/transaction/purchase',
		transfer: 'inventory/transaction/transfer',
		adjustment: 'inventory/transaction/adjustment',
		opname: 'inventory/transaction/opname',
		usage: 'inventory/transaction/usage',
		sell: 'inventory/transaction/sell',
		productionIn: 'inventory/transaction/production-in',
		productionOut: 'inventory/transaction/production-out',
	},
}

const inventoryAlert = { list: 'inventory/alert/list', count: 'inventory/alert/count' }

const inventoryDashboard = { kpi: 'inventory/dashboard/kpi' }

const dashboard = {
	analytics: { pnl: 'dashboard/analytics/pnl', topSales: 'dashboard/analytics/top-sales' },
	settings: { summary: 'dashboard/settings/summary' },
}

const employee = crud('hr/employee')

const finance = {
	account: crud('finance/account'),
	journal: { entry: 'finance/general-ledger/entry' },
	expenditure: {
		list: 'finance/expenditure/list',
		create: 'finance/expenditure/create',
	},
}

const hr = {
	shifts: { list: 'hr/shifts', create: 'hr/shifts' },
	attendances: { list: 'hr/attendances' },
	clockIn: 'hr/clock-in',
	clockOut: 'hr/clock-out',
	payroll: {
		batches: {
			list: 'hr/payroll/batches',
			create: 'hr/payroll/batches',
			finalize: 'hr/payroll/batches/finalize',
		},
		adjustments: { create: 'hr/payroll/adjustments' },
	},
}

const moka = {
	configuration: {
		byLocation: 'moka/config/by-location',
		create: 'moka/config/create',
		update: 'moka/config/update',
	},
	scrap: { history: 'moka/scrap/history', trigger: 'moka/scrap/trigger' },
}

const production = {
	workOrder: {
		list: 'production/work-orders/list',
		detail: 'production/work-orders/detail',
		create: 'production/work-orders/create',
		start: 'production/work-orders/start',
		complete: 'production/work-orders/complete',
	},
}

const purchasing = {
	order: crud('purchasing/purchase-order'),
	goodsReceipt: {
		list: 'purchasing/goods-receipt/list',
		detail: 'purchasing/goods-receipt/detail',
		create: 'purchasing/goods-receipt/create',
		remove: 'purchasing/goods-receipt/remove',
		complete: 'purchasing/goods-receipt/complete',
	},
}

const sales = {
	order: {
		list: 'sales/order/list',
		detail: 'sales/order/detail',
		create: 'sales/order/create',
		addBatch: 'sales/order/add-batch',
		close: 'sales/order/close',
		void: 'sales/order/void',
	},
	salesType: crud('sales/sales-type'),
}

const supplier = crud('supplier')

const crm = {
	customer: {
		...crud('crm/customer'),
		byPhone: 'crm/customer/by-phone',
		points: {
			add: 'crm/customer/points/add',
			redeem: 'crm/customer/points/redeem',
		},
		loyaltyHistory: 'crm/customer/loyalty-history',
	},
}

const tool = {
	seed: 'tool/seed/',
}

const payment = {
	method: {
		...crud('payment/method'),
		enabled: 'payment/method/enabled',
		seed: 'payment/method/seed',
	},
	transaction: {
		...crud('payment/transaction'),
		invoices: 'payment/transaction/invoices',
	},
}

const reporting = {
	sales: {
		revenue: 'reporting/sales/revenue',
		topProducts: 'reporting/sales/top-products',
		byLocation: 'reporting/sales/by-location',
		byType: 'reporting/sales/by-type',
	},
	finance: {
		cashFlow: 'reporting/finance/cash-flow',
		accountBalances: 'reporting/finance/account-balances',
		expenditureByCategory: 'reporting/finance/expenditure-by-category',
	},
	inventory: {
		stockLevels: 'reporting/inventory/stock-levels',
		movements: 'reporting/inventory/movements',
		stockValue: 'reporting/inventory/stock-value',
		lowStock: 'reporting/inventory/low-stock',
		consumption: 'reporting/inventory/consumption',
		opname: 'reporting/inventory/opname',
		waste: 'reporting/inventory/waste',
	},
	crm: {
		customerGrowth: 'reporting/crm/customer-growth',
		customersByTier: 'reporting/crm/customers-by-tier',
		topCustomers: 'reporting/crm/top-customers',
		loyaltyPoints: 'reporting/crm/loyalty-points',
	},
	procurement: {
		purchases: 'reporting/procurement/purchases',
		suppliers: 'reporting/procurement/suppliers',
		transfers: 'reporting/procurement/transfers',
		costs: 'reporting/procurement/costs',
	},
	insights: {
		profitability: 'reporting/insights/profitability',
		location: 'reporting/insights/location',
		turnover: 'reporting/insights/turnover',
	},
	payment: {
		byMethod: 'reporting/payment/by-method',
		overTime: 'reporting/payment/over-time',
		byAccount: 'reporting/payment/by-account',
	},
}

export const endpoint = {
	auth,
	audit,
	company,
	iam,
	location,
	material,
	product,
	recipe,
	inventory,
	inventoryAlert,
	inventoryDashboard,
	dashboard,
	employee,
	finance,
	hr,
	moka,
	production,
	purchasing,
	sales,
	supplier,
	crm,
	tool,
	payment,
	reporting,
} as const
