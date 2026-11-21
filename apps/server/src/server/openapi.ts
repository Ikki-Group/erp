import { openapi } from '@elysiajs/openapi'
import { z } from 'zod'

import { isProd } from '@/shared/config/env.ts'
import { ErrorResponseDto, isResponseSchema } from '@/shared/http/response.schema.ts'

// ─── Security ───

/** Security scheme names; `PROTECTED_SECURITY` is what the RBAC guard attaches to protected routes. */
const SECURITY = {
	/** OAuth2 password flow against `POST /auth/token`: log in from the docs UI. */
	login: 'login',
	/** Paste a token from `POST /auth/login`. */
	token: 'token',
	/** Active location (`X-Location-ID`), the fallback when a request names no `locationId`. */
	location: 'location',
} as const

/** Either credential, plus the optional active location. */
export const PROTECTED_SECURITY = [
	{ [SECURITY.login]: [], [SECURITY.location]: [] },
	{ [SECURITY.token]: [], [SECURITY.location]: [] },
]

// ─── Tags ───

/** Every route tag, grouped for the sidebar (`x-tagGroups`). Route `tags` must use these names. */
const TAG_GROUPS: Record<string, Record<string, string>> = {
	Access: {
		Auth: 'Sessions. Log in with **Authorize** (top of the page) instead of copying tokens.',
		Roles: 'Permission sets. Writes need a global (company-wide) grant.',
		Users: 'User accounts. Writes need a global grant.',
		'User Assignments': 'Role grants per location; `locationId: null` grants company-wide.',
		'Audit Log': 'Company-wide, read-only change history.',
	},
	Organisation: {
		Company: 'Company profile and settings.',
		Locations: 'Stores and warehouses.',
		'Payment Methods': 'Payment methods and the locations that accept them.',
	},
	'Master Data': {
		Materials: 'Raw and semi-finished materials.',
		'Material Categories': 'Material grouping.',
		'Material Assignments': 'Which locations stock a material.',
		Suppliers: 'Suppliers.',
		'Supplier Pricing': 'Supplier prices per material.',
		'Units of Measure': 'Units of measure.',
		'UoM Conversions': 'Conversion factors between units.',
	},
	Menu: {
		'Menu Categories': 'Per-location menu categories.',
		'Menu Items': 'Per-location sellable items.',
		'Modifier Groups': 'Option groups attached to menu items.',
		Recipes: 'Bills of materials for menu items; drives HPP and stock deduction.',
	},
	Inventory: {
		Stock: 'Balances and the movement ledger.',
		Receiving: 'Goods receipts from suppliers; confirming posts stock in.',
		Transfers:
			'Moves between locations: created/shipped at the source, received at the destination.',
		'Stock Opname': 'Stock counts; completing posts adjustments.',
	},
	Production: {
		'Production Recipes': 'Recipes for semi-finished goods.',
		'Production Orders': 'Production runs; confirming consumes inputs and posts output.',
	},
	POS: {
		Orders: 'Point-of-sale orders, payments and vouchers.',
		Shifts: 'Cashier shifts.',
		Tables: 'Dine-in tables.',
		Vouchers: 'Discount vouchers.',
	},
}

const tags = Object.values(TAG_GROUPS).flatMap((group) =>
	Object.entries(group).map(([name, description]) => ({ name, description })),
)
const tagGroups = Object.entries(TAG_GROUPS).map(([name, group]) => ({
	name,
	tags: Object.keys(group),
}))

// ─── Schema mapping ───

/**
 * Zod → JSON Schema. Requests render in input mode (fields with defaults are
 * optional), responses in output mode. Dates are ISO strings on the wire.
 */
function toJsonSchema(schema: z.ZodType) {
	return z.toJSONSchema(schema, {
		io: isResponseSchema(schema) ? 'output' : 'input',
		unrepresentable: 'any',
		override(ctx) {
			// oxlint-disable-next-line no-underscore-dangle -- zod's documented override hook exposes `_zod`.
			if (ctx.zodSchema._zod.def.type === 'date') {
				ctx.jsonSchema.type = 'string'
				ctx.jsonSchema.format = 'date-time'
			}
		},
	})
}

// ─── Plugin ───

const DESCRIPTION = `
Ikki ERP HTTP API. Every response uses the \`{ success, data | error }\` envelope.

## Logging in
In the **Authentication** panel (Introduction, or any operation), enter a username and password and
click **Authorize**. It is prefilled with \`owner\`; other seeded users share the password \`password123\`:
\`manager\`, \`cashier\`, \`warehouse\`, \`multi-location\`. The token is kept across reloads; **Clear tokens**
to switch user. To act at a location, fill **Location** with an id (empty = none).

## Permissions and locations
Each protected operation lists its **Permission**. Permissions are granted per location: the check runs at
the \`locationId\` the query or body names; if it names none, at the **Location** (\`X-Location-ID\` header);
with neither, only company-wide grants count. Records addressed by id are checked against their own
location. \`auth.*\` session endpoints only need a valid session. Your locations and effective permissions
are returned by \`GET /auth/me\`.

## Errors
Failures return \`{ success: false, error: { code, message, context? } }\` (see the **ErrorResponse** model):
401 \`UNAUTHORIZED\` (no/expired session), 403 \`PERMISSION_DENIED\`, 404, 409 conflict, 422 \`VALIDATION_ERROR\`.
`.trim()

type ComponentSchema = NonNullable<
	NonNullable<NonNullable<Parameters<typeof openapi>[0]>['documentation']>['components']
>['schemas'] extends Record<string, infer S> | undefined
	? S
	: never

export const openapiPlugin = openapi({
	// Off in production; on in development and test (the spec is exercised by tests).
	enabled: !isProd,
	path: '/openapi',
	documentation: {
		info: { title: 'Ikki ERP API', version: '1.0.0', description: DESCRIPTION },
		tags,
		// Scalar extension: groups the sidebar.
		...{ 'x-tagGroups': tagGroups },
		components: {
			securitySchemes: {
				[SECURITY.login]: {
					type: 'oauth2',
					description: 'Sign in with username and password.',
					flows: { password: { tokenUrl: '/auth/token', scopes: {} } },
				},
				[SECURITY.token]: {
					type: 'http',
					scheme: 'bearer',
					description: 'Session token from `POST /auth/login`.',
				},
				[SECURITY.location]: {
					type: 'apiKey',
					in: 'header',
					name: 'X-Location-ID',
					description: 'Active location id (optional).',
				},
			},
			schemas: {
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- zod emits JSON Schema 2020-12 (valid in OpenAPI 3.1); openapi-types only models 3.0 schema objects.
				ErrorResponse: toJsonSchema(ErrorResponseDto) as unknown as ComponentSchema,
			},
		},
	},
	scalar: {
		persistAuth: true,
		agent: { disabled: true },
		showDeveloperTools: 'never',
		defaultHttpClient: { targetKey: 'js', clientKey: 'fetch' },
		authentication: {
			preferredSecurityScheme: [[SECURITY.login, SECURITY.location]],
			securitySchemes: {
				// Public client: blank id/secret so Scalar sends neither Basic auth nor demo values.
				[SECURITY.login]: {
					flows: {
						password: {
							username: 'owner',
							password: 'password123',
							'x-scalar-client-id': '',
							clientSecret: '',
						},
					},
				},
				[SECURITY.location]: { value: '' },
			},
		},
	},
	mapJsonSchema: { zod: toJsonSchema },
}).as('global')
