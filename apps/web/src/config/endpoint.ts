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

export const endpoint = {
	auth,
	location,
	iam,
	uom,
} as const

export { crud, p }
