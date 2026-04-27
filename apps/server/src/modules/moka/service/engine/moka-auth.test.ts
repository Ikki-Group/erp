import axios from 'axios'

import { MokaAuthEngine } from './moka-auth.service'
import { describe, expect, it, mock } from 'bun:test'
import type { Logger } from 'pino'

// Mock Logger
const mockLogger = { info: mock(() => {}), error: mock(() => {}) } as unknown as Logger

// oxlint-disable-next-line typescript/no-floating-promises
mock.module('axios', () => {
	return {
		default: {
			post: mock(async () => ({
				data: { access_token: 'MOCK_TOKEN', outlets: [{ id: 12345, name: 'Main Outlet' }] },
			})),
			create: mock(() => ({
				interceptors: { response: { use: mock(() => {}) } },
				request: mock(() => {}),
			})),
		},
	}
})

describe('MokaAuthEngine', () => {
	it('should login and set token and outletId', async () => {
		const engine = new MokaAuthEngine(mockLogger, {
			email: 'test@example.com',
			password: 'password',
		})
		const result = await engine.login()

		expect(result.access_token).toBe('MOCK_TOKEN')
		expect(engine.token).toBe('MOCK_TOKEN')
		expect(engine.mokaOutletId).toBe('12345')
		// oxlint-disable-next-line typescript/unbound-method
		expect(axios.post).toHaveBeenCalled()
	})
})
