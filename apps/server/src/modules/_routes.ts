import { createAuthRoute } from '@/modules/auth/auth.route'
import { createIamRoute } from '@/modules/iam/iam.route'
import { createLocationRoute } from '@/modules/location/location.route'

import type { Modules } from './_registry'
import type Elysia from 'elysia'

/**
 * Aggregates the HTTP routes for every module that exposes an API.
 *
 * Not every module in `Modules` has routes (e.g. `session`, `tool` are used
 * internally), so this list is a deliberate subset. When adding a module with
 * HTTP endpoints: add its `create*Route(m.<module>)` here.
 */
export function createRoutes(m: Modules) {
	const routes = [createLocationRoute(m.location), createIamRoute(m.iam), createAuthRoute(m.auth)]

	return {
		register: (app: Elysia): Elysia => {
			routes.forEach((route) => app.use(route))
			return app
		},
	}
}
