/**
 * OpenTelemetry integration.
 *
 * Exports the Elysia plugin (applied in app.ts) and the `record()` utility
 * for manual span creation in service orchestrations. Instrumentation is wired
 * through the Elysia plugin at app construction, so this is a normal module —
 * it is imported by app.ts, not preloaded.
 */
import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

import { SERVICE_NAME } from '@/shared/config'
import { env, isTest } from '@/shared/config/env.ts'

// Re-export record for manual spans
export { record } from '@elysiajs/opentelemetry'

const { AXIOM_URL: axiomUrl, AXIOM_TOKEN: axiomToken, AXIOM_DATASET: axiomDataset } = env

/** True when Axiom export is fully configured (traces are exported, not dropped). */
export const otelExportsToAxiom = Boolean(axiomUrl && axiomToken && axiomDataset)

/**
 * Elysia plugin — undefined in test env (no-op).
 * Applied conditionally in app.ts: `if (otelPlugin) app.use(otelPlugin)`
 */
export const otelPlugin = isTest
	? undefined
	: opentelemetry({
			serviceName: SERVICE_NAME,
			instrumentations: [new PgInstrumentation()],
			spanProcessors: otelExportsToAxiom
				? [
						new BatchSpanProcessor(
							new OTLPTraceExporter({
								url: axiomUrl!,
								headers: {
									Authorization: `Bearer ${axiomToken}`,
									'X-Axiom-Dataset': axiomDataset!,
								},
							}),
						),
					]
				: [],
		})
