import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { AlwaysOnSampler } from '@opentelemetry/sdk-trace-base'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

const axiomExporter = new OTLPTraceExporter({
  url: 'https://us-east-1.aws.edge.axiom.co/v1/traces',
  headers: {
    Authorization: `Bearer ${Bun.env.AXIOM_TOKEN}`,
    'X-Axiom-Dataset': Bun.env.AXIOM_DATASET ?? 'ikki',
  },
})

const betterstackExporter = new OTLPTraceExporter({
  url: 'https://s2035304.eu-fsn-3.betterstackdata.com/v1/traces',
  headers: {
    Authorization: 'Bearer qydrQBUhyoh79aBa9sy5f4Sg',
  },
})

export const otel = opentelemetry({
  autoDetectResources: true,
  spanProcessors: [new BatchSpanProcessor(axiomExporter)],
  instrumentations: [],
  serviceName: Bun.env.APP_NAME || 'ikki-erp',
  sampler: new AlwaysOnSampler(),
})
