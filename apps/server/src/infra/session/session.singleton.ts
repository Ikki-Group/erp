import { SESSION_MAX_AGE_SECONDS } from '@/shared/config/index.ts'

import { MemorySessionStore } from './session.memory.ts'

export const sessionStore = new MemorySessionStore({
	ttlSeconds: SESSION_MAX_AGE_SECONDS,
})
