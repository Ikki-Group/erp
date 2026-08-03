export * from './role/role.contract'
export * from './user/user.contract'
export * from './assignment/assignment.contract'
export * from './composed/composed.contract'

export * from './iam.module'
export type { RoleService } from './role/role.service'
export type { UserService } from './user/user.service'

/** Minimal port for consuming modules that only need user count. */
export interface IamUserPort {
	count(): Promise<number>
}

/** Minimal port for consuming modules that only need role count. */
export interface IamRolePort {
	count(): Promise<number>
}
