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

if (!isTest && hasAxiomConfig) {
	console.log('[otel] OpenTelemetry initialized → exporting to Axiom')
} else if (!isTest) {
	console.log('[otel] OpenTelemetry initialized (no Axiom config — spans dropped)')
}
