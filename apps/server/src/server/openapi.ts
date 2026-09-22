import { openapi } from '@elysiajs/openapi'
import z from 'zod'

import { isDev } from '@/shared/config/env.ts'

export const openapiPlugin = openapi({
	enabled: isDev,
	path: '/openapi',
	documentation: {
		info: {
			title: 'Ikki ERP API',
			version: '1.0.0',
			description: 'API documentation for Ikki ERP server',
		},
	},
	mapJsonSchema: {
		// oxlint-disable-next-line typescript/consistent-return
		zod: (schema: any) => {
			return z.toJSONSchema(schema, {
				unrepresentable: 'any',
				override(ctx) {
					// oxlint-disable-next-line no-underscore-dangle
					const def = ctx.zodSchema._zod.def
					if (def.type === 'date') {
						ctx.jsonSchema.type = 'string'
						ctx.jsonSchema.format = 'date-time'
						ctx.jsonSchema.examples = ['2026-08-09T06:06:00Z']
					}

					return ctx
				},
			})
		},
	},
}).as('global')
