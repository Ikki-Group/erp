/**
 * OpenTelemetry preload — must run BEFORE any instrumented imports.
 * Loaded via bunfig.toml `preload = ["./src/instrumentation.ts"]`.
 *
 * Exports the Elysia plugin (applied in app.ts) and the `record()` utility
 * for manual span creation in service orchestrations.
 */
import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

import { env, isTest } from '@/shared/config/env.ts'

// Re-export record for manual spans
export { record } from '@elysiajs/opentelemetry'

const { AXIOM_URL: axiomUrl, AXIOM_TOKEN: axiomToken, AXIOM_DATASET: axiomDataset } = env
const hasAxiomConfig = axiomUrl && axiomToken && axiomDataset

/**
 * Elysia plugin — undefined in test env (no-op).
 * Applied conditionally in app.ts: `if (otelPlugin) app.use(otelPlugin)`
 */
export const otelPlugin = isTest
	? undefined
	: opentelemetry({
			serviceName: 'ikki-server',
			instrumentations: [new PgInstrumentation()],
			spanProcessors: hasAxiomConfig
				? [
						new BatchSpanProcessor(
							new OTLPTraceExporter({
								url: axiomUrl,
								headers: {
									Authorization: `Bearer ${axiomToken}`,
									'X-Axiom-Dataset': axiomDataset,
								},
							}),
						),
					]
				: [],
		})

// Note: logger may not be configured yet (otel.ts is preloaded), so use
// getLogger lazily. The message is emitted at import-time but LogTape
// buffers until configure() is called.
import { getLogger } from '@/infra/logger/index.ts'

const logger = getLogger(['otel'])

if (!isTest && hasAxiomConfig) {
	logger.info('OpenTelemetry initialized, exporting to Axiom')
} else if (!isTest) {
	logger.info('OpenTelemetry initialized (no Axiom config, spans dropped)')
}
