import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import { db } from './client.ts'

export const uow: UnitOfWork = {
	run(fn) {
		return db.transaction((tx) => fn(tx))
	},
}
