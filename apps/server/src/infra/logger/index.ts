import { configure, getConsoleSink, getLogger as _getLogger } from '@logtape/logtape'
import { getOpenTelemetrySink } from '@logtape/otel'
import { getPrettyFormatter } from '@logtape/pretty'

import { isProd, isTest } from '@/shared/config/env.ts'

import type { Logger, Sink } from '@logtape/logtape'
import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Initialize LogTape. Call once at app startup (after OTel, before listen).
 * In test env, configures with no sinks (silent).
 */
export async function setupLogger(): Promise<void> {
	const sinks: Record<string, Sink> = {}
	let activeSinks: string[] = []

	if (!isTest) {
		if (isProd) {
			sinks.otel = getOpenTelemetrySink({ serviceName: 'ikki-server' })
			activeSinks = ['otel']
		} else {
			sinks.console = getConsoleSink({
				formatter: getPrettyFormatter({
					icons: false,
					properties: true,
					align: true,
				}),
			})
			activeSinks = ['console']
		}
	}

	await configure({
		sinks,
		loggers: [
			{
				category: ['ikki'],
				sinks: activeSinks,
				lowestLevel: isProd ? 'info' : 'debug',
			},
			// Silence LogTape meta logs
			{ category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
		],
		contextLocalStorage: new AsyncLocalStorage(),
	})
}

/** Get a logger with category prefix `["ikki", ...rest]` */
export function getLogger(category: string[]): Logger {
	return _getLogger(['ikki', ...category])
}

export type { Logger }
