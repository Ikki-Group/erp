import { Elysia } from 'elysia'

import { hasPermission } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { ForbiddenError } from '@/shared/errors/http-error.ts'

import { authPlugin } from './auth.plugin.ts'

export const rbac = new Elysia({ name: 'rbac' })
	.use(authPlugin)
	// Elysia 1.4.29's macro type does not carry scoped derive fields into the hook context.
	// The auth plugin supplies this field at runtime before the RBAC hook executes.
	.macro({
		permission(required: string) {
			return {
				beforeHandle(context) {
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Elysia omits scoped derive fields from macro context types.
					const { auth } = context as unknown as { auth: AuthContext }
					if (!hasPermission(auth, required)) {
						throw new ForbiddenError('Insufficient permissions', {
							code: 'PERMISSION_DENIED',
							context: { required },
						})
					}
				},
			}
		},
	})
