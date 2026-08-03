import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { SimpleLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import {
	AlwaysOnSampler,
	ParentBasedSampler,
	TraceIdRatioBasedSampler,
	type SpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

import { env } from '@/config/env'

function buildAxiomProcessors(): { spanProcessors: SpanProcessor[]; logExporter: OTLPLogExporter } {
	if (!env.AXIOM_URL || !env.AXIOM_TOKEN) {
		return { spanProcessors: [], logExporter: new OTLPLogExporter() }
	}

	const headers = {
		Authorization: `Bearer ${env.AXIOM_TOKEN}`,
		'X-Axiom-Dataset': env.AXIOM_DATASET!,
	}

	return {
		spanProcessors: [
			new BatchSpanProcessor(new OTLPTraceExporter({ url: env.AXIOM_URL, headers }), {
				maxQueueSize: 2048,
				maxExportBatchSize: 512,
				scheduledDelayMillis: 500,
			}),
		],
		logExporter: new OTLPLogExporter({ url: env.AXIOM_URL, headers }),
	}
}

const { spanProcessors, logExporter } = buildAxiomProcessors()

export const loggerProvider = new LoggerProvider({
	processors: [new SimpleLogRecordProcessor(logExporter)],
})

export const otel = opentelemetry({
	serviceName: env.APP_NAME,
	autoDetectResources: true,
	spanProcessors: spanProcessors.length > 0 ? spanProcessors : [],
	sampler:
		env.APP_ENV === 'production'
			? new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(0.1) })
			: new AlwaysOnSampler(),
})
