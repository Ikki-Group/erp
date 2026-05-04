import {
	configure,
	getLogger as getLogtapeLogger,
	getConsoleSink,
	type Logger,
} from '@logtape/logtape'
import { getOpenTelemetrySink } from '@logtape/otel'

import { env } from '@/config/env'

let isConfigured = false

export async function setupLogger() {
	if (isConfigured) return

	// const sinks: Record<string, Sink> = {}

	// if (env.LOG_FORMAT === 'pretty') {
	// 	sinks.console = getPrettyFormatter()
	// } else {
	// 	sinks.console = getConsoleSink()
	// }

	await configure({
		sinks: {
			console: getConsoleSink(),
			main: getConsoleSink(),
			otel: getOpenTelemetrySink({
				serviceName: 'logger',
				otlpExporterConfig: {
					url: 'https://us-east-1.aws.edge.axiom.co/v1/traces',
					headers: {
						Authorization: `Bearer ${env.AXIOM_TOKEN}`,
						'X-Axiom-Dataset': env.AXIOM_DATASET,
					},
				},
				diagnostics: true,
			}),
		},
		loggers: [
			{ category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'error' },
			{ category: [], sinks: ['main', 'otel'] },
		],
	})

	isConfigured = true
}

export function getLogger(category: string[]): Logger {
	if (!isConfigured) {
		throw new Error('Logger not configured. Call setupLogger() first.')
	}
	return getLogtapeLogger([...category])
}

// Legacy logger for backward compatibility
const logger = getLogtapeLogger([])

export { logger }
