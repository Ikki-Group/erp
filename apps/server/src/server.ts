import { app } from './app.ts'

const port = Bun.env['PORT'] ?? 3000

app.listen(port, () => {
	console.log(`[ikki-server] running on port ${port}`)
})

export type App = typeof app
