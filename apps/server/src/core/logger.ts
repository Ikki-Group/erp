import {
	configure,
	getLogger as getLogtapeLogger,
	getConsoleSink,
	type Logger,
	jsonLinesFormatter,
} from '@logtape/logtape'
import { getOpenTelemetrySink } from '@logtape/otel'
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
		otel: getOpenTelemetrySink({
			serviceName: env.APP_NAME,
			diagnostics: true,
			otlpExporterConfig: {
				url: env.AXIOM_URL!,
				headers: {
					Authorization: `Bearer ${env.AXIOM_TOKEN}`,
					'X-Axiom-Dataset': env.AXIOM_DATASET!,
				},
			},
		}),
	},
	loggers: [
		{ category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'error' },
		{ category: ['otel'], sinks: ['otel'], lowestLevel: 'debug' },
		{ category: [], sinks: ['main', 'otel'], lowestLevel: 'debug' },
	],
})

export function getLogger(category: string[] = []): Logger {
	return getLogtapeLogger([...category])
}

const logger = getLogtapeLogger([])

export { logger }
