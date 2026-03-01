export const DB_NAME = {
  // Iam
  USER: 'user',
  ROLE: 'role',
  SESSION: 'session',
} as const

export type DB_NAME = (typeof DB_NAME)[keyof typeof DB_NAME]
