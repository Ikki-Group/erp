import { IamAuthService } from './iam-auth.service'
import { IamRolesService } from './iam-roles.service'
import { IamUserRoleAssignmentsService } from './iam-user-role-assignments.service'
import { IamUsersService } from './iam-users.service'

export class IamServiceModule {
  public readonly auth: IamAuthService
  public readonly users: IamUsersService
  public readonly roles: IamRolesService
  public readonly userRoleAssignments: IamUserRoleAssignmentsService

  constructor() {
    this.userRoleAssignments = new IamUserRoleAssignmentsService()
    this.users = new IamUsersService(this.userRoleAssignments)
    this.roles = new IamRolesService()
    this.auth = new IamAuthService(this.users)
  }
}

export { IamAuthService } from './iam-auth.service'
export { IamRolesService } from './iam-roles.service'
export { IamUserRoleAssignmentsService } from './iam-user-role-assignments.service'
export { IamUsersService } from './iam-users.service'
