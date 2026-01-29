import pino from "pino"
import { trace, context } from "@opentelemetry/api"

export const logger = pino({
  level: "info",
  mixin() {
    const span = trace.getSpan(context.active())
    if (!span) return {}
    const { traceId, spanId } = span.spanContext()
    return {
      trace_id: traceId,
      span_id: spanId,
      service: { name: "ikki-erp" }, // Optional: helps with correlating service name
    }
  },
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
        },
      },
      // {
      //   target: "@axiomhq/pino",
      //   options: {
      //     dataset: Bun.env.AXIOM_DATASET,
      //     token: Bun.env.AXIOM_TOKEN,
      //   },
      // },
    ],
  },
})
