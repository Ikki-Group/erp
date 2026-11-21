import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import { db } from './client.ts'
import { isRetryablePgError } from './pg-errors.ts'

const MAX_ATTEMPTS = 3
const BASE_BACKOFF_MS = 20

async function backoff(attempt: number): Promise<void> {
	await Bun.sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1) * (0.5 + Math.random()))
}

export const uow: UnitOfWork = {
	async run(fn) {
		for (let attempt = 1; ; attempt++) {
			try {
				return await db.transaction((tx) => fn(tx))
			} catch (error) {
				if (attempt >= MAX_ATTEMPTS || !isRetryablePgError(error)) throw error
				await backoff(attempt)
			}
		}
	},
}
