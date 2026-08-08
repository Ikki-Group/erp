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

// Re-export record for manual spans
export { record } from '@elysiajs/opentelemetry'

const isTest = process.env.NODE_ENV === 'test'

const axiomUrl = process.env.AXIOM_URL
const axiomToken = process.env.AXIOM_TOKEN
const axiomDataset = process.env.AXIOM_DATASET

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
