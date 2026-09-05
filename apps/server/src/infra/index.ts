// Infra barrel — re-exports for convenience imports

export { db } from './database/index.ts'
export type { DbContext } from './database/index.ts'

export { cache, CacheService } from './cache/index.ts'
export type { CacheClient, CacheKeys } from './cache/index.ts'

export { sessionStore } from './session/index.ts'
export type { SessionData, CreateSessionInput } from './session/index.ts'

export { generateNumber, generateMonthlyNumber } from './numbering/index.ts'
export type { GenerateNumberInput } from './numbering/index.ts'

export { auditLog, auditPort } from './audit/index.ts'
export type { AuditEntry, AuditLogEntry } from './audit/index.ts'
