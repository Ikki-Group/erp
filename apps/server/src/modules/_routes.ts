import { createAuthRoute } from '@/modules/auth/auth.route'
import { createIamRoute } from '@/modules/iam/iam.route'
import { createLocationRoute } from '@/modules/location/location.route'
import { createRecipeRoute } from '@/modules/recipe'
import { createSalesTypeRoute } from '@/modules/sales-type/sales-type.route'
import { createSupplierRoute } from '@/modules/supplier/supplier.route'

import type { Modules } from './_registry'
import type Elysia from 'elysia'

export function createRoutes(m: Modules) {
	const routes = [
		createLocationRoute(m.location),
		createSalesTypeRoute(m.salesType),
		createIamRoute(m.iam),
		createAuthRoute(m.auth),
		createSupplierRoute(m.supplier),
		createRecipeRoute(m.recipe),
	]

	return {
		register: (app: Elysia): Elysia => {
			routes.forEach((route) => app.use(route))
			return app
		},
	}
}
