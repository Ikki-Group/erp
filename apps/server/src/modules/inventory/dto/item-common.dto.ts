import z from 'zod'

export const ItemType = z.enum(['raw', 'semi'])
export type ItemType = z.infer<typeof ItemType>
