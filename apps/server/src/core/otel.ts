import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { logs } from '@opentelemetry/sdk-node'
import { AlwaysOnSampler } from '@opentelemetry/sdk-trace-base'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

import { env } from '@/config/env'

const axiomExporter = new OTLPTraceExporter({
	url: 'https://us-east-1.aws.edge.axiom.co/v1/traces',
	headers: {
		Authorization: `Bearer ${env.AXIOM_TOKEN}`,
		'X-Axiom-Dataset': env.AXIOM_DATASET,
	},
})

export const otel = opentelemetry({
	serviceName: env.APP_NAME,
	autoDetectResources: true,
	spanProcessors: [new BatchSpanProcessor(axiomExporter)],
	// @ts-expect-error logs module type mismatch between sdk-node and ConsoleLogRecordExporter
	logRecordProcessor: new logs.BatchLogRecordProcessor(new logs.ConsoleLogRecordExporter()),
	instrumentations: [new PinoInstrumentation()],
	sampler: new AlwaysOnSampler(),
})
