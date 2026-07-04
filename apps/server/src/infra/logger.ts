import { configure, getLogger, getConsoleSink, jsonLinesFormatter } from '@logtape/logtape'
import { getPrettyFormatter } from '@logtape/pretty'

import { env } from '@/config/env'

await configure({
	sinks: {
		meta: getConsoleSink(),
		main: getConsoleSink({
			formatter:
				env.LOG_FORMAT === 'pretty'
					? getPrettyFormatter({
							icons: false,
							timestamp: 'time',
							properties: true,
							align: false,
							messageColor: 'cyan',
							messageStyle: 'reset',
						})
					: jsonLinesFormatter,
		}),
		// TODO: enable once loggerProvider is stable
		// otel: getOpenTelemetrySink({ diagnostics: true, loggerProvider }),
	},
	loggers: [
		{ category: ['logtape', 'meta'], sinks: ['meta'], lowestLevel: 'error' },
		// { category: ['otel'], sinks: ['otel'], lowestLevel: 'debug' },
		{ category: ['app'], sinks: ['main'] },
	],
})

const logger = getLogger(['app'])
export { logger }
