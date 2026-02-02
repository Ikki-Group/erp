import { opentelemetry } from '@elysiajs/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { AlwaysOnSampler } from '@opentelemetry/sdk-trace-base'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

export const otel = opentelemetry({
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: 'https://us-east-1.aws.edge.axiom.co/v1/traces',
        headers: {
          Authorization: `Bearer ${Bun.env.AXIOM_TOKEN}`,
          'X-Axiom-Dataset': Bun.env.AXIOM_DATASET ?? 'ikki',
        },
      })
    ),
  ],
  serviceName: Bun.env.APP_NAME || 'ikki-erp',
  sampler: new AlwaysOnSampler(),
})
