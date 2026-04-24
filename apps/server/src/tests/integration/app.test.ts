import { app } from '@/app'
import { describe, expect, it } from 'bun:test'

describe('Integration: App', () => {
	it('should return health check status on root', async () => {
		const response = await app.handle(new Request('http://localhost/'))
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data).toEqual({ status: 'ok', name: 'Ikki ERP API' })
	})

	it('should return 404 for unknown route', async () => {
		const response = await app.handle(new Request('http://localhost/unknown'))
		expect(response.status).toBe(404)
	})
})
