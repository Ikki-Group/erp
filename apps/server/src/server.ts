import { app } from './app.ts'
import { closeCache } from './infra/cache/index.ts'
import { pool } from './infra/database/client.ts'
import { getLogger, setupLogger } from './infra/logger/index.ts'
import { otelExportsToAxiom, otelPlugin } from './infra/otel/otel.ts'
import { closeRedis } from './infra/redis/index.ts'
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

// ─── Graceful shutdown ───

const SHUTDOWN_TIMEOUT_MS = 10_000
let shuttingDown = false

async function shutdown(signal: string): Promise<void> {
	if (shuttingDown) return
	shuttingDown = true
	logger.info('Received {signal}, shutting down', { signal })
	setTimeout(() => {
		logger.error('Shutdown timed out, forcing exit')
		process.exit(1)
	}, SHUTDOWN_TIMEOUT_MS).unref()
	try {
		await app.stop() // stops accepting connections, waits for in-flight requests
		await closeCache()
		await closeRedis()
		await pool.end()
		logger.info('Shutdown complete')
		process.exit(0)
	} catch (error) {
		logger.error('Shutdown failed', { error })
		process.exit(1)
	}
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

export type App = typeof app
