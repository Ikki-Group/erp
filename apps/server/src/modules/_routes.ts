import { createAuthRoute } from '@/modules/auth/auth.route'
import { createIamRoute } from '@/modules/iam/iam.route'
import { createLocationRoute } from '@/modules/location/location.route'
import { createSupplierRoute } from '@/modules/supplier/supplier.route'

import type { Modules } from './_registry'
import type Elysia from 'elysia'

export function createRoutes(m: Modules) {
	const routes = [
		createLocationRoute(m.location),
		createIamRoute(m.iam),
		createAuthRoute(m.auth),
		createSupplierRoute(m.supplier),
	]

	return {
		register: (app: Elysia): Elysia => {
			routes.forEach((route) => app.use(route))
			return app
		},
	}
}
