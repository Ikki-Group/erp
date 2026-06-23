import { z } from 'zod'

/* ---------------------------------- ENUMS ---------------------------------- */

export const MokaScrapType = z.enum(['sales', 'product', 'category'])
export type MokaScrapType = z.infer<typeof MokaScrapType>

export const MokaProvider = z.enum(['moka'])
export type MokaProvider = z.infer<typeof MokaProvider>

export const MokaSyncTriggerMode = z.enum(['manual', 'cron', 'upload', 'machine_fetch'])
export type MokaSyncTriggerMode = z.infer<typeof MokaSyncTriggerMode>

export const MokaScrapStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed'])
export type MokaScrapStatus = z.infer<typeof MokaScrapStatusEnum>
