export const PERMISSIONS = [
  // IAM
  'iam.users.read',
  'iam.users.create',
  'iam.users.update',
  'iam.users.delete',
  'iam.users.update_password',
  'iam.roles.read',
  'iam.roles.create',
  'iam.roles.update',
  'iam.roles.delete',
  'iam.permissions.read',
] as const

export type Permission = (typeof PERMISSIONS)[number]
