import { IamAuthService } from './iam-auth.service'
import { IamRolesService } from './iam-roles.service'
import { IamUserRoleAssignmentsService } from './iam-user-role-assignments.service'
import { IamUsersService } from './iam-users.service'

export class IamModuleService {
  public readonly auth: IamAuthService

  constructor(
    public readonly users: IamUsersService = new IamUsersService(),
    public readonly roles: IamRolesService = new IamRolesService(),
    public readonly userRoleAssignments: IamUserRoleAssignmentsService = new IamUserRoleAssignmentsService()
  ) {
    this.auth = new IamAuthService(this.users)
  }
}

// Alias for backward compatibility
export { IamModuleService as IamService }

export { IamAuthService } from './iam-auth.service'
export { IamRolesService } from './iam-roles.service'
export { IamUserRoleAssignmentsService } from './iam-user-role-assignments.service'
export { IamUsersService } from './iam-users.service'
