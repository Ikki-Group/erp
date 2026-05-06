import {
	configure,
	getLogger as getLogtapeLogger,
	getConsoleSink,
	type Logger,
	jsonLinesFormatter,
} from '@logtape/logtape'
import { getPrettyFormatter } from '@logtape/pretty'

import { env } from '@/config/env'

await configure({
	sinks: {
		console: getConsoleSink(),
		main: getConsoleSink({
			formatter:
				env.LOG_FORMAT === 'pretty'
					? getPrettyFormatter({
							icons: false,
							timestamp: 'time',
							properties: true,
						})
					: jsonLinesFormatter,
		}),
		// otel: getOpenTelemetrySink({
		// 	diagnostics: true,
		// 	loggerProvider,
		// }),
	},
	loggers: [
		{ category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'error' },
		// { category: ['otel'], sinks: ['otel'], lowestLevel: 'debug' },
		{ category: [], sinks: ['main'], lowestLevel: 'debug' },
	],
})

export function getLogger(category: string[] = []): Logger {
	return getLogtapeLogger([...category])
}

const logger = getLogtapeLogger([])

export { logger }
