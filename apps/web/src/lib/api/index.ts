import { createTreaty } from '@ikki/api-sdk'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = createTreaty(API_URL)

export type Api = typeof api
