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

export const endpoint = {
	auth,
} as const

export { crud, p }
