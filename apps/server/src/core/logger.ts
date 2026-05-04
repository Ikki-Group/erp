import {
	configure,
	getLogger as getLogtapeLogger,
	getConsoleSink,
	type Logger,
	type Sink,
} from '@logtape/logtape'
import { getPrettyFormatter } from '@logtape/pretty'

import { env } from '@/config/env'

let isConfigured = false

export async function setupLogger() {
	if (isConfigured) return

	const sinks: Record<string, Sink> = {}

	if (env.LOG_FORMAT === 'pretty') {
		sinks.console = getPrettyFormatter()
	} else {
		sinks.console = getConsoleSink()
	}

	await configure({
		sinks,
		loggers: [
			{
				category: 'logtape',
				lowestLevel: 'warning',
				sinks: ['console'],
			},
			{
				category: 'ikki',
				lowestLevel: env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
				sinks: ['console'],
			},
		],
	})

	isConfigured = true
}

export function getLogger(category: string[]): Logger {
	if (!isConfigured) {
		throw new Error('Logger not configured. Call setupLogger() first.')
	}
	return getLogtapeLogger(['ikki', ...category])
}

// Legacy logger for backward compatibility
const logger = getLogtapeLogger([])

export { logger }
