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
	inventory,
	company,
	pos,
} as const

export { crud, p }
