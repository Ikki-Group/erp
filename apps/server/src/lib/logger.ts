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
		sinks: {
			console: getConsoleSink(),
			main: getConsoleSink(),
		},
		loggers: [
			{ category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'error' },
			{ category: [], sinks: ['main'] },
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
