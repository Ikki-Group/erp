import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import { errorPlugin } from './server/plugins/error.plugin.ts'

export const app = new Elysia()
	.use(cors())
	.use(errorPlugin)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
