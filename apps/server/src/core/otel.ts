import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { resources } from '@opentelemetry/sdk-node'
import { AlwaysOnSampler, type SpanProcessor } from '@opentelemetry/sdk-trace-base'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

import { env } from '@/config/env'

const spanProcessors: SpanProcessor[] = []

if (env.AXIOM_URL && env.AXIOM_TOKEN && env.AXIOM_DATASET) {
	spanProcessors.push(
		new BatchSpanProcessor(
			new OTLPTraceExporter({
				url: env.AXIOM_URL,
				headers: {
					Authorization: `Bearer ${env.AXIOM_TOKEN}`,
					'X-Axiom-Dataset': env.AXIOM_DATASET,
				},
			}),
			{
				maxQueueSize: 2048,
				maxExportBatchSize: 512,
				scheduledDelayMillis: 500,
			},
		),
	)
}

export const otel = opentelemetry({
	serviceName: env.APP_NAME,
	autoDetectResources: true,
	spanProcessors,
	sampler: new AlwaysOnSampler(),
	resource: resources.defaultResource(),
})
