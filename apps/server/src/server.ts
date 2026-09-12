import { app } from './app.ts'
import { getLogger, setupLogger } from './infra/logger/index.ts'
import { otelExportsToAxiom, otelPlugin } from './infra/otel/otel.ts'
import { env } from './shared/config/env.ts'

const port = env.PORT

await setupLogger()

const logger = getLogger(['server'])

if (otelPlugin) {
	logger.info(
		otelExportsToAxiom
			? 'OpenTelemetry initialized, exporting to Axiom'
			: 'OpenTelemetry initialized (no Axiom config, spans dropped)',
	)
}

app.listen(port, () => {
	logger.info('Server running on port {port}', { port })
})

export type App = typeof app
