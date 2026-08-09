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

const auth = {
	login: 'auth/login',
	me: 'auth/me',
	logout: 'auth/logout',
	switchLocation: 'auth/switch-location',
}

const location = crud('location')

const iam = {
	role: crud('iam/role'),
	user: {
		...crud('iam/user'),
		deactivate: p('iam/user', 'deactivate'),
	},
	assignment: {
		list: p('iam/assignment', 'list'),
		assign: p('iam/assignment', 'assign'),
		remove: p('iam/assignment', 'remove'),
	},
}

const uom = {
	...crud('uom'),
	conversion: {
		list: p('uom', 'conversion', 'list'),
		create: p('uom', 'conversion', 'create'),
		remove: p('uom', 'conversion', 'remove'),
	},
}

const material = {
	...crud('material'),
	category: crud('material/category'),
	assignment: {
		assign: p('material', 'assignment', 'assign'),
		unassign: p('material', 'assignment', 'unassign'),
		byLocation: p('material', 'assignment', 'by-location'),
		byMaterial: p('material', 'assignment', 'by-material'),
	},
}

const paymentMethod = {
	...crud('payment-method'),
	byLocation: p('payment-method', 'by-location'),
	location: {
		assign: p('payment-method', 'location', 'assign'),
		unassign: p('payment-method', 'location', 'unassign'),
	},
}

const inventory = {
	stock: {
		balance: p('inventory/stock', 'balance'),
		list: p('inventory/stock', 'list'),
		movements: p('inventory/stock', 'movements'),
	},
	transfer: {
		list: p('inventory/transfer', 'list'),
		detail: p('inventory/transfer', 'detail'),
		create: p('inventory/transfer', 'create'),
		ship: p('inventory/transfer', 'ship'),
		receive: p('inventory/transfer', 'receive'),
	},
	opname: {
		list: p('inventory/opname', 'list'),
		detail: p('inventory/opname', 'detail'),
		create: p('inventory/opname', 'create'),
		counts: p('inventory/opname', 'counts'),
		approve: p('inventory/opname', 'approve'),
	},
	receiving: {
		list: p('inventory/receiving', 'list'),
		detail: p('inventory/receiving', 'detail'),
		create: p('inventory/receiving', 'create'),
		update: p('inventory/receiving', 'update'),
		confirm: p('inventory/receiving', 'confirm'),
	},
}

const supplier = {
	...crud('supplier'),
	material: {
		list: p('supplier', 'material', 'list'),
		create: p('supplier', 'material', 'create'),
		update: p('supplier', 'material', 'update'),
		remove: p('supplier', 'material', 'remove'),
	},
}

const menu = {
	item: {
		...crud('menu/item'),
		modifiersSync: p('menu/item', 'modifiers', 'sync'),
	},
	category: {
		list: p('menu/category', 'list'),
		create: p('menu/category', 'create'),
		update: p('menu/category', 'update'),
		remove: p('menu/category', 'remove'),
	},
	modifier: crud('menu/modifier'),
}

const recipe = {
	...crud('recipe'),
	byMenuItem: p('recipe', 'by-menu-item'),
	hpp: p('recipe', 'hpp'),
}

const company = {
	detail: 'company/detail',
	create: 'company/create',
	update: 'company/update',
}

const pos = {
	voucher: crud('pos/voucher'),
	table: crud('pos/table'),
	shift: {
		open: p('pos/shift', 'open'),
		close: p('pos/shift', 'close'),
		closeOther: p('pos/shift', 'close-other'),
		active: p('pos/shift', 'active'),
		list: p('pos/shift', 'list'),
		detail: p('pos/shift', 'detail'),
	},
	order: {
		list: p('pos/order', 'list'),
		detail: p('pos/order', 'detail'),
		create: p('pos/order', 'create'),
		complete: p('pos/order', 'complete'),
		void: p('pos/order', 'void'),
		linesSync: p('pos/order', 'lines', 'sync'),
		voucherApply: p('pos/order', 'voucher', 'apply'),
		voucherRemove: p('pos/order', 'voucher', 'remove'),
		payment: p('pos/order', 'payment'),
	},
}

export const endpoint = {
	auth,
	location,
	iam,
	uom,
	material,
	supplier,
	paymentMethod,
	menu,
	recipe,
	inventory,
	company,
	pos,
} as const

export { crud, p }
