import { app } from './app.ts'
import { getLogger, setupLogger } from './infra/logger/index.ts'

const port = Bun.env['PORT'] ?? 3000

await setupLogger()

const logger = getLogger(['server'])

app.listen(port, () => {
	logger.info('Server running on port {port}', { port })
})

export type App = typeof app
