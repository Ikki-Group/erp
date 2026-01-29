import { opentelemetry } from "@elysiajs/opentelemetry"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto"
import { AlwaysOnSampler } from "@opentelemetry/sdk-trace-base"

export const otel = opentelemetry({
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: "https://us-east-1.aws.edge.axiom.co/v1/traces",
        headers: {
          Authorization: `Bearer ${Bun.env.AXIOM_TOKEN}`,
          "X-Axiom-Dataset": Bun.env.AXIOM_DATASET ?? "ikki",
        },
      }),
    ),
  ],
  serviceName: "ikki-erp",
  sampler: new AlwaysOnSampler(),
})
